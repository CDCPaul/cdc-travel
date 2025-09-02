import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin';
import { GmailTokenManager } from '@/lib/gmail-token-manager';
import { google } from 'googleapis';
import sharp from 'sharp';

// HTML 이스케이프 함수
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// TA 데이터 타입 정의
interface TAData {
  companyName: string;
  phone: string;
  email: string;
  logo?: string;
}

// 전단지에 TA 로고를 오버레이하는 함수
async function createPosterWithTALogo(posterUrl: string, taData: TAData): Promise<Buffer> {
  try {
    // 전단지 다운로드
    const posterResponse = await fetch(posterUrl);
    const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());
    
    // 전단지 크기 가져오기
    const posterMetadata = await sharp(posterBuffer).metadata();
    const posterWidth = posterMetadata.width || 2480;
    
    // TA 로고 오버레이 이미지 생성 (전단지 상단에 배치)
    const logoOverlayHeight = 250;
    const logoOverlayWidth = posterWidth;
    
    // 기본 흰색 배경 생성
    const logoOverlay = sharp({
      create: {
        width: logoOverlayWidth,
        height: logoOverlayHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    const composites: sharp.OverlayOptions[] = [];
    
    // TA 로고 처리 (왼쪽 정렬)
    if (taData.logo && taData.logo.startsWith('https://')) {
      try {
        // 로고 다운로드 및 리사이즈
        const logoResponse = await fetch(taData.logo);
        const logoBuffer = Buffer.from(await logoResponse.arrayBuffer());
        
        const resizedLogo = await sharp(logoBuffer)
          .resize(null, logoOverlayHeight, { 
            fit: 'inside',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer();
        
        // 로고를 왼쪽에 배치 (여백 50px)
        composites.push({
          input: resizedLogo,
          top: 0,
          left: 50
        });
      } catch (error) {
        console.error('TA 로고 처리 실패:', error);
      }
    }
    
    // TA 정보 텍스트 생성
    const textImage = await sharp({
      create: {
        width: logoOverlayWidth,
        height: logoOverlayHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
    .composite([
      {
        input: Buffer.from(`<svg width="${logoOverlayWidth}" height="${logoOverlayHeight}">
          <text x="${logoOverlayWidth - 100}" y="100" font-family="Arial, Helvetica, sans-serif" font-size="90" font-weight="bold" 
                fill="#333333" text-anchor="end">${escapeHtml(taData.companyName)}</text>
          <text x="${logoOverlayWidth - 100}" y="160" font-family="Arial, Helvetica, sans-serif" font-size="40" 
                fill="#666666" text-anchor="end">📞 ${escapeHtml(taData.phone)}</text>
          <text x="${logoOverlayWidth - 100}" y="220" font-family="Arial, Helvetica, sans-serif" font-size="40" 
                fill="#666666" text-anchor="end">✉️ ${escapeHtml(taData.email)}</text>
        </svg>`),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();
    
    composites.push({
      input: textImage,
      top: 0,
      left: 0
    });
    
    // 로고 오버레이 생성
    const logoOverlayBuffer = await logoOverlay
      .composite(composites)
      .png()
      .toBuffer();
    
    // 전단지와 로고 오버레이 합성 (WebP로 변환하여 파일 크기 최적화)
    const finalPoster = await sharp(posterBuffer)
      .composite([
        {
          input: logoOverlayBuffer,
          top: 0,
          left: 0
        }
      ])
      .webp({ quality: 85 }) // WebP로 변환, 품질 85%로 설정
      .toBuffer();
    
    return finalPoster;
  } catch (error) {
    console.error('전단지 + TA 로고 합성 실패:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const taIds = JSON.parse(formData.get('taIds') as string);
    const subject = formData.get('subject') as string;
    const content = formData.get('content') as string;
    const attachments = JSON.parse(formData.get('attachments') as string || '[]');
    
    // 디버깅: attachments 데이터 확인
    console.log('받은 attachments 데이터:', attachments);
    if (attachments.length > 0) {
      console.log('첫 번째 attachment의 fileName:', attachments[0].fileName);
      console.log('첫 번째 attachment의 type:', attachments[0].type);
    }

    if (!taIds || !Array.isArray(taIds) || taIds.length === 0) {
      return NextResponse.json(
        { error: '선택된 TA가 없습니다.' },
        { status: 400 }
      );
    }

    if (!subject || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요.' },
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
    const userId = decodedToken.uid;

    // Gmail 토큰 매니저를 사용하여 유효한 Gmail access token 가져오기 (자동 갱신 포함)
    const { token: accessToken, needsReauth } = await GmailTokenManager.getValidGmailToken(userId);
    
    if (!accessToken || needsReauth) {
      console.log('유효한 Gmail Access Token을 찾을 수 없습니다.');
      console.log('사용자 ID:', userId);
      
      // Gmail 인증 URL 생성
      const gmailAuthUrl = GmailTokenManager.generateAuthUrl(userId);
      
      return NextResponse.json(
        { 
          error: 'Gmail API 권한이 필요합니다. Gmail 권한을 허용해주세요.', 
          requiresGmailAuth: true,
          gmailAuthUrl 
        },
        { status: 401 }
      );
    }

    console.log('✅ 유효한 Google Access Token 획득 완료');

    // Firebase Admin Firestore 사용
    const db = getAdminDb();
    
    // 선택된 TA들의 이메일 주소 가져오기 (30개씩 배치로 처리)
    const tasRef = db.collection('tas');
    const emailAddresses: string[] = [];
    
    // 30개씩 나누어서 배치로 쿼리
    const batchSize = 30;
    for (let i = 0; i < taIds.length; i += batchSize) {
      const batch = taIds.slice(i, i + batchSize);
      const querySnapshot = await tasRef.where('__name__', 'in', batch).get();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          emailAddresses.push(data.email);
        }
      });
    }

    if (emailAddresses.length === 0) {
      return NextResponse.json(
        { error: '유효한 이메일 주소를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // OAuth2 클라이언트 설정 및 Gmail API 사용
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // 저장된 access token으로 인증 설정
    oauth2Client.setCredentials({
      access_token: accessToken
    });
    
    // Gmail API를 사용하여 이메일 발송
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // 실제 Gmail 서명 가져오기 시도
    let signature = '';
    try {
      // 방법 1: Gmail 설정에서 서명 가져오기 시도
      const settingsResponse = await gmail.users.settings.sendAs.list({
        userId: 'me'
      });
      
      if (settingsResponse.data.sendAs && settingsResponse.data.sendAs.length > 0) {
        const primarySendAs = settingsResponse.data.sendAs.find(sendAs => sendAs.isPrimary) || settingsResponse.data.sendAs[0];
        
        if (primarySendAs && primarySendAs.signature) {
          // 실제 Gmail 서명 사용
          signature = `
            <br><br>
            ${primarySendAs.signature}
          `;
          console.log('✅ 실제 Gmail 서명 가져오기 성공');
                 } else {
           // 기본 서명 생성
           const userEmail = primarySendAs?.sendAsEmail || '';
           const userName = userEmail.split('@')[0] || 'CDC Travel';
          signature = `
            <br><br>
            Best Regards,<br>
            ${escapeHtml(userName)}<br>
            CDC Travel System
          `;
          console.log('✅ 기본 서명 생성:', userName);
        }
      } else {
        throw new Error('Gmail 설정을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Gmail 서명 가져오기 실패:', error);
      // 실패 시 서명 없음
      signature = '';
    }

    
    // 이메일은 각 TA별로 개별 발송됨 (아래 로직에서 처리)

    // 최대 70개까지만 한 번에 발송
    if (taIds.length > 70) {
      return NextResponse.json(
        { error: '한 번에 최대 70개까지만 발송할 수 있습니다. 현재 선택된 TA 수: ' + taIds.length },
        { status: 400 }
      );
    }

    // 각 TA별로 개별 이메일 발송
    const messageIds: string[] = [];
    let successCount = 0;

    for (const taId of taIds) {
      try {
        // TA 정보 가져오기
        const taDoc = await db.collection('tas').doc(taId).get();
        if (!taDoc.exists) {
          console.warn(`TA ${taId}를 찾을 수 없습니다.`);
          continue;
        }
        
                 const taData = taDoc.data();
         if (!taData || !taData.email || typeof taData.email !== 'string') {
           console.warn(`TA ${taId}의 이메일 주소가 없습니다.`);
           continue;
         }

        // 해당 TA의 이메일 내용 생성
        let taEmailContent: string;
        
        if (attachments && attachments.length > 0) {
          // 첨부파일이 있는 경우 멀티파트 메시지
          const boundary = `boundary_${Date.now()}_${taId}`;
          
          taEmailContent = `To: ${taData.email}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/html; charset=utf-8

${content}${signature}

`;

          // 해당 TA의 첨부파일만 추가
          for (const attachment of attachments) {
            try {
              let processedBuffer: Buffer;
              let fileName: string;
              
              console.log(`처리 중인 attachment:`, {
                type: attachment.type,
                fileName: attachment.fileName,
                name: attachment.name,
                id: attachment.id
              });
              
              if (attachment.type === 'poster') {
                // 전단지인 경우: TA 로고를 오버레이한 전단지 생성
                processedBuffer = await createPosterWithTALogo(attachment.fileUrl, {
                  companyName: taData.companyName || 'Unknown',
                  phone: taData.phone || '',
                  email: taData.email,
                  logo: taData.logo
                });
                // 전단지는 WebP로 변환되므로 확장자 변경
                const originalName = attachment.fileName || attachment.name || 'poster.png';
                // 확장자 제거 후 .webp 추가
                fileName = originalName.replace(/\.[^.]*$/, '') + '.webp';
                console.log(`전단지 파일명 처리: ${originalName} -> ${fileName}`);
              } else {
                // IT/레터인 경우: 원본 파일 사용
                const fileResponse = await fetch(attachment.fileUrl);
                processedBuffer = Buffer.from(await fileResponse.arrayBuffer());
                const originalName = attachment.fileName || attachment.name || 'document';
                // 확장자가 없으면 .pdf 추가
                fileName = originalName.endsWith('.pdf') ? originalName : originalName + '.pdf';
                console.log(`IT/레터 파일명 처리: ${originalName} -> ${fileName}`);
              }
              
              const base64File = processedBuffer.toString('base64');
              
              taEmailContent += `--${boundary}
Content-Type: ${attachment.type === 'poster' ? 'image/webp' : 'application/pdf'}; name="${fileName}"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="${fileName}"

${base64File}

`;
            } catch (error) {
              console.error(`TA ${taData.companyName || 'Unknown'}의 첨부파일 처리 실패: ${attachment.fileName}`, error);
            }
          }
          
          taEmailContent += `--${boundary}--`;
        } else {
          // 일반 텍스트 메시지
          taEmailContent = `To: ${taData.email}
Subject: ${subject}
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0

${content}${signature}`;
        }

        const encodedMessage = Buffer.from(taEmailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

        const message = {
          raw: encodedMessage
        };

        // Gmail API로 개별 이메일 발송
        const response = await gmail.users.messages.send({
          userId: 'me',
          requestBody: message
        });

        if (response.data.id) {
          messageIds.push(response.data.id);
        }
        successCount++;
        
        console.log(`✅ TA ${taData.companyName || 'Unknown'} 이메일 발송 완료: ${taData.email}`);
        
      } catch (error) {
        console.error(`TA ${taId} 이메일 발송 실패:`, error);
      }
    }

    console.log(`✅ 총 ${successCount}개 TA에게 이메일 발송 완료`);

    // 발송 기록을 Firestore에 저장
    const emailRecord = {
      messageIds: messageIds,
      taIds: taIds,
      subject: subject,
      content: content,
      attachments: attachments || [],
      sentAt: new Date(),
      sentBy: decodedToken.email,
      status: 'sent',
      successCount: successCount
    };

    await db.collection('email_history').add(emailRecord);

    return NextResponse.json({
      success: true,
      messageIds: messageIds,
      sentCount: successCount,
      totalTAs: taIds.length
    });

  } catch (error) {
    console.error('이메일 발송 실패:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('token_expired')) {
        return NextResponse.json(
          { error: '토큰이 만료되었습니다. 다시 로그인해주세요.', requiresReauth: true },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: '이메일 발송에 실패했습니다.' },
      { status: 500 }
    );
  }
} 