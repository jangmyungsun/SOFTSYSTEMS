import './globals.css';
import Navigation from '../components/Navigation';

export const metadata = {
  title: 'SOFTSYSTEMS',
  description: 'A living operating system for artistic practice.',
};

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
