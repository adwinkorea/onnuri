# 배포 가이드 — Vercel + Upstash Redis + Resend

이 사이트는 **백엔드가 없어도 그대로 동작**하고(로컬 저장 폴백),
아래 설정을 마치면 **서버에 영구 저장 + A/S 접수 이메일 알림**이 켜집니다.

---

## 0. 준비물 (모두 무료 플랜으로 시작 가능)
- GitHub 계정
- Vercel 계정 (vercel.com)
- Resend 계정 (resend.com) — 이메일 발송용

---

## 1. 코드 올리기
1. 이 폴더(onnuri)를 GitHub 저장소에 올립니다.
2. Vercel 대시보드 → **Add New → Project** → 해당 저장소 선택 → Deploy.
   - 별도 빌드 설정 없이 정적 파일 + `api/` 폴더가 자동으로 서버리스 함수로 배포됩니다.

이 단계까지만 해도 사이트는 뜨고, A/S 접수는 "로컬 저장" 폴백으로 동작합니다.
서버 저장과 이메일을 켜려면 아래를 이어서 진행하세요.

---

## 2. Redis(영구 저장) 연결 — Upstash
> 참고: 예전의 "Vercel KV"는 2024년 말 폐지되어, 지금은 Marketplace의 Upstash Redis를 씁니다.

1. Vercel 프로젝트 → **Storage** 탭 → **Marketplace** → Redis 검색 → **Upstash** 선택.
2. 안내에 따라 데이터베이스를 생성하고 프로젝트에 연결합니다.
3. 연결되면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 **자동 주입**됩니다.
   (코드가 이 이름과 Upstash 기본 이름 둘 다 인식합니다.)

---

## 3. 관리자 토큰 설정
Vercel 프로젝트 → **Settings → Environment Variables** 에 추가:

| 이름 | 값 |
|------|-----|
| `ADMIN_TOKEN` | 길고 추측 불가능한 문자열 (예: `onnuri-9f3a8c21b7...`) |

이 값이 `admin.html` 로그인 시 입력하는 비밀번호가 됩니다.
서버 저장·접수목록 조회는 이 토큰이 일치해야 동작합니다.

---

## 4. 이메일 알림 설정 — Resend
1. resend.com 가입 → **API Keys** → 키 생성 (`re_...`).
2. Vercel 환경변수에 추가:

| 이름 | 값 | 비고 |
|------|-----|------|
| `RESEND_API_KEY` | `re_...` | Resend에서 발급 |
| `AS_NOTIFY_TO` | `admin@회사.com` | 알림 받을 주소(여러 명은 콤마로) |
| `AS_NOTIFY_FROM` | `온누리 A/S <onboarding@resend.dev>` | 도메인 인증 전 테스트용 |

3. **자기 도메인으로 발송**하려면 Resend → **Domains** 에서 도메인을 추가하고
   안내된 DNS 레코드를 등록한 뒤, `AS_NOTIFY_FROM` 을 `as@회사도메인.com` 형태로 바꿉니다.
   (도메인 인증 전에는 `onboarding@resend.dev` 로만 발송 가능합니다.)

---

## 5. 환경변수 적용 후 재배포
환경변수를 추가/수정하면 **Deployments → 최신 배포 → Redeploy** 를 한 번 눌러야 반영됩니다.

---

## 동작 방식 요약
- **콘텐츠**: `admin.html`에서 저장 → `/api/content`(POST) → Redis 저장 →
  모든 방문자가 페이지 접속 시 `/api/content`(GET)로 최신값을 받음.
- **A/S 접수**: `as.html` 제출 → `/api/submissions`(POST) → Redis 저장 + 관리자 이메일 발송.
- **접수 목록**: `admin.html`의 "A/S 접수내역" 탭 → `/api/submissions`(GET, 토큰 필요).
- **접수 상태 변경**: 관리자 탭에서 상태 선택 후 저장 → `/api/submissions`(PATCH, 토큰 필요).
- **처리 메모(댓글)**: 접수마다 메모를 여러 개 시간순으로 추가·삭제 → `/api/submissions`(PATCH: addMemo / deleteMemoId).
- **접수 삭제**: 관리자 탭의 삭제 버튼 → `/api/submissions`(DELETE, 토큰 필요).
- 서버가 없거나 토큰이 없으면 모든 기능이 **localStorage 폴백**으로 동작(데모용).

## 비용 안내 (2026년 기준, 변동 가능)
- Vercel Hobby: 개인/소규모 무료
- Upstash Redis: 일정 요청 수까지 무료 한도 제공
- Resend: 월 3,000건까지 무료

정확한 최신 한도는 각 서비스의 요금 페이지에서 확인하세요.

## 보안 참고
- `ADMIN_TOKEN`은 클라이언트가 헤더로 전송합니다. HTTPS(Vercel 기본)에서 전송 중 암호화되지만,
  관리자 페이지에 접근 가능한 사람만 토큰을 알도록 관리하세요.
- 더 엄격한 보안이 필요하면 추후 세션/OAuth 기반 로그인으로 확장할 수 있습니다.
