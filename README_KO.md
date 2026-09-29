# SOFTSYSTEMS — Stitched Score Redesign Patch

기존 SOFTSYSTEMS 프로젝트에 **같은 경로로 덮어쓰기** 하면 됩니다.

변경 파일:
- `components/SiteHero.js`
- `components/Navigation.js`
- `components/ArchiveCard.js`
- `app/archive/page.js`
- `app/globals.css`

## 디자인 변경
- 메인 `A caring system for creative life.`를 실로 꿰맨 듯한 stitched typography로 변경
- 전체 페이지를 warm paper + hairline + score 스타일로 변경
- Navigation을 박스 버튼 대신 얇은 score/navigation 형태로 변경
- Archive preview grid는 **모바일 포함 항상 3열 고정**
- 이미지 카드: 이미지 위 큰 글자 overlay 제거, 모서리 stitch 디테일 추가
- 텍스트 카드: 악보/노트 조각 같은 score 디자인
- Archive type에 따라 punch/stitch 디테일을 미세하게 다르게 표시
- View More 큰 버튼 제거 → 이미지/텍스트 또는 `open ↗` 클릭
- 로그인 관리 버튼은 `•••` 메뉴 안으로 이동
- 상세 modal을 앱 팝업보다 종이 한 장 같은 형태로 변경
- Attachment 목록을 구멍 + 실로 연결된 material 형태로 변경

## 적용 순서
1. 기존 프로젝트를 백업합니다.
2. 이 ZIP의 파일들을 프로젝트 루트에 같은 경로로 덮어씁니다.
3. `npm run dev`로 먼저 확인합니다.
4. 마음에 들면 commit / push 후 Vercel redeploy 합니다.

## DB / Supabase
이번 패치는 **디자인 전용**입니다.
Supabase SQL이나 테이블 수정은 필요 없습니다.

## 확인 사항
- JSX 구문 검사를 통과했습니다.
- CSS 파싱 검사를 통과했습니다.
- 현재 실행 환경에는 Linux용 Next.js SWC 바이너리가 없어 `next build` 전체 실행은 완료하지 못했습니다. 이는 소스 오류 확인과는 별개의 환경 의존성 문제입니다.
