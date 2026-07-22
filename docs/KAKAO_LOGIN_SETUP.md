# MoveOn 카카오 로그인 설정

MoveOn의 카카오 로그인은 다음 순서로 동작합니다.

```text
Expo 앱 → 카카오 인가 코드 → Vercel API → 카카오 사용자 확인
→ Firebase 커스텀 토큰 발급 → Firebase 로그인 → users/{uid} 사용
```

카카오 클라이언트 시크릿과 Firebase 서비스 계정 키는 앱 코드에 넣지 않습니다.
두 값은 Vercel의 서버 환경 변수에만 저장합니다.

## 1. 카카오 디벨로퍼스

1. 카카오 디벨로퍼스에서 MoveOn 애플리케이션을 만듭니다.
2. **카카오 로그인**을 활성화합니다.
3. **동의항목**에서 닉네임을 사용할 수 있도록 설정합니다.
4. **플랫폼 키 → REST API 키**를 확인합니다.
5. REST API 키의 **클라이언트 시크릿**을 발급하고 활성화합니다.
6. 다음 리다이렉트 URI를 테스트 및 배포 환경에 맞게 등록합니다.

```text
http://127.0.0.1:8081/auth/kakao
http://localhost:8081/auth/kakao
https://YOUR_WEB_DOMAIN/auth/kakao
```

실제 앱에서 표시되는 URI는 로그인 화면의 `redirectUri` 값과 정확히 같아야 합니다.

## 2. Firebase Admin 서비스 계정

Firebase 프로젝트 `moveon-25df9`에서 서비스 계정 키를 준비합니다.

- 프로젝트 설정 → 서비스 계정
- 새 비공개 키 생성
- JSON 파일의 `project_id`, `client_email`, `private_key` 값을 Vercel 환경 변수에 등록
- JSON 파일 자체는 Git에 추가하지 않음

## 3. Expo 환경 변수

로컬 `.env.local` 또는 Vercel 빌드 환경에 다음 값을 등록합니다.

```text
EXPO_PUBLIC_KAKAO_REST_API_KEY=카카오_REST_API_키
EXPO_PUBLIC_AUTH_API_URL=https://YOUR_API_DOMAIN
```

`EXPO_PUBLIC_` 값은 앱 번들에 포함되므로 시크릿을 넣으면 안 됩니다.

## 4. Vercel 서버 환경 변수

```text
KAKAO_REST_API_KEY=카카오_REST_API_키
KAKAO_CLIENT_SECRET=카카오_클라이언트_시크릿
FIREBASE_ADMIN_PROJECT_ID=moveon-25df9
FIREBASE_ADMIN_CLIENT_EMAIL=서비스_계정_이메일
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
AUTH_ALLOWED_ORIGINS=http://127.0.0.1:8081,http://localhost:8081,https://YOUR_WEB_DOMAIN
```

서버 함수 경로는 `api/auth/kakao.ts`이며 배포 후 다음 주소가 됩니다.

```text
https://YOUR_API_DOMAIN/api/auth/kakao
```

## 5. 데이터 연결 방식

- 기존 Firebase 사용자가 처음 카카오 로그인을 하면 해당 UID와 카카오 ID를 연결합니다.
- 이후 같은 카카오 계정으로 로그인하면 같은 Firebase UID를 사용합니다.
- 연결 정보는 서버 전용 `auth_identities` 컬렉션에 저장합니다.
- 앱의 사용자 데이터는 기존과 동일하게 `users/{uid}`에서 읽고 씁니다.
- 카카오 액세스 토큰은 Firestore에 저장하지 않습니다.
