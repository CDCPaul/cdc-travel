import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const taIds = JSON.parse(formData.get('taIds') as string) as string[];
    const imageUrls = JSON.parse(formData.get('imageUrls') as string) as string[];
    const includeLogo = formData.get('includeLogo') === 'true';
    const attachmentCount = parseInt(formData.get('attachmentCount') as string) || 0;
    
    // 모든 첨부파일 수집
    const attachments: File[] = [];
    for (let i = 0; i < attachmentCount; i++) {
      const attachment = formData.get(`attachment_${i}`) as File;
      if (attachment) {
        attachments.push(attachment);
      }
    }
    
    console.log('이미지 URLs:', imageUrls);
    console.log('첨부파일 개수:', attachments.length);
    console.log('첨부파일들:', attachments.map(f => f.name));
    console.log('로고 포함 여부:', includeLogo);

    if (!subject || !content || !taIds || taIds.length === 0) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin SDK를 사용하여 토큰 검증
    const auth = getAuth(initializeFirebaseAdmin());
    
    // Authorization 헤더에서 ID 토큰 추출
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(idToken);

    // 쿠키에서 Google Access Token 가져오기
    const cookies = request.headers.get('cookie');
    let accessToken = null;
    
    if (cookies) {
      const googleAccessTokenMatch = cookies.match(/googleAccessToken=([^;]+)/);
      if (googleAccessTokenMatch) {
        accessToken = decodeURIComponent(googleAccessTokenMatch[1]);
        console.log('쿠키에서 Google Access Token을 찾았습니다.');
      }
    }

    // Access Token이 없으면 클라이언트에서 새로 발급받도록 요청
    if (!accessToken) {
      console.log('쿠키에서 Google Access Token을 찾을 수 없습니다.');
      return NextResponse.json(
        { error: 'Google Access Token이 필요합니다. 다시 로그인해주세요.' },
        { status: 401 }
      );
    }

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 선택된 TA들의 이메일 주소 가져오기
    const tasRef = db.collection('tas');
    const querySnapshot = await tasRef.where('__name__', 'in', taIds).get();

    const tas = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{
      id: string;
      companyName: string;
      email: string;
      [key: string]: unknown;
    }>;

    if (tas.length === 0) {
      return NextResponse.json(
        { error: '선택된 TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 각 TA에게 이메일 발송
    const results = [];
    for (let i = 0; i < tas.length; i++) {
      const ta = tas[i];
      try {
        // 이메일 메시지 구성 (MIME 형식)
        const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        let emailMessage = [
          `From: ${decodedToken.email}`,
          `To: ${ta.email}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: 7bit`,
          '',
          content,
          '',
          '---',
          `발송자: ${decodedToken.email}`,
          `회사: ${ta.companyName}`
        ].join('\r\n');

        // 첨부파일 처리
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            try {
              let attachmentBuffer: Buffer;
              let attachmentName: string;
              let attachmentType: string;

              // JPG 파일이고 TA 로고 삽입이 선택된 경우에만 로고 오버레이 처리
              if (includeLogo && attachment.type.startsWith('image/') && imageUrls[i] && imageUrls[i] !== '') {
                // TA 로고가 포함된 이미지 첨부
                console.log(`TA ${ta.companyName}의 로고 포함 이미지 첨부: ${imageUrls[i]}`);
                
                // 이미지 URL에서 파일 다운로드
                const imageResponse = await fetch(imageUrls[i]);
                if (!imageResponse.ok) {
                  throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
                }
                
                attachmentBuffer = Buffer.from(await imageResponse.arrayBuffer());
                attachmentName = `${ta.companyName}_${attachment.name}`;
                attachmentType = 'image/png';
              } else {
                // 원본 파일 첨부 (PDF 또는 로고 삽입 비활성화된 경우)
                attachmentBuffer = Buffer.from(await attachment.arrayBuffer());
                attachmentName = attachment.name;
                attachmentType = attachment.type;
              }
              
              const attachmentBase64 = attachmentBuffer.toString('base64');
              
              emailMessage += [
                '',
                `--${boundary}`,
                `Content-Type: ${attachmentType}; name="${attachmentName}"`,
                `Content-Disposition: attachment; filename="${attachmentName}"`,
                `Content-Transfer-Encoding: base64`,
                '',
                attachmentBase64
              ].join('\r\n');
            } catch (error) {
              console.error('첨부파일 처리 실패:', error);
            }
          }
        }

        emailMessage += `\r\n--${boundary}--`;

        // Base64 URL-safe 인코딩
        const encodedMessage = Buffer.from(emailMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        // Gmail API 호출
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              raw: encodedMessage
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`TA ${ta.companyName}에게 이메일 발송 실패:`, errorData);
          results.push({
            ta: ta.companyName,
            email: ta.email,
            success: false,
            error: 'Gmail API 오류'
          });
        } else {
          const result = await response.json();
          results.push({
            ta: ta.companyName,
            email: ta.email,
            success: true,
            messageId: result.id
          });
        }
      } catch (error) {
        console.error(`TA ${ta.companyName}에게 이메일 발송 실패:`, error);
        results.push({
          ta: ta.companyName,
          email: ta.email,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `${successCount}명의 TA에게 이메일이 발송되었습니다.${failureCount > 0 ? ` (${failureCount}명 실패)` : ''}`,
      results,
      recipients: tas.map(ta => ({ name: ta.companyName, email: ta.email }))
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
} 