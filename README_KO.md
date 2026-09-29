# PDF 첫 페이지 미리보기 업데이트

- Archive에 PDF를 첨부하면 Archive 카드의 커버 영역에 PDF 1페이지를 미리보기로 표시합니다.
- 이미지와 PDF를 함께 첨부한 경우 PDF 1페이지를 우선 커버로 사용하고, PDF가 없을 때 이미지를 사용합니다.
- Archive 상세 모달의 PDF 첨부 목록에서도 1페이지 미리보기가 표시됩니다.
- PDF 미리보기는 기존 private `archive-files` 버킷을 그대로 사용하며, signed URL로 렌더링됩니다.
- PDF 뷰어가 추가 범위 요청을 안정적으로 처리하도록 signed URL 유효시간을 60초에서 10분으로 늘렸습니다.
- DB/SQL 변경은 없습니다.

덮어쓸 파일:
- `components/ArchiveCard.js`
- `lib/archiveAttachments.js`
- `app/api/archive/attachments/[id]/route.js`
- `app/globals.css`
