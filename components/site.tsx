import Link from "next/link";
import Image from "next/image";
import type { ArticleCardData } from "@/lib/data";
import { articleCardCategory, formatDate } from "@/lib/data";
import { SiteBrand, SiteFooterBottom, SiteFooterContent } from "@/components/site-branding-display";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/tools", label: "الأدوات" },
  { href: "/blog", label: "المدونة" },
  { href: "/about", label: "من نحن" },
];

export function SiteHeader({ active = "" }: { active?: string }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <SiteBrand />
        <details className="mobile-navigation">
          <summary className="menu-toggle" aria-label="القائمة الرئيسية"><span></span><span></span><span></span></summary>
          <nav className="primary-nav" aria-label="القائمة الرئيسية">
            {navLinks.map((item) => <Link className={active === item.href ? "active" : ""} aria-current={active === item.href ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
        </details>
        <nav className="desktop-navigation" aria-label="القائمة الرئيسية">
          {navLinks.map((item) => <Link className={active === item.href ? "active" : ""} aria-current={active === item.href ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="button button-small header-cta" href="/tools">اكتشف الأدوات <span aria-hidden="true">←</span></Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <>
      <a
        id="whatsapp-fixed"
        href="https://wa.me/212710061006?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر WhatsApp"
        title="تواصل معنا عبر WhatsApp"
        style={{
          position: "fixed",
          bottom: 25,
          right: 25,
          background: "#25D366",
          width: 62,
          height: 62,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999999,
          boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
        }}
      >
        <svg viewBox="0 0 448 512" width="30" height="30" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>
      </a>
      <footer className="site-footer">
        <div className="container footer-main">
          <SiteFooterContent />
        </div>
        <SiteFooterBottom />
      </footer>
    </>
  );
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  const category = articleCardCategory(article);
  const visual = /مقابل/.test(category) ? "visual-interview" : /لينكد|حضور/.test(category) ? "visual-linkedin" : "visual-cv";

  return (
    <Link className="article-card" href={`/blog/${article.slug}`}>
      <div className={`article-visual ${visual}`}>
        {article.featured_image ? <Image className="article-card-image" src={article.featured_image} alt="" fill unoptimized sizes="(max-width: 680px) 40vw, (max-width: 940px) 30vw, 370px" /> : <span className="article-placeholder-icon" aria-hidden="true">✦</span>}
        <span className="visual-tag">{category}</span>
      </div>
      <div className="article-body"><div className="article-meta"><span>{category}</span><span>{formatDate(article.published_at)}</span></div><h3>{article.title}</h3><p>{article.excerpt}</p><span className="card-link">اقرأ المقال <b aria-hidden="true">←</b></span></div>
    </Link>
  );
}

export function PageHero({ eyebrow, title, highlight, description }: { eyebrow: string; title: string; highlight: string; description: string }) {
  return (
    <section className="page-hero">
      <div className="container page-hero-inner"><div><span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span><h1>{title}<br /><span className="text-gradient">{highlight}</span></h1><p>{description}</p></div><div className="page-hero-art blog-hero-art" aria-hidden="true"><div className="blog-art-book"><span>ملاحظات<br />لمستقبلك<br /><b>المهني</b></span><i>✦</i></div><span className="blog-art-spark">✳</span></div></div>
    </section>
  );
}
