"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabaseClient";

const PAGE_SLUG = "introduce-my-self";

const DEFAULT_INTRO_CONTENT = `# **주의:** 아래 내용은 고정되지 않고, 시시때때 날씨처럼 (주로 미세하게 혹은 갑자기) 바뀝니다.

안녕하세요. 뉴저지에 거주하는 Mia입니다.

한국에서는 음악가 장명선으로 알려져 있고,
미국에서는 JB의 아내이자 학생인 Mia로 더 잘 알려져 있습니다.

지금까지 세 장의 정규 앨범과 여러 장의 EP들을 만들었습니다.
https://open.spotify.com/artist/6BRirj67zyI1xxe01j9JXr

주로 음악을 만들지만, 최근에는 영상이나 몸의 움직임을 통해 작업하기도 합니다.

아버지는 텍스타일 염색일을 평생 하셨고, 저는 학부에서 패션디자인을 전공했습니다.
그래서인지 무언가를 잇고 엮는 일, 그리고 촉각적인 감각에 자연스럽게 관심이 많고, 스스로도 그러한 감각이 비교적 예민한 편이라고 생각합니다.

저는 산책, 기록, 아카이빙, 수집, 몸 움직이기, 관찰, 창작, 바느질, 자연 염색, 느린 요리, 요가(한국에서 약 2년간 요가 강사로 활동), 차, 명상, 라이트한 산미의 드립 커피, 내추럴 와인, 모든 종류의 생물(인간 포함), 목욕, 돌보는 일, 침실, 인적 드문 미술관이나 영화관을 좋아합니다.
오래된 엘피와 아트북을 수집하는 것도 좋아합니다.

퍼스널 요가 지도, 인요가 지도, 명상 지도 자격증이 있으며, 한국 전통 다례 과정을 수료했습니다.

Miranda July와 Agnes Martin의 광팬입니다.

Raffaella della Olga를 올해 직접 만나고, 그녀에 대해서 공부하고 있습니다. 그리고 좋은 유머 감각이란 무엇인지 많이 생각하고 있습니다.

(2026년 상반기에는 신유물론 관련 서적, 집안의 작은 기계들(세탁기, 오븐, 재봉틀, 밥솥, 리모컨 등), 새, 전나무, 이태리 포플러 나무, 클래식 음악, Ann Hamilton의 작업, AI와 코딩, 정보공학에 관심이 있었고 지금은 흥미가 그때보다는 떨어진 상태입니다.)

말하기보다는 읽고, 쓰고, 듣는 일이 더 편하게 느껴집니다.

미국에 와서도 영어를 말하는 것은 여전히 어렵지만, 듣기와 읽기는 비교적 수월했습니다. 쓰는 일은 좋아해서 계속 연습 중입니다.

저는 평소에 말이 적은 편은 아니지만, 그럼에도 발화로서의 언어가 버겁게 느껴질 때가 많습니다.

그래서 느낌으로 저를 잘 알아차리는 오래된 친구들을 좋아합니다.
새로운 관계에서는 오히려 말이 많은 사람을 선호하는 편입니다.
첫 만남에서는 편안한 분위기가 아니라면 쉽게 말을 꺼내지 못하기 때문입니다.

좋아하는 계절은 여름입니다.
봄에는 무엇을 해도 기분이 좋아 걷고, 하동 세작을 미리 주문합니다.
여름에는 가지 요리를 해먹고, 요가 수련과 음악 작업을 많이 합니다.
가을에는 낯선 소품샵을 구경하거나 갤러리, 좋은 카페에서 시간을 보냅니다. 여름이 가기 전에는 백차와 우롱차를 자주 마시고, 내추럴 와인에 빠지는 계절이기도 합니다.
겨울은 아직까지는 무언가를 하기보다 사색하게 되는 계절입니다.

좋아하는 영화는 셀 수 없이 많지만,
*패터슨* (2016), *더 드라마* (2016), *업* (2009), *어바웃 타임* (2013), *아멜리에* (2001), *베를린 천사의 시* (1987), *유 앤 미 앤 에브리원 위 노우* (2005), *에브리원 세즈 아이 러브 유* (1996), *솔라리스* (1972), *문라이즈 킹덤* (2012), *원령공주* (1997), *백만엔걸 스즈코* (2008), *애니 홀* (1977), *우리도 사랑일까?* (2011) 등을 좋아합니다.

좋아하는 감독은 미란다 줄라이, 우디 앨런입니다.

좋아하는 음악가 역시 많지만, 모트 가슨, 레이몬트 스콧, 엘리안 라디그, 이치코 아오바, Luca Delphi, 하루카 나카무라, 브라이언 이노, 시와, Vashti Bunyan, múm, Piero Piccioni, The Books, Colleen을 좋아합니다.

맑거나 중립적인 결의 앰비언트나 포크음악을 선호하며, 초기 전자음악도 즐겨 듣습니다.
요즘은 낭만적이고 따뜻한 여름의 감각을 가진 브라질 음악에 빠져 있습니다.

좋아하는 향수 브랜드는 이솝, 의류 브랜드는 티크(한국), 르메르(프랑스), nongrak(태국), 베이스레인지(덴마크와 프랑스), 네넷(일본)이며, 스토리가 있는 빈티지 의류를 좋아합니다. (그래서 친구의 헌 옷을 받아오는 것도 좋아합니다.)

좋아하는 미술 작가는 아그네스 마틴, 루스 아사와, 그리고 한국의 브랜드 ivoryandgray를 운영하시는 왕혜원, 임수정님입니다.

좋아하는 글 작가는 메리 올리버, 앤 패디먼, 애니 딜라드, 리베카 솔닛, 한강, 수전 케인, 그리고 김사과, 최영건입니다. 주로 미국 여성 작가들을 좋아하며, 한국에서는 김혜순 시인과 이제니 시인을 특히 좋아합니다. 하루키의 소설은 크게 와닿지 않지만, 수필은 매우 좋아합니다.

좋아하는 사진가는 리네케 다익스트라입니다.
낸 골딘도 좋아하지만, 그의 사진을 깊이 들여다보는 편은 아닙니다.

좋아하는 도자기 브랜드는 파도의 거품들, 이스트스모크, 무재세라믹, 소일베이커입니다.

오노 요코는 음악가로서는 잘 모르겠다고 느끼지만, 그의 책 *그레이프프루트* (1964)는 훌륭하다고 생각합니다.

이전에는 버트런드 러셀, 사르트르, 지젝 같은 비판·해체적 철학자들을 좋아했지만, 요즘은 자주 찾지 않습니다. 대신 관계, 생성, 연결, 흐름을 다루는 도나 해러웨이, 제인 베넷, 들뢰즈와 가타리의 철학을 좋아합니다. 이러한 사유들이 제가 흥미롭게 여기는 범신론, 요가 수트라, 불교 철학, 우주과학과도 조금은 맞닿아 있다고 느낍니다.

좋아하는 초콜릿 브랜드는 Lindt입니다.
좋아하는 빵은 뉴저지 팰리세이드 파크의 Belle Journee에서 파는 크림 소보로 크루아상입니다.

이 블로그는 순간적으로 떠오른 생각이나 기억하고 싶은 것들, 그리고 가끔의 일기를 자유롭게 기록해두는 공간입니다.

마치 포스트잇처럼요.
내용은 다소 길고 장황할 수 있으며, 맥락이 없을 수도 있습니다.

정리된 이미지나 작업을 보고 싶으시다면,
아래의 인스타그램과 유튜브를 방문해 주세요.

Instagram (음악가 공식 계정)
[@jangmyungsun_](https://www.instagram.com/jangmyungsun_/)

YouTube
[https://www.youtube.com/@jangmyungsun](https://www.youtube.com/@jangmyungsun)`;

