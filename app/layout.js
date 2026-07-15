import './globals.css';
import Navigation from '../components/Navigation';

export const metadata = {
  title: 'SOFTSYSTEMS',
  description: 'A living operating system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="app">
          <Navigation />

          <section className="panel hero">
            <p className="eyebrow">SOFTSYSTEMS</p>

            <h1>
              A caring system for creative life.
            </h1>

            <p className="subtitle">
              A living archive of body, environment, practice, and creation.
            </p>
          </section>

          {children}
        </main>
      </body>
    </html>
  );
}
