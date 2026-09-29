# SOFTSYSTEMS — Book/Print Light Hero Patch

이 패치는 기존 Book/Print 리디자인 위에 덮어쓰는 보정 패치입니다.

## 변경 내용
- 메인 배경을 훨씬 밝은 blush / paper tone으로 변경
- 본문/타이포 대비를 높여 가독성 개선
- `A caring system for creative life.` 제목 크기 축소
- 제목을 화면 중앙이 아니라 위쪽으로 올림
- Hero 높이를 크게 줄여 첫 화면에서 아래 Home 내용이 함께 보이도록 변경
- 제목 아래 `01 / INPUT`, `02 / PROCESS`, `03 / OUTPUT`, `04 / ARCHIVE` 완전 제거
- Hero 안의 장식용 fragment 텍스트도 제거해서 핵심 문구만 남김
- Archive 3열 규칙 및 기존 업로드/DB 기능은 변경하지 않음

## 덮어쓸 파일
- `components/SiteHero.js`
- `app/globals.css`

덮어쓴 뒤 Vercel에서 redeploy 하면 됩니다.
