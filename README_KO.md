# SOFTSYSTEMS deployment fix

이 버전은 직전 `nav_clean_letters` 패치의 배포 실패를 수정한 버전입니다.

## 원인
`app/globals.css` 마지막에 추가된 CSS 블록이 실제 줄바꿈이 아니라 문자 그대로 `\\n`을 포함한 채 저장되어 CSS 파싱 오류를 만들었습니다.

## 수정 사항
- `app/globals.css`의 잘못된 `\\n` 문자열 제거 및 정상 CSS로 복구
- 상단 메뉴에서 `Archive` 제거 유지
- 상단 메뉴에서 독립 `Introduce my self` 제거 유지
- `Visitor Letters` 작성 폼 바로 아래 `Introduce my self →` 링크 유지
- 상단 메뉴 폰트 확대 유지
- HEIC / HEIF 첨부 허용 유지

## 검증
- PostCSS로 `app/globals.css` 파싱 성공 확인
- `Navigation.js`에서 Archive 메뉴가 없는 것 확인
- `Visitor Letters` 폼 아래 `/introduce-my-self` 링크 확인
- Archive 첨부 accept/확장자 목록에 HEIC/HEIF 포함 확인

DB/SQL 변경은 필요 없습니다.
