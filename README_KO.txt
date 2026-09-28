SOFTSYSTEMS Archive 이미지 카드 미리보기 패치

원인:
- 첨부 이미지는 정상 저장되고 있었습니다.
- ArchiveCard.js는 첨부 이미지의 signed URL을 View More 모달을 열 때만 불러왔습니다.
- 카드 본문에서는 첨부 개수만 표시하고 이미지를 렌더링하지 않았습니다.

수정:
- 첫 번째 이미지 첨부의 signed URL을 카드가 표시될 때 자동으로 불러옵니다.
- 이미지가 있으면 Archive 카드의 정사각형 영역을 이미지 미리보기로 사용합니다.
- 제목/유형/날짜는 이미지 하단에 오버레이로 표시합니다.
- 이미지가 없거나 미리보기를 불러오지 못하면 기존 텍스트 카드가 그대로 유지됩니다.
- View More 안의 기존 첨부 미리보기/다운로드 기능은 유지됩니다.

적용:
1. 기존 프로젝트에 이 ZIP의 app/globals.css, components/ArchiveCard.js를 같은 경로로 덮어씁니다.
2. git commit/push 또는 Vercel redeploy 합니다.
3. DB SQL 변경은 필요 없습니다.
