import './globals.css';
import Navigation from '../components/Navigation';
import SiteHero from '../components/SiteHero';
import { LanguageProvider } from '../components/LanguageProvider';
import VisitorTracker from '../components/VisitorTracker';

export const metadata = {
  title: 'SOFTSYSTEMS',
  description: 'A living operating system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <VisitorTracker />

          <main className="app">
            <Navigation />

            <SiteHero />

            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
