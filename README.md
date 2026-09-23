# 🍬 JELLY LAND — 피아니스트 조젤리 프로필 월드

픽셀 오픈월드 형식의 조젤리 프로필 사이트입니다.
회원가입(이메일 + 비밀번호) → 캐릭터 만들기 → 광장을 돌아다니며 사진 · 앨범 · 영상 구경 → 팬 라운지에서 실시간 채팅.

## 폴더 구조

```
jellyland/
├─ netlify.toml               ← Netlify 설정
├─ package.json
├─ netlify/functions/api.mjs  ← 회원가입/로그인/접속자/채팅 서버 (Netlify Functions + Blobs)
└─ public/                    ← 게임 화면
   ├─ index.html
   ├─ css/style.css
   ├─ js/config.js            ← ★ 프로필·사진·앨범·영상 내용은 여기서 수정
   ├─ js/game.js, world.js, avatar.js, api.js
   └─ img/photos/             ← ★ 사진·앨범 커버 파일을 여기에 넣으세요
```

## Netlify에 배포하기

> 회원가입/로그인/채팅이 서버 함수로 동작하기 때문에 **"폴더 끌어다 놓기(Netlify Drop)" 방식은 쓸 수 없어요.**
> 아래 두 방법 중 하나로 배포하세요. 별도 데이터베이스 가입은 필요 없습니다 (Netlify Blobs가 자동으로 켜져요).

### 방법 A — GitHub 연결 (추천, 이후 수정이 편함)
1. GitHub에 새 저장소를 만들고 이 폴더 전체를 올립니다.
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub** → 저장소 선택
3. 설정은 `netlify.toml`이 자동으로 채워줍니다. **Deploy** 클릭!
4. 이후 GitHub에 파일을 수정해 올리면 자동으로 다시 배포돼요.

### 방법 B — Netlify CLI
```bash
npm install -g netlify-cli
cd jellyland
npm install
netlify login
netlify deploy --prod      # 처음엔 "Create & configure a new site" 선택
```

## 조젤리(아티스트) 계정 설정

Netlify 사이트 → **Site configuration → Environment variables** 에서 추가:

| 이름 | 값 | 설명 |
|---|---|---|
| `ARTIST_EMAILS` | `조젤리가_가입할_이메일` | 이 이메일로 가입한 계정은 👑 왕관 + 핑크 이름표, 라운지 **공지 등록** · **메시지 삭제** 가능 (여러 개면 쉼표로 구분) |
| `JWT_SECRET` | 아무 긴 랜덤 문자열 | (선택) 로그인 토큰 서명 키. 비워두면 자동 생성돼요 |

환경변수 추가 후에는 **Deploys → Trigger deploy** 로 한 번 다시 배포해주세요.

## 내용 바꾸기 (`public/js/config.js`)

- **프로필**: `artist.bio`, `artist.photo`, `artist.links`
- **포토 갤러리**: 사진을 `public/img/photos/`에 넣고 `photos` 목록에 `{ src: "img/photos/파일명.jpg", caption: "설명" }` 추가
- **앨범 기록관**: `albums` 목록 (현재는 예시 데이터예요 — 실제 발매 정보로 바꿔주세요)
- **젤리 시네마**: `videos` 목록에 유튜브 영상 ID(주소의 `v=` 뒤 11자리)와 제목

## 조작법
- 이동: 방향키 / WASD, 또는 바닥 클릭 · 모바일은 조이스틱
- 입장/보기: 문 앞에서 **E** 또는 **스페이스** (모바일 **A** 버튼) · 건물을 클릭하면 자동으로 걸어가서 들어가요
- 중앙 무대의 조젤리를 클릭하면 프로필이 열려요

## 참고
- 파일만 열어서 보면(서버 없이) **DEMO MODE**로 실행돼요. 이때 계정은 그 브라우저에만 저장되고 다른 접속자는 보이지 않아요.
- 비밀번호는 scrypt로 암호화되어 저장되고, 원문은 저장되지 않아요.
- 비밀번호 찾기(이메일 발송) 기능은 포함되어 있지 않아요.
