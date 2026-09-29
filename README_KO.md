# Archive Book Type 추가 패치

New Archive의 Type에 `Book`을 추가했습니다.

적용 파일:
- `components/ArchiveForm.js`
- `app/archive/page.js`
- `lib/i18n.js`

변경 내용:
- New Archive 타입 목록에 `Book` 추가
- Archive 필터에도 `Book` 추가
- EN/KO/JA 타입 라벨 추가
- Archive 설명 문구에도 books/책 반영

DB 스키마 변경은 필요 없습니다. 현재 Archive type 값은 텍스트로 저장되므로 `book` 값이 그대로 저장됩니다.
