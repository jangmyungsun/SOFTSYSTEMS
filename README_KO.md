# Navigation font + HEIC/HEIF upload update

이번 업데이트:

- 상단 메뉴(SOFTSYSTEMS / Input / Process / Output / Archive / About / Visitor Letters / Introduce my self) 글자 크기 확대
- Language / Logout 글자도 같이 확대
- 모바일 메뉴도 기존 7px 수준에서 10.5px로 확대
- Archive 첨부에 `.heic`, `.heif` 허용
- MIME 타입 `image/heic`, `image/heif`, `image/heic-sequence`, `image/heif-sequence` 지원
- Apple 기기에서 HEIC MIME 타입이 비어 있거나 `application/octet-stream`으로 전달되는 경우도 확장자로 허용

DB / Supabase SQL 변경은 필요 없습니다.

참고: HEIC/HEIF는 업로드와 다운로드는 지원하지만, 브라우저 자체가 HEIC를 표시하지 못하는 환경에서는 카드 썸네일이 바로 보이지 않을 수 있습니다. 원본 파일은 정상 저장됩니다.
