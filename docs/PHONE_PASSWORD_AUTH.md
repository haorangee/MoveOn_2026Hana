# 전화번호 아이디 + 비밀번호 로그인

MoveOn의 MVP에서는 전화번호를 사용자에게 보이는 로그인 아이디로 사용하고,
실제 인증은 Firebase Authentication의 이메일/비밀번호 방식으로 처리합니다.
따라서 전화번호 로그인에는 Vercel 서버 주소나 별도의 비밀번호 저장 서버가 필요하지 않습니다.

## 동작 흐름

```text
010 1234 5678 입력
→ +821012345678 형식으로 정규화
→ SHA-256으로 내부 로그인 ID 생성
→ Firebase 이메일/비밀번호 인증
→ users/{uid} 데이터 사용
```

내부 로그인 ID는 다음과 같은 형태이며 사용자 화면에는 표시하지 않습니다.

```text
phone_<sha256>@phone.moveon.app
```

Firebase가 비밀번호 저장과 검증을 담당하며 앱과 Firestore에는 비밀번호를 저장하지 않습니다.

## Firebase에서 필요한 설정

Firebase Console에서 다음 항목만 활성화합니다.

```text
Authentication
→ Sign-in method
→ Email/Password
→ 사용 설정
```

전화번호 로그인에는 `EXPO_PUBLIC_AUTH_API_URL`, Firebase Admin 서비스 계정,
`PHONE_AUTH_PEPPER`가 필요하지 않습니다. Kakao 로그인을 함께 사용할 때만 Kakao API용
서버 주소와 Firebase Admin 설정이 별도로 필요합니다.

## 현재 번호 형식

MVP에서는 대한민국 휴대전화 번호만 받습니다.

```text
010 1234 5678
```

공백과 하이픈은 제거한 뒤 동일한 번호가 항상 동일한 내부 로그인 ID가 되도록 변환합니다.

## 현재 MVP의 제한

- SMS 인증을 보내지 않으므로 실제 전화번호 소유권은 확인하지 않습니다.
- 내부 로그인 ID는 실제 이메일이 아니어서 Firebase 이메일 비밀번호 재설정을 사용할 수 없습니다.
- 서비스 공개 전에는 최초 가입 SMS 인증과 전화번호 기반 비밀번호 재설정 기능을 추가해야 합니다.
- 같은 기기에서 익명 사용자로 쌓은 데이터는 회원가입 시 인증 정보를 연결하여 기존 UID에 유지합니다.
