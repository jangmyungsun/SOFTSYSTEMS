# SOFTSYSTEMS — 메뉴 정리 + Visitor Letters 안의 Introduce my self + HEIC

이번 패치는 이전 HEIC/메뉴 가독성 패치를 포함한 통합본입니다.

## 변경사항
- 상단 메뉴에서 `Archive` 제거
  - Archive는 Input 흐름에서 접근하는 구조를 유지합니다.
- 상단 메뉴에서 독립 `Introduce my self` 제거
- `Visitor Letters` 페이지의 편지 작성 폼 바로 아래에
  `Introduce my self →` 링크 추가
- 상단 메뉴 글자 크기를 한 단계 더 키워 가독성 개선
- HEIC / HEIF 첨부 지원 유지
- 기존 MP4 / MOV / AVI / PDF / Idea / Book / Wine 등의 최신 기능 유지

## 덮어쓸 파일
- `components/Navigation.js`
- `app/letters/page.js`
- `app/globals.css`
- `components/ArchiveForm.js`
- `lib/archiveAttachments.js`
- `lib/i18n.js`

DB / SQL 변경은 필요 없습니다.
