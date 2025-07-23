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
    const attachmentsData = JSON.parse(formData.get('attachments') as string) as Array<{
      id: string;
      type: 'poster' | 'itinerary' | 'letter';
      name: string;
      fileName: string;
      fileUrl: string;
    }>;
    
    console.log('이미지 URLs:', imageUrls);
    console.log('첨부파일 개수:', attachmentsData.length);
    console.log('첨부파일들:', attachmentsData.map(f => f.name));
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
        { error: 'Google Access Token이 필요합니다. 다시 로그인해주세요.', requiresReauth: true },
        { status: 401 }
      );
    }

    // 토큰 유효성 사전 검증
    try {
      const tokenInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!tokenInfoResponse.ok) {
        console.log('토큰이 만료되었거나 유효하지 않습니다.');
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 다시 로그인해주세요.', requiresReauth: true },
          { status: 401 }
        );
      }

      const tokenInfo = await tokenInfoResponse.json();
      console.log('토큰 유효성 확인 완료:', tokenInfo.email);
    } catch (tokenError) {
      console.error('토큰 유효성 검증 실패:', tokenError);
      return NextResponse.json(
        { error: '토큰이 유효하지 않습니다. 다시 로그인해주세요.', requiresReauth: true },
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
      contactPersons: Array<{ name: string; phone: string; email: string }>;
      [key: string]: unknown;
    }>;

    if (tas.length === 0) {
      return NextResponse.json(
        { error: '선택된 TA를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 각 TA의 담당자들에게 이메일 발송
    const results = [];
    for (let i = 0; i < tas.length; i++) {
      const ta = tas[i];
      
      // 담당자 이메일 목록 생성
      const contactEmails = ta.contactPersons?.map(person => person.email).filter(email => email) || [];
      const recipientEmails = contactEmails.length > 0 ? contactEmails : [ta.email]; // 담당자가 없으면 대표 이메일 사용
      
      console.log(`TA ${ta.companyName}의 수신자:`, recipientEmails);
      
      // 각 수신자에게 개별 발송
      for (const recipientEmail of recipientEmails) {
        try {
          // 이메일 메시지 구성 (MIME 형식)
          const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // HTML 콘텐츠인지 확인 (현재는 항상 HTML로 처리)
          // const isHtmlContent = content.includes('<') && content.includes('>');
          
          let emailMessage = [
            `From: ${decodedToken.email}`,
            `To: ${recipientEmail}`,
            `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
            `MIME-Version: 1.0`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            '',
            `--${boundary}`,
            `Content-Type: multipart/alternative; boundary="alt_${boundary}"`,
            '',
            `--alt_${boundary}`,
            `Content-Type: text/plain; charset=UTF-8`,
            `Content-Transfer-Encoding: 7bit`,
            '',
            // HTML 태그 제거한 텍스트 버전
            content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '),
            '',
            `--alt_${boundary}`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: 7bit`,
            '',
            content,
            '',
            `--alt_${boundary}--`,
            '',
            '---',
            `발송자: ${decodedToken.email}`,
            `회사: ${ta.companyName}`
          ].join('\r\n');

        // 첨부파일 처리
        if (attachmentsData.length > 0) {
          for (const attachmentData of attachmentsData) {
            try {
              let attachmentBuffer: Buffer;
              let attachmentName: string;
              let attachmentType: string;

              // 전단지이고 TA 로고 삽입이 선택된 경우에만 로고 오버레이 처리
              const taIndex = tas.findIndex(t => t.id === ta.id);
              const imageUrl = imageUrls[taIndex];
              
              if (includeLogo && attachmentData.type === 'poster' && imageUrl && imageUrl !== '') {
                // TA 로고가 포함된 이미지 첨부
                console.log(`TA ${ta.companyName}의 로고 포함 이미지 첨부: ${imageUrl}`);
                
                // 이미지 URL에서 파일 다운로드
                const imageResponse = await fetch(imageUrl);
                if (!imageResponse.ok) {
                  throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
                }
                
                attachmentBuffer = Buffer.from(await imageResponse.arrayBuffer());
                attachmentName = `${ta.companyName}_${attachmentData.fileName}`;
                attachmentType = 'image/png';
              } else {
                // 원본 파일 첨부 (IT, 레터 또는 로고 삽입 비활성화된 경우)
                const fileResponse = await fetch(attachmentData.fileUrl);
                if (!fileResponse.ok) {
                  throw new Error(`파일 다운로드 실패: ${fileResponse.status}`);
                }
                
                attachmentBuffer = Buffer.from(await fileResponse.arrayBuffer());
                attachmentName = attachmentData.fileName || attachmentData.name || 'attachment';
                attachmentType = attachmentData.type === 'poster' ? 'image/jpeg' : 'application/pdf';
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

        console.log('이메일 메시지 길이:', emailMessage.length);
        console.log('이메일 메시지 샘플:', emailMessage.substring(0, 500));

        // Base64 URL-safe 인코딩
        const encodedMessage = Buffer.from(emailMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');

        console.log('인코딩된 메시지 길이:', encodedMessage.length);

        // Gmail API 호출 - 이메일 발송
        console.log(`TA ${ta.companyName}에게 이메일 발송 시도:`, ta.email);
        console.log('Gmail API 호출 URL:', `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`);
        
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

        console.log(`Gmail API 응답 상태:`, response.status, response.statusText);

        if (!response.ok) {
          let errorMessage = 'Gmail API 오류';
          
          // 응답 상태 코드로 토큰 만료 확인
          if (response.status === 401) {
            errorMessage = '토큰이 만료되었습니다. 다시 로그인해주세요.';
          } else if (response.status === 403) {
            errorMessage = 'Gmail API 권한이 부족합니다.';
          } else if (response.status === 400) {
            errorMessage = '잘못된 이메일 형식입니다.';
          } else {
            errorMessage = `Gmail API 오류 (${response.status}): ${response.statusText}`;
          }
          
          console.error(`TA ${ta.companyName}에게 이메일 발송 실패:`, {
            status: response.status,
            statusText: response.statusText,
            errorMessage
          });
          
          results.push({
            ta: ta.companyName,
            email: recipientEmail,
            success: false,
            error: errorMessage
          });
        } else {
          const result = await response.json();
          results.push({
            ta: ta.companyName,
            email: recipientEmail,
            success: true,
            messageId: result.id
          });
          
          // 이메일 발송 기록 저장
          try {
            await db.collection('email_history').add({
              taId: ta.id,
              taName: ta.companyName,
              taEmail: recipientEmail,
              subject: subject,
              content: content,
              sentBy: decodedToken.uid,
              sentByEmail: decodedToken.email,
              sentAt: new Date(),
              attachments: attachmentsData.map(att => ({
                name: att.name,
                type: att.type
              })),
              includeLogo: includeLogo,
              messageId: result.id,
              success: true
            });
          } catch (historyError) {
            console.error('이메일 기록 저장 실패:', historyError);
            // 기록 저장 실패해도 이메일 발송은 성공으로 처리
          }
        }
      } catch (error) {
        console.error(`TA ${ta.companyName}의 ${recipientEmail}에게 이메일 발송 실패:`, error);
        results.push({
          ta: ta.companyName,
          email: recipientEmail,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        });
      }
    }
  }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `${successCount}개의 이메일이 발송되었습니다.${failureCount > 0 ? ` (${failureCount}개 실패)` : ''}`,
      results,
      recipients: results.map(r => ({ name: r.ta, email: r.email }))
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
} 