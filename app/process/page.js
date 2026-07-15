import Link from "next/link";

const PROCESS_ITEMS = [
  {
    href: "/stats",
    eyebrow: "Stats",
    title: "Accumulated Rhythms",
    description:
      "Making, learning, Body Moving, body weather, mind weather, and energy tone across the accumulated public records.",
    action: "Open Stats",
  },
  {
    href: "/data",
    eyebrow: "Data",
    title: "Numeric Output",
    description:
      "Structured body, movement, weather, making, and learning data prepared for CSV, JSON, Max/MSP, and visual mapping.",
    action: "Open Data",
  },
  {
    href: "/system",
    eyebrow: "System",
    title: "Period Reading",
    description:
      "An AI interpretation of recurring signals, relationships, shifts, and open questions across recent Daily records.",
    action: "Open System",
  },
  {
    href: "/weave",
    eyebrow: "Weave",
    title: "Semantic Connections",
    description:
      "A network of relationships among Daily records, Body Moving, environment, making, learning, artistic input, and observation.",
    action: "Open Weave",
  },
];

export default function ProcessPage() {
  return (
    <>
      <section className="panel">
        <p className="eyebrow">
          Process
        </p>

        <h2>
          Records becoming
          patterns and
          relationships
        </h2>

        <p className="subtitle">
          Stats, Data, System,
          and Weave interpret,
          organize, and connect
          the material collected
          through Input.
        </p>
      </section>

      <section className="grid two">
        {PROCESS_ITEMS.map(
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
