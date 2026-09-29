# Reflection → Idea + PDF 첫 페이지 미리보기 수정

이번 패치는 두 가지 문제를 실제 동작 기준으로 다시 수정한 버전입니다.

## 1. Reflection → Idea

- Archive 전체 페이지뿐 아니라 홈의 Latest Archive 카드에도 기존 `reflection` 값이 `Idea / 아이디어 / アイデア`로 표시됩니다.
- `Reflection`, `reflection`, 공백/대소문자 차이가 있어도 모두 `idea`로 정규화합니다.
- 새 글/편집 폼에서도 Reflection은 더 이상 타입으로 노출되지 않습니다.
- 기존 DB 값을 실제로 `idea`로 바꾸고 싶을 때만 `supabase/reflection_to_idea.sql`을 한 번 실행하면 됩니다. UI 표시에는 SQL 실행이 필수는 아닙니다.

## 2. PDF 첫 페이지 미리보기

이전 iframe 방식 대신 PDF.js로 PDF 1페이지를 canvas에 직접 렌더링하도록 변경했습니다.

- Archive 카드 커버: PDF 첫 페이지 자동 표시
- 상세 모달 첨부 목록: PDF 첫 페이지 썸네일 표시
- private `archive-files`도 동작하도록, 서버 API가 권한 확인 후 PDF 원본을 same-origin으로 전달합니다.
- PDF.js는 브라우저에서 cdnjs를 통해 로드됩니다.

## 덮어쓸 파일

- `components/PdfFirstPagePreview.js` (신규)
- `components/ArchiveCard.js`
- `components/ArchiveForm.js`
- `app/api/archive/attachments/[id]/route.js`
- `app/archive/page.js`
- `app/page.js`
- `app/globals.css`
- `lib/i18n.js`

선택 사항:
- `supabase/reflection_to_idea.sql`

DB/Storage 구조 변경은 없습니다.
