import './globals.css';import Header from '@/components/Header';import Footer from '@/components/Footer';
export const metadata={title:'Fictional Frames — A Photography Journal',description:'A monthly photographic journal by Khaled Mahmoud.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Header/>{children}<Footer/></body></html>}
