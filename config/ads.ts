export const ADS_CONFIG = {
  enabled: true,
  showOnHomepage: true,
  showOnBlog: true,
  hideOnPages: ["/privacy", "/terms", "/contact", "/سياسة-الخصوصية", "/login", "/admin"],
};
https://arwf.org/4/682ab5ab42cd375b9ea7e95acefdd41f
export function shouldShowAdsOnPathname(pathname: string) {
  const normalizedPath = pathname.toLowerCase();
  const excludedPaths = ["/", "/about", "/contact", "/privacy", "/terms"];
  const isExcludedPath = excludedPaths.includes(normalizedPath)
    || normalizedPath.startsWith("/admin/")
    || normalizedPath === "/admin";

  return ADS_CONFIG.enabled && !isExcludedPath;
}
