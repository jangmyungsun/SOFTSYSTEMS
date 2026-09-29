# Introduce my self 페이지 패치

이번 패치는 현재 최신 SOFTSYSTEMS 소스(MP4/Idea/Book/Wine/PDF preview 포함) 기준입니다.

## 추가된 기능

- 상단 Navigation에서 `Visitor Letters` 다음에 `Introduce my self` 링크 추가
- 새 페이지: `/introduce-my-self`
- 요청한 한국어 자기소개 전체를 기본 내용으로 표시
- 로그인 상태에서는 페이지 우측 상단에 `Edit` 버튼 표시
- `Edit` → 내용 수정 → `Save`로 Supabase에 영구 저장
- 간단한 Markdown 지원
  - `**굵게**`
  - `*기울임*`
  - `[링크](https://...)`
- 페이지 방문 통계에서도 `/introduce-my-self`가 `Introduce my self`로 표시

## 먼저 한 번 실행할 SQL

Supabase SQL Editor에서 아래 파일을 **한 번만** 실행해 주세요.

`supabase/introduce_my_self_page.sql`

이 SQL은 `public.site_pages` 테이블을 만들고, 페이지는 누구나 읽을 수 있지만 수정은 로그인한 소유자 계정이 하도록 설정합니다. 최초 저장 시 해당 페이지가 그 로그인 계정에 귀속됩니다.

## 덮어쓸 / 추가할 파일

- `app/introduce-my-self/page.js` (새 파일)
- `components/Navigation.js`
- `app/api/visitors/stats/route.js`
- `app/globals.css`
- `supabase/introduce_my_self_page.sql` (새 migration)

DB migration을 실행하지 않아도 기본 자기소개 문구는 화면에 보이지만, **Edit → Save로 영구 저장하려면 SQL 실행이 필요합니다.**
