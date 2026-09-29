# SOFTSYSTEMS thread minimal patch

이번 패치는 이전 stitched score 리디자인을 더 정리해서,
**군더더기 없는 버전 + 더 실제 실 같은 질감**으로 조정한 버전입니다.

## 바뀐 핵심
- 메인 문구 아래에 점선 대신 **SVG thread stroke** 적용
- 실의 하이라이트 / 그림자 / 바늘구멍 / 실꼬리 추가
- 아카이브 카드의 실 표현을 **4방향 점선 코너**에서
  **2개의 실제 실 코너(anchor stitch)** 로 단순화
- 전체 장식을 줄이고 더 조용한 레이아웃으로 정리
- 아카이브 미리보기는 기존처럼 **무조건 3열 유지**

## 덮어쓸 파일
- `components/SiteHero.js`
- `components/ArchiveCard.js`
- `app/globals.css`

## 적용 후 체크
1. 홈에서 `A caring system for creative life.` 아래에 실제 실 같은 곡선이 보이는지
2. 아카이브 카드 코너에 실 고정점이 좌상단 / 우하단만 조용하게 보이는지
3. 모바일에서도 아카이브가 3열인지
4. `npm run build` 또는 Vercel redeploy 후 스타일이 정상 반영되는지