function parseInline(text) {
  const tokens = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }

    const value = match[0];

    if (value.startsWith("**") && value.endsWith("**")) {
      tokens.push(<strong key={`strong-${key++}`}>{value.slice(2, -2)}</strong>);
    } else if (value.startsWith("*") && value.endsWith("*")) {
      tokens.push(<em key={`em-${key++}`}>{value.slice(1, -1)}</em>);
    } else if (value.startsWith("[")) {
      const linkMatch = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
      if (linkMatch) {
        tokens.push(
          <a key={`link-${key++}`} href={linkMatch[2]} target="_blank" rel="noreferrer">
            {linkMatch[1]}
          </a>
        );
      } else {
        tokens.push(value);
      }
    } else {
      tokens.push(
        <a key={`url-${key++}`} href={value} target="_blank" rel="noreferrer">
          {value}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }

  return tokens;
}

function renderBlock(block, index) {
  const lines = block.split("\n");
  const firstLine = lines[0] || "";

  if (firstLine.startsWith("# ")) {
    return (
      <h2 className="introduce-note" key={`block-${index}`}>
        {parseInline(firstLine.slice(2))}
      </h2>
    );
  }

  return (
    <p key={`block-${index}`}>
      {lines.map((line, lineIndex) => (
        <Fragment key={`line-${lineIndex}`}>
          {parseInline(line)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </Fragment>
      ))}
    </p>
  );
}

function IntroContent({ content }) {
  const blocks = useMemo(
    () => String(content || "").split(/\n\s*\n/g).filter((block) => block.trim()),
    [content]
  );

  return <div className="introduce-copy">{blocks.map(renderBlock)}</div>;
}

export default function IntroduceMySelfPage() {
  const [session, setSession] = useState(null);
  const [content, setContent] = useState(DEFAULT_INTRO_CONTENT);
  const [draft, setDraft] = useState(DEFAULT_INTRO_CONTENT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("site_pages")
        .select("content")
        .eq("slug", PAGE_SLUG)
        .maybeSingle();

      if (!cancelled) {
        if (loadError) {
          console.error("Introduce my self load error:", loadError);
          setContent(DEFAULT_INTRO_CONTENT);
          setDraft(DEFAULT_INTRO_CONTENT);
        } else {
          const nextContent = data?.content?.trim() ? data.content : DEFAULT_INTRO_CONTENT;
          setContent(nextContent);
          setDraft(nextContent);
        }
        setLoading(false);
      }
    }

    loadPage();

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  function beginEdit() {
    setDraft(content);
    setEditing(true);
    setStatus("");
    setError("");
  }

  function cancelEdit() {
    setDraft(content);
    setEditing(false);
    setStatus("");
    setError("");
  }

  async function saveContent() {
    if (!session?.user) {
      setError("로그인 후 수정할 수 있습니다.");
      return;
    }

    const clean = draft.trim();

    if (!clean) {
      setError("내용을 비워둘 수 없습니다.");
      return;
    }

    setSaving(true);
    setError("");
    setStatus("");

    const { error: saveError } = await supabase.from("site_pages").upsert(
      {
        slug: PAGE_SLUG,
        title: "Introduce my self",
        content: clean,
        user_id: session.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    if (saveError) {
      console.error("Introduce my self save error:", saveError);
      setError(
        saveError.message ||
          "저장하지 못했습니다. Supabase migration이 적용되었는지 확인해 주세요."
      );
      setSaving(false);
      return;
    }

    setContent(clean);
    setDraft(clean);
    setEditing(false);
    setSaving(false);
    setStatus("저장했습니다.");
  }

  return (
    <section className="panel introduce-page">
      <div className="introduce-header">
        <div>
          <p className="eyebrow">PERSONAL NOTE</p>
          <h1>Introduce my self</h1>
        </div>

        {session?.user ? (
          <div className="introduce-editor-actions">
            {editing ? (
              <>
                <button type="button" className="button ghost" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="button" onClick={saveContent} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <button type="button" className="button ghost" onClick={beginEdit}>
                Edit
              </button>
            )}
          </div>
        ) : null}
      </div>

      {status ? <p className="introduce-status">{status}</p> : null}
      {error ? <p className="introduce-error">{error}</p> : null}

      {editing ? (
        <div className="introduce-editor">
          <p className="muted">
            간단한 Markdown을 사용할 수 있어요: **굵게**, *기울임*, [링크](https://example.com)
          </p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={42}
            spellCheck={false}
          />
        </div>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <IntroContent content={content} />
      )}
    </section>
  );
}
