import Link from "next/link";

export default function NotFound() {
  return <main className="app-shell"><section className="start-screen"><div className="start-main"><h1>خارج الساحة</h1><p className="start-subtitle">هذه الصفحة غير موجودة. التحدّي ينتظرك في الرئيسية.</p><Link className="button button-primary mt-8 no-underline" href="/">العودة للساحة</Link></div></section></main>;
}
