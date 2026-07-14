<section className="panel hero">
  <p className="eyebrow">SOFTSYSTEMS</p>

  <h1>
    A living operating system
    <br />
    for artistic practice
  </h1>

  <p className="subtitle">
    A living archive of body, environment, practice, and creation.
  </p>
</section>
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="app">
          <Navigation />

          <section className="panel hero">
            <p className="eyebrow">SOFTSYSTEMS</p>

            <h1 className="hero-title">
              A living archive
              <br />
              for artistic practice.
            </h1>

            <p className="subtitle">
              Body, environment, practice, memory, and creation—woven together
              as one evolving system.
            </p>
          </section>

          {children}
        </main>
      </body>
    </html>
  );
}
