import sanitizeHtml from "sanitize-html";

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "p", "br", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote", "a", "hr", "pre", "code",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
    },
  });
}

export function sanitizeAdHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4",
      "hr", "i", "img", "li", "ol", "p", "pre", "small", "span", "strong", "u", "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title", "class"],
      div: ["class", "id", "role", "aria-label"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
      img: ["src", "alt", "width", "height", "loading", "class"],
      li: ["class"],
      p: ["class"],
      span: ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
    },
  });
}

export function sanitizeBlogAdHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "b", "blockquote", "br", "code", "div", "em", "h1", "h2", "h3", "h4",
      "hr", "i", "img", "ins", "li", "ol", "p", "pre", "small", "span", "strong", "u", "ul",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title", "class"],
      div: ["class", "id", "role", "aria-label"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
      img: ["src", "alt", "width", "height", "loading", "class"],
      ins: ["class", "style", "data-ad-client", "data-ad-slot", "data-ad-format", "data-ad-layout", "data-ad-layout-key", "data-full-width-responsive"],
      li: ["class"],
      p: ["class"],
      span: ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }, true),
    },
  });
}
