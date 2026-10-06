export const ADS_CONFIG = {
  enabled: true,
  showOnHomepage: true,
  showOnBlog: true,
  hideOnPages: ["/privacy", "/terms", "/contact", "/سياسة-الخصوصية", "/login", "/admin"],
};

export function shouldShowAdsOnPathname(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  const isBlogPage = normalizedPath === "/blog" || normalizedPath.startsWith("/blog/");

  return ADS_CONFIG.enabled
    && !ADS_CONFIG.hideOnPages.some((page) => normalizedPath.includes(page.toLowerCase()))
    && (normalizedPath !== "/" || ADS_CONFIG.showOnHomepage)
    && (!isBlogPage || ADS_CONFIG.showOnBlog);
}
