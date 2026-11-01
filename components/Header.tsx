import Link from 'next/link';
export default function Header(){return <header className="container-site py-7 flex items-center justify-between border-b border-black/15"><Link href="/" className="font-semibold tracking-[.18em] text-sm">FICTIONAL FRAMES</Link><nav className="flex gap-6 text-xs tracking-widest"><Link href="/issues">ISSUES</Link><Link href="/#about">ABOUT</Link></nav></header>}
