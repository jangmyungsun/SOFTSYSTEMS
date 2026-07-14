import './globals.css';
import Navigation from '../components/Navigation';
export const metadata = { title: 'SOFTSYSTEMS', description: 'A creative operating system for paying attention.' };
export default function RootLayout({ children }) {
  return <html lang="en"><body><main className="app"><Navigation/><section className="panel"><p className="eyebrow">SOFTSYSTEMS</p><h1>A living operating system for artistic practice</h1><p className="subtitle">A living archive of body, environment, practice, and creation.</p></section>{children}</main></body></html>;
}
