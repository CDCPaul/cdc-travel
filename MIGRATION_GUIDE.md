# Firebase Storage 권한 문제 해결 가이드

## 문제 상황
Firebase Storage에서 `storage/unauthorized` 오류가 발생하는 문제를 해결하기 위해 이메일 기반 인증에서 UID 기반 인증으로 마이그레이션합니다.

## 해결 방법

### 1단계: Firebase Console에서 관리자 UID 확인

1. **Firebase Console** 접속
2. **Authentication** → **Users** 탭으로 이동
3. 관리자 계정들의 **UID**를 복사하여 메모

### 2단계: 관리자 사용자 생성

1. **관리자 패널** 접속: `/admin/migrate-users`
2. 각 관리자에 대해:
   - **UID**: Firebase Console에서 복사한 UID 입력
   - **이메일**: 해당 관리자의 이메일 입력
   - **이름**: 선택사항 (입력하지 않으면 이메일에서 추출)
   - **"관리자 사용자 생성"** 버튼 클릭

### 3단계: Firebase Storage 보안 규칙 업데이트

1. **Firebase Console** → **Storage** → **Rules** 탭으로 이동
2. 기존 규칙을 다음으로 교체:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 관리자 권한 확인 함수
    function isAdmin(uid) {
      return uid != null && 
             exists(/databases/$(firestore.default)/documents/users/$(uid)) &&
             get(/databases/$(firestore.default)/documents/users/$(uid)).data.role == 'admin';
    }
    
    // 인증된 사용자만 읽기 가능
    match /{allPaths=**} {
      allow read: if request.auth != null;
      
      // 관리자만 쓰기 가능
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }
  }
}
```

3. **"Publish"** 버튼 클릭

### 4단계: 테스트

1. 관리자 계정으로 로그인
2. 이미지 업로드 기능 테스트 (스팟 관리, 배너 관리 등)
3. 업로드가 정상적으로 작동하는지 확인

## 변경된 코드 구조

### 기존 (이메일 기반)
```typescript
// lib/admin-config.ts
export function isAdmin(email: string | null): boolean {
  return ADMIN_EMAILS.includes(email);
}
```

### 변경 후 (UID 기반)
```typescript
// lib/admin-config.ts
export async function checkAdminRole(uid: string | null): Promise<boolean> {
  const userDoc = doc(db, 'users', uid);
  const userSnap = await getDoc(userDoc);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    return userData.role === 'admin';
  }
  
  return false;
}
```

## Firestore 데이터 구조

### users 컬렉션
```javascript
{
  "uid": "user1234567890abcdef",
  "email": "admin@example.com",
  "name": "관리자",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 주의사항

1. **기존 이메일 기반 함수는 호환성을 위해 유지**됩니다
2. **점진적 마이그레이션**이 가능합니다
3. **모든 관리자 사용자를 생성한 후** Storage 규칙을 업데이트하세요
4. **테스트 후 문제가 없으면** 기존 이메일 기반 코드를 제거할 수 있습니다

## 문제 해결

### 마이그레이션 후에도 권한 오류가 발생하는 경우

1. **Firestore 데이터 확인**: `/admin/migrate-users`에서 "관리자 권한 확인" 기능 사용
2. **Storage 규칙 확인**: Firebase Console에서 규칙이 올바르게 적용되었는지 확인
3. **브라우저 캐시 클리어**: 로그아웃 후 다시 로그인
4. **Firebase Console 로그 확인**: Storage → Rules → Logs에서 오류 메시지 확인 