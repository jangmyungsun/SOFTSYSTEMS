# SOFTSYSTEMS warm overview first patch

이번 패치는 홈 화면에서 상태 요약을 Archive 위로 올리고, 가독성을 조금 키우며,
배경을 더 밝고 노란 기가 살짝 도는 핑크/크림 종이색으로 조정합니다.

## 변경점
- Practice Rhythm / Body Weather / Energy Tone / Current Mode / Soft Suggestion을 **Latest Archive 위로 이동**
- 해당 영역의 라벨, 수치, 설명, Soft Suggestion 텍스트를 한 단계 크게 조정
- 배경색을 `#f8efe4` 중심의 warm blush / cream 톤으로 변경
- 기존 Archive 3열 및 Supabase/첨부 기능은 그대로 유지

## 덮어쓸 파일
- `app/page.js`
- `app/globals.css`

적용 후 Vercel에서 재배포하세요.
