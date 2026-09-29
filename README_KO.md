# Archive MOV / AVI 첨부 지원 패치

Archive 첨부파일에 MOV 및 AVI 비디오 파일을 추가할 수 있도록 수정한 패치입니다.

## 변경 사항
- 파일 선택기에서 `.mov`, `.avi` 허용
- MOV MIME (`video/quicktime`) 지원
- AVI MIME (`video/x-msvideo`, `video/avi`, `video/msvideo`) 지원
- 브라우저가 MOV/AVI MIME을 비워 두거나 `application/octet-stream`으로 전달하는 경우에도 확장자를 확인해 허용
- 첨부 유형을 `Video`로 표시
- Archive 카드 첨부 요약에서도 비디오 파일을 `Video`로 표시
- 첨부 도움말에 MOV / AVI 추가

## 덮어쓸 파일
- `components/ArchiveForm.js`
- `components/ArchiveCard.js`
- `lib/archiveAttachments.js`
- `lib/i18n.js`

## 참고
기존 첨부 파일 크기 제한인 파일당 25MB는 그대로 유지했습니다.
25MB가 넘는 MOV/AVI까지 올리고 싶다면 별도로 업로드 크기 제한을 조정해야 합니다.

Supabase SQL 변경은 필요하지 않습니다.
