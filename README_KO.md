# SOFTSYSTEMS — Book / Print Redesign Patch

이번 패치는 실/스티치 모티프를 전부 빼고, **아티스트북 / 인쇄물 / 타자기 활자 / 조용한 종이 페이지** 느낌으로 다시 정리한 디자인 패치입니다.

## 핵심 변경
- 실, 스티치, 자수 장식 제거
- 전체 배경을 옅은 dusty pink paper tone으로 변경
- 타자기/인쇄물 느낌의 typography 적용
- Home hero를 책의 opening spread처럼 재구성
- 작은 `·`, `×`, index fragment를 이용한 조용한 편집 리듬
- Navigation을 인쇄물의 header/index처럼 단순화
- Archive 미리보기는 **항상 3열 고정**
- Archive 이미지는 4:3 비율의 작은 인쇄 사진처럼 표시
- 카드 테두리/버튼 느낌 최소화
- 상세 modal은 앱 팝업이 아니라 종이 한 장처럼 정리
- 관리자 메뉴는 기존 `•••` 구조 유지

## 덮어쓸 파일
- `components/SiteHero.js`
- `components/Navigation.js`
- `components/ArchiveCard.js`
- `app/globals.css`

## DB / Supabase
- SQL 수정 없음
- Storage 수정 없음
- 기존 Archive attachment 기능 그대로 유지

## 적용
현재 프로젝트에서 위 4개 파일을 같은 경로에 덮어쓴 뒤 Vercel에 redeploy 하면 됩니다.

## 3열 규칙
Desktop / Tablet / Mobile 모두 Archive preview는 `repeat(3, minmax(0, 1fr))`로 유지됩니다.
