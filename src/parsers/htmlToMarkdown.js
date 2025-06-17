const TurndownService = require("turndown");

class HtmlToMarkdownConverter {
  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced",
      fence: "```",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
    });

    // Configure custom rules
    this.setupCustomRules();
  }

  setupCustomRules() {
    // Remove navigation elements, ads, etc.
    this.turndownService.remove([
      "nav",
      "header",
      "footer",
      "aside",
      "script",
      "style",
      "noscript",
      ".navigation",
      ".nav",
      ".menu",
      ".sidebar",
      ".ads",
      ".advertisement",
      ".social-share",
      ".comments",
      ".related-posts",
      ".newsletter-signup",
    ]);

    // Handle code blocks better
    this.turndownService.addRule("codeBlocks", {
      filter: ["pre"],
      replacement: function (content) {
        return "\n```\n" + content + "\n```\n\n";
      },
    });

    // Handle inline code
    this.turndownService.addRule("inlineCode", {
      filter: function (node) {
        return node.nodeName === "CODE" && node.parentNode.nodeName !== "PRE";
      },
      replacement: function (content) {
        return "`" + content + "`";
      },
    });

    // Handle blockquotes better
    this.turndownService.addRule("blockquotes", {
      filter: "blockquote",
      replacement: function (content) {
        content = content.replace(/^\n+|\n+$/g, "");
        content = content.replace(/^/gm, "> ");
        return "\n\n" + content + "\n\n";
      },
    });

    // Handle tables
    this.turndownService.addRule("tables", {
      filter: "table",
      replacement: function (content, node) {
        // Simple table conversion - could be enhanced
        return "\n\n" + content + "\n\n";
      },
    });

    // Handle images with alt text
    this.turndownService.addRule("images", {
      filter: "img",
      replacement: function (content, node) {
        const alt = node.getAttribute("alt") || "";
        const src = node.getAttribute("src") || "";
        const title = node.getAttribute("title");

        if (!src) return "";

        const titlePart = title ? ` "${title}"` : "";
        return `![${alt}](${src}${titlePart})`;
      },
    });
  }

  /**
   * Convert HTML content to clean Markdown
   */
  convert(htmlContent) {
    if (!htmlContent || typeof htmlContent !== "string") {
      return "";
    }

    try {
      // Pre-process the HTML to clean it up
      let cleanHtml = this.preProcessHtml(htmlContent);

      // Convert to Markdown
      let markdown = this.turndownService.turndown(cleanHtml);

      // Post-process the Markdown
      markdown = this.postProcessMarkdown(markdown);

      return markdown;
    } catch (error) {
      console.error("Error converting HTML to Markdown:", error.message);
      // Fallback: try to extract just text content
      const cheerio = require("cheerio");
      try {
        const $ = cheerio.load(htmlContent);
        return $.text();
      } catch (fallbackError) {
        console.error(
          "Fallback text extraction also failed:",
          fallbackError.message
        );
        return "";
      }
    }
  }

  /**
   * Clean up HTML before conversion
   */
  preProcessHtml(html) {
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $(
      "script, style, nav, header, footer, aside, .navigation, .nav, .menu, " +
        ".sidebar, .ads, .advertisement, .social-share, .comments, .related-posts, " +
        ".newsletter-signup, .cookie-notice, .popup, .modal"
    ).remove();

    // Clean up empty elements
    $("p:empty, div:empty, span:empty").remove();

    // Convert relative URLs to absolute if we have a base URL
    // Note: This would need the base URL passed in for full functionality

    return $.html();
  }

  /**
   * Clean up Markdown after conversion
   */
  postProcessMarkdown(markdown) {
    // Remove excessive line breaks
    markdown = markdown.replace(/\n{4,}/g, "\n\n\n");

    // Clean up list formatting
    markdown = markdown.replace(/^\s*[-*+]\s*$/gm, "");

    // Fix heading spacing
    markdown = markdown.replace(/^(#{1,6})\s*(.+)\s*$/gm, "$1 $2");

    // Remove trailing whitespace from lines
    markdown = markdown.replace(/[ \t]+$/gm, "");

    // Ensure proper spacing around code blocks
    markdown = markdown.replace(/```\n+/g, "```\n");
    markdown = markdown.replace(/\n+```/g, "\n```");

    // Clean up bold and italic formatting
    markdown = markdown.replace(/\*{3,}/g, "**");
    markdown = markdown.replace(/_{3,}/g, "__");

    return markdown.trim();
  }

  /**
   * Convert HTML with additional context (base URL, etc.)
   */
  convertWithContext(htmlContent, options = {}) {
    const { baseUrl, title, author } = options;

    let markdown = this.convert(htmlContent);

    // Add metadata if provided (but avoid duplicating title if it's already in content)
    if (author || baseUrl) {
      let frontMatter = "";
      if (author && !markdown.includes(`By ${author}`)) {
        frontMatter += `*By ${author}*\n\n`;
      }
      if (baseUrl) frontMatter += `*Source: ${baseUrl}*\n\n`;

      markdown = frontMatter + markdown;
    }

    return markdown;
  }

  /**
   * Test the converter with sample HTML
   */
  test() {
    const sampleHtml = `
      <article>
        <h1>Sample Blog Post</h1>
        <p>This is a <strong>sample</strong> blog post with <em>various</em> formatting.</p>
        <h2>Code Example</h2>
        <pre><code>function hello() {
  console.log("Hello, world!");
}</code></pre>
        <p>Here's some <code>inline code</code> as well.</p>
        <blockquote>
          <p>This is a quote from someone important.</p>
        </blockquote>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </article>
    `;

    console.log("🧪 Testing HTML to Markdown conversion...");
    console.log("\nInput HTML:");
    console.log(sampleHtml);

    const markdown = this.convert(sampleHtml);
    console.log("\nOutput Markdown:");
    console.log(markdown);

    return markdown;
  }
}

module.exports = HtmlToMarkdownConverter;
