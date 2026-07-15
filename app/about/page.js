import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          About
        </p>

        <h1>
          Jang Myung Sun
        </h1>

        <p className="subtitle">
          Sound-based media artist translating bodily states,
          sensations, and everyday environments into sound,
          image, text, video, performance, and digital systems.
        </p>
      </section>

      <section className="panel">
        <h2>
          Artist Statement
        </h2>

        <p>
          My practice begins with observing the body.
          Rather than treating the body as a subject to represent,
          I approach it as a living system that continuously senses,
          adapts, remembers, and responds.
        </p>

        <p>
          Through sound, writing, moving images,
          performance, and digital tools,
          I translate these subtle changes into
          forms that can be revisited,
          connected, and shared.
        </p>

        <p>
          SOFTSYSTEMS is an evolving ecology for
          observing relationships among the body,
          environment, memory, and artistic practice.
          Instead of measuring productivity,
          it supports long-term observation of
          creative life through accumulated records.
        </p>
      </section>

      <section className="panel">
        <h2>
          Contact
        </h2>

        <div className="grid two">
          <div>
            <p className="label">
              Email
            </p>

            <a href="mailto:jangms5999@gmail.com">
              jangms5999@gmail.com
            </a>
          </div>

          <div>
            <p className="label">
              Instagram
            </p>

            <a
              href="https://www.instagram.com/jangmyungsun_/"
              target="_blank"
              rel="noreferrer"
            >
              @jangmyungsun_
            </a>
          </div>

          <div>
            <p className="label">
              Portfolio
            </p>

            <a
              href="https://617068.cargo.site/"
              target="_blank"
              rel="noreferrer"
            >
              617068.cargo.site ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
