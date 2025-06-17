const config = {
  // Default team info for Aline's project
  teamId: "aline123",

  // Request settings
  requestDefaults: {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },

  // Puppeteer settings for dynamic content
  puppeteerOptions: {
    headless: true,
    timeout: 30000,
    waitUntil: "networkidle2",
    viewport: { width: 1200, height: 800 },
  },

  // Site-specific configurations
  sites: {
    "interviewing.io": {
      baseUrl: "https://interviewing.io",
      sources: [
        {
          name: "blog",
          url: "https://interviewing.io/blog",
          type: "blog_listing",
          isDynamic: false,
          selectors: {
            postLinks:
              'a[href*="/blog/"], a[href^="/blog/"], h2 a, h3 a, .post-title a',
            title: "h1, h2, h3, .post-title, .entry-title, .title",
            content: [
              // Try modern content selectors first
              "[data-testid='post-content']",
              ".prose",
              ".markdown",
              ".blog-content",
              ".article-content",
              // Then fallback to standard ones
              ".post-content",
              ".entry-content",
              "article",
              ".content",
              "main",
              ".post-body",
              // Last resort - just get all paragraphs
              "p",
            ],
            author: '.author, .post-author, [class*="author"], .byline',
            date: ".date, .post-date, time, .published",
          },
          contentType: "blog",
          defaultAuthor: "interviewing.io",
        },
        {
          name: "company_guides",
          url: "https://interviewing.io/topics#companies",
          type: "guide_listing",
          isDynamic: true, // Likely needs JS to load content
          selectors: {
            guideLinks: 'a[href*="/topics/"], a[href*="/companies/"]',
            title: "h1, .guide-title",
            content: [
              ".guide-content",
              ".topic-content",
              "main",
              ".content",
              "article",
              "p",
            ],
            author: '.author, [class*="author"]',
          },
          contentType: "other",
        },
        {
          name: "interview_guides",
          url: "https://interviewing.io/learn#interview-guides",
          type: "guide_listing",
          isDynamic: true,
          selectors: {
            guideLinks: 'a[href*="/learn/"], a[href*="/guides/"]',
            title: "h1, .guide-title",
            content: [
              ".guide-content",
              ".learn-content",
              "main",
              ".content",
              "article",
              "p",
            ],
            author: '.author, [class*="author"]',
          },
          contentType: "other",
        },
      ],
    },

    "nilmamano.com": {
      baseUrl: "https://nilmamano.com",
      sources: [
        {
          name: "dsa_blog",
          url: "https://nilmamano.com/blog/category/dsa",
          type: "blog_listing",
          isDynamic: false,
          selectors: {
            postLinks: 'a[href*="/blog/"]',
            title: "h1, .post-title, .entry-title",
            content: [
              ".post-content",
              ".entry-content",
              "article",
              ".content",
              "main",
              "p",
            ],
            author: ".author, .post-author",
            date: ".date, .post-date, time",
          },
          contentType: "blog",
          defaultAuthor: "Nil Mamano",
        },
      ],
    },
  },

  // PDF processing settings
  pdf: {
    inputDir: "./chapter-pdfs",
    chapterPattern: /chapter[\s-_]*(\d+)/i,
    maxChapters: 8,
    defaultAuthor: "Aline",
    contentType: "book",
  },

  // Output settings
  output: {
    dir: "./data",
    filename: "scraped_content.json",
    prettyPrint: true,
  },

  // Content processing rules
  processing: {
    minContentLength: 50, // Reduced from 100 to be less strict
    maxContentLength: 50000,
    cleanupRules: {
      removeEmptyParagraphs: true,
      removeExcessiveWhitespace: true,
      removeNavigationElements: true,
    },
  },

  // Fallback selectors for unknown sites
  fallbackSelectors: {
    title: ["h1", ".post-title", ".entry-title", ".article-title", "title"],
    content: [
      // Modern selectors
      "[data-testid='post-content']",
      ".prose",
      ".markdown",
      ".blog-content",
      ".article-content",
      // Standard selectors
      ".post-content",
      ".entry-content",
      "article",
      ".content",
      "main",
      ".post-body",
      // Fallback - get all paragraphs
      "p",
    ],
    author: [
      ".author",
      ".post-author",
      ".by-author",
      '[rel="author"]',
      '[class*="author"]',
    ],
  },
};

module.exports = config;
