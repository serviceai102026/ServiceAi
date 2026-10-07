export const ADS_CONFIG = {
  enabled: true,
  showOnHomepage: true,
  showOnBlog: true,
  hideOnPages: ["/privacy", "/terms", "/contact", "/سياسة-الخصوصية", "/login", "/admin"],
};

export function shouldShowAdsOnPathname(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  const excludedPaths = ["/", "/about", "/contact", "/privacy", "/terms"];
  const isExcludedPath = excludedPaths.includes(normalizedPath)
    || normalizedPath.startsWith("/admin/")
    || normalizedPath === "/admin";

  return ADS_CONFIG.enabled && !isExcludedPath;
}
