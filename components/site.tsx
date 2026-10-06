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
        <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
          <path fill="white" d="M16.04 2C7.7 2 1 8.7 1 17.04c0 2.66.7 5.25 2.02 7.53L1 31l6.63-1.94A14.94 14.94 0 0016.04 32C24.38 32 31.08 25.3 31.08 17c0-4.45-1.73-8.63-4.88-11.77A16.48 16.48 0 0016.04 2zm6.78 19.66c-.37.19-2.2 1.09-2.54 1.21-.34.12-.59.19-.84-.19-.25-.37-.97-1.21-1.19-1.46-.22-.25-.44-.28-.81-.09-.37.19-1.56.58-2.97 1.84-1.1.98-1.84 2.19-2.06 2.56-.22.37-.02.57.16.76.17.17.37.44.56.66.19.22.25.37.37.62.12.25.06.47-.03.66-.09.19-.84 2.02-1.15 2.77-.3.72-.61.62-.84.63l-.72.01c-.25 0-.66-.09-1-.47-.34-.37-1.31-1.28-1.31-3.12s1.34-3.62 1.53-3.87c.19-.25 2.64-4.03 6.4-5.65.9-.39 1.6-.62 2.14-.79.9-.29 1.72-.25 2.37-.15.72.11 2.2.9 2.51 1.77.31.87.31 1.62.22 1.77-.09.15-.34.25-.71.44z" />
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
