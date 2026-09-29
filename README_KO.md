# SOFTSYSTEMS — Archive First / Readable Home Patch

이번 수정은 Home에서 **Archive가 실제로 가장 먼저 보이도록 순서를 변경**한 버전입니다.

변경사항:
- Hero 바로 아래에 Latest Archive 배치
- Practice Rhythm / Body Weather / Energy Tone / Current Mode는 Archive 아래의 얕은 상태 스트립으로 축소
- Soft Suggestion도 같은 상태 스트립 안에 압축
- Hero 높이/제목 크기 추가 축소
- 본문/제목 폰트를 SUIT 기반으로 바꿔 가독성 개선
- typewriter 느낌은 작은 metadata와 label에만 유지
- Archive는 기존대로 3열 유지
- Supabase/첨부/데이터 로직 변경 없음

덮어쓸 파일:
- `app/page.js`
- `app/globals.css`

SQL 실행은 필요 없습니다. 덮어쓴 뒤 Vercel 재배포만 하면 됩니다.
