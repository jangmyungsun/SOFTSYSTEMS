"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links=[['/','Home'],['/archive','Archive'],['/system','System'],['/weave','Weave'],['/stats','Stats'],['/data','Data'],['/daily','Daily'],['/login','Login']];
export default function Navigation(){const p=usePathname();return <nav className="nav">{links.map(([href,label])=><Link key={href} href={href} className={p===href?'active':''}>{label}</Link>)}</nav>;}
