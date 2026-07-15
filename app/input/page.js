import Link from "next/link";

const INPUT_ITEMS = [
  {
    href: "/archive",
    eyebrow: "Archive",
    title: "Writing and Media",
    description:
      "Essays, reflections, project logs, videos, and references collected as a long-term memory layer.",
    action: "Open Archive",
  },
  {
    href: "/daily",
    eyebrow: "Daily",
    title: "Body and Practice",
    description:
      "Body state, environment, Body Moving, making, learning, artistic input, observation, and daily attachments.",
    action: "Open Daily",
  },
];

export default function InputPage() {
  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Input
        </p>

        <h2>
          Records entering the
          system
        </h2>

        <p className="subtitle">
          Archive holds longer
          thoughts and media.
          Daily records the
          changing conditions of
          the body, environment,
          and artistic practice.
        </p>
      </section>

      <section className="grid two">
        {INPUT_ITEMS.map(
          (item) => (
            <article
              className="panel"
              key={item.href}
            >
              <p className="eyebrow">
                {item.eyebrow}
              </p>

              <h2>
                {item.title}
              </h2>

              <p className="subtitle">
                {item.description}
              </p>

              <div className="actions">
                <Link
                  href={item.href}
                  className="primary"
                >
                  {item.action}
                </Link>
              </div>
            </article>
          )
        )}
      </section>
    </>
  );
}
