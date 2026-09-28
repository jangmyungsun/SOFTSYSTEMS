SOFTSYSTEMS Archive Attachment Fix

원인
1) 현재 앱은 새 Archive 글을 public.archive_items에 저장합니다.
2) 앱이 기대하는 archive_attachments 컬럼은 다음과 같습니다:
   archive_id, user_id, storage_bucket, storage_path,
   original_filename, mime_type, size_bytes, attachment_type, created_at
3) 현재 Supabase에 수동으로 만든 archive_attachments는
   bucket/path/name/type/size 같은 다른 컬럼명을 사용하고,
   처음에는 archive_entries를 참조하도록 만들어졌습니다.
4) 코드 기본 bucket도 migration의 archive-files와 달리 softsystems-media였기 때문에
   DB/Storage 설계가 서로 어긋나 있었습니다.

적용 순서
1) Supabase Dashboard > SQL Editor에서
   supabase/archive_attachments_repair.sql 전체를 실행합니다.
   - 기존 호환되지 않는 archive_attachments 테이블은 삭제하지 않고
     softsystems_backup 스키마로 이동해 보존합니다.
   - 올바른 archive_attachments 테이블과 RLS 정책을 만듭니다.
   - private Storage bucket archive-files를 만들고 업로드 정책을 설정합니다.
   - PostgREST schema cache를 새로고침합니다.

2) 프로젝트에서 이 패치의 파일들을 같은 경로에 덮어씁니다.

3) Vercel에 다시 배포합니다.

변경된 동작
- Archive 첨부파일 기본 bucket을 archive-files로 통일했습니다.
- 이미지 업로드가 실패해도 새 Archive 글을 반복 생성하지 않도록,
  저장된 글을 편집 상태로 유지해 첨부파일만 다시 시도할 수 있게 했습니다.
- View More를 열면 이미지 첨부 미리보기를 자동으로 불러옵니다.

주의
- .env.local은 패치에 포함하지 않았습니다.
- 기존 archive_entries는 삭제하거나 변경하지 않습니다.
- archive_items가 현재 새 Archive 기록의 canonical table입니다.
