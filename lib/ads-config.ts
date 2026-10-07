export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";

export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = {
  "top": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  },
  "middle": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  },
  "bottom": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  },
  "blog_top": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  },
  "blog_middle": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  },
  "blog_end": {
    "enabled": true,
    "code": "<div style=\"text-align:center; margin:20px 0;\">\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXX\" crossorigin=\"anonymous\"></script>\n  <ins class=\"adsbygoogle\"\n       style=\"display:block\"\n       data-ad-client=\"ca-pub-XXXXXXXXXXXXXX\"\n       data-ad-slot=\"1234567890\"\n       data-ad-format=\"auto\"\n       data-full-width-responsive=\"true\"></ins>\n  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>\n</div>"
  }
} as const satisfies AdsConfig;
