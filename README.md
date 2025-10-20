# Dokdo Web – 신문 템플릿 웹캠 합성 뷰어

템플릿 이미지(예: 신문 레이아웃) 안의 **흰 박스 영역**을 자동 탐지해, **웹캠 영상을 정확히 맞춰 합성**하고  
**카운트다운 후 촬영 → 이메일로 합성 이미지를 전송**할 수 있는 간단한 웹앱입니다.

---

## ✨ 주요 기능
- 템플릿 상단의 **흰 여백 박스 자동 감지** (허용치/탐색높이/최소면적 조정 가능)
- **웹캠 자동 정렬 & Bleed(겹침)** 처리로 경계선/여백 완전 가리기
- **촬영 전 3초 카운트다운** → 템플릿 자리에 결과물 임시 표시
- 이메일 입력 → **합성 이미지 첨부 발송 (SMTP/Nodemailer)**
- 템플릿 목록 자동 로딩: `templates` 폴더에 `.png/.jpg` 넣으면 자동 반영

---

## 📦 요구 사항
- Node.js 18 이상 (권장: 20+ / 테스트 버전: 22.x)
- 카메라가 연결된 PC 또는 모바일 기기
- SMTP 계정(학교 메일, Gmail, Naver, Office365 등)
- Gmail 사용 시 **앱 비밀번호** 필요

> `getUserMedia`는 **localhost 환경**에서는 HTTPS 없이도 동작합니다.

---

## 🗂️ 폴더 구조
```
dokdo_web/
├─ server.js              # Express 서버 (API + 정적 서빙)
├─ package.json
├─ .env                   # 환경변수 (SMTP / PORT)
├─ templates/             # 템플릿 이미지(.png/.jpg) 폴더
│   ├─ newspaper.png
│   └─ ...
└─ public/
    ├─ index.html         # 템플릿 목록 페이지
    └─ viewer.html        # 웹캠 합성/촬영/이메일 전송 UI
```

---

## ⚙️ 설치 방법
```bash
# 1. 저장소 클론
git clone <repo-url>
cd dokdo_web

# 2. 의존성 설치
npm install
```

---

## 🔐 환경 변수(.env) 설정
루트 디렉터리에 `.env` 파일을 생성 후 아래 예시 중 하나를 입력하세요.  
> ⚠️ `.env`는 반드시 `.gitignore`에 추가하여 GitHub에 업로드하지 마세요.

### 공통 설정
```env
PORT=3100
FROM_EMAIL=your_email@example.com
```

### Gmail (2단계 인증 + 앱 비밀번호 필요)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com
```

> **참고:** `FROM_EMAIL`은 `SMTP_USER`와 같은 주소를 사용하는 것이 안전합니다.

---

## ▶️ 실행 방법
```bash
# Windows PowerShell
npm start

# 또는 직접 실행
set PORT=3100 && node server.js
```

성공 시 콘솔에 아래 메시지가 출력됩니다.
```
PUBLIC_DIR    = C:\workspace\dokdo_web\public
TEMPLATES_DIR = C:\workspace\dokdo_web\templates (exists)
✅ Server running: http://localhost:3100
```

---

## 🖼️ 템플릿 추가
1. `templates/` 폴더에 `.png` 또는 `.jpg` 파일을 복사합니다.
2. 브라우저에서 `http://localhost:3100` 접속 → 자동 목록 표시

---

## 🚀 사용 방법
1. `http://localhost:3100` 접속  
2. 템플릿 클릭 → **뷰어 화면** 진입  
3. **웹캠 권한 허용**
4. 필요 시 ⚙️ 버튼으로 감도 조정
5. **촬영(3초)** 버튼 클릭 → 카운트다운 후 자동 촬영
6. 템플릿 자리에 **결과 이미지 임시 표시**
7. 이메일 입력 후 **전송 버튼 클릭**
8. 전송 완료 시 화면이 자동 복귀되어 새 촬영 가능

---

## 🔌 API (내부용)
### `GET /api/templates`
템플릿 목록(JSON) 반환  
응답 예시:
```json
[
  { "name": "newspaper.png", "url": "/templates/newspaper.png" }
]
```

### `POST /api/send-email`
이미지를 첨부한 이메일 발송  
요청:
```json
{
  "to": "user@example.com",
  "subject": "신문 템플릿 합성 이미지",
  "text": "합성된 이미지를 첨부합니다.",
  "filename": "merged_123.png",
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAA..."
}
```
응답:
```json
{ "ok": true, "messageId": "<...>" }
```

---

## 🧠 작동 원리
1. 템플릿 이미지를 `<canvas>`에 로드  
2. 상단 영역에서 **Flood Fill** 방식으로 “충분히 흰색”인 영역 탐지  
3. 가장 큰 흰 박스를 **웹캠 투사 영역**으로 지정  
4. `<video>`(웹캠)을 CSS로 해당 박스에 정렬  
5. 촬영 시 템플릿 캔버스에  
   - ① 템플릿 → ② 웹캠 프레임 순으로 그림  
6. 완성된 이미지를 `dataURL`로 변환 → `/api/send-email` 로 전송  
7. 전송 완료 후 **라이브 뷰(웹캠+템플릿)** 복귀

---

## 🧩 트러블슈팅
**❌ `/api/send-email` 에서 `Unexpected token '<'` 발생**
- 라우트가 API가 아닌 HTML(index.html)로 응답된 상태  
- 주소가 반드시 `http://localhost:3100` 인지 확인  
- `server.js`의 라우팅 순서를  
  “정적 서빙 → API → viewer/index.html” 순으로 유지

**❌ 템플릿 404 (Cannot GET /templates/xxx.png)**
- `templates/` 폴더에 파일 존재 여부 확인  
- 확장자 대소문자 일치 여부 확인

**❌ 웹캠이 안 뜸**
- 브라우저에서 카메라 권한 허용 필요  
- `localhost`에서는 https 없이도 정상 작동

**❌ 메일 전송 실패**
- SMTP 정보 확인
- Gmail은 **앱 비밀번호** 필수
- 포트/SECURE 값 조정(465/true ↔ 587/false)
- 스팸함 확인

---

## 🛡️ 보안 및 배포 팁
- `.env` 파일은 **절대 커밋 금지**
- 공용망 사용 시 HTTPS 적용 또는 접근 제한 권장
- SMTP 발송량 제한 확인 (과도한 테스트 금지)

---

## 📄 라이선스
MIT License  
Copyright ©
