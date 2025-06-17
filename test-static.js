const StaticFetcher = require("./src/fetchers/fetchStatic");
const config = require("./src/config");

async function testStaticFetcher() {
  console.log("🧪 Testing Static Fetcher\n");

  const fetcher = new StaticFetcher();

  // Test 1: Basic URL fetch - using a reliable test site first
  console.log("=== Test 1: Basic URL Fetch ===");
  const testUrls = [
    "https://interviewing.io/blog",
    "https://httpbin.org/html", // Reliable test endpoint
    "https://example.com",
  ];

  let workingUrl = null;

  for (const url of testUrls) {
    try {
      console.log(`Trying: ${url}`);
      const html = await fetcher.fetchWithRetry(url);
      console.log("✅ Successfully fetched HTML");
      console.log(`📄 HTML length: ${html.length} characters`);
      console.log(`📄 First 200 chars: ${html.substring(0, 200)}...`);
      workingUrl = url;
      break;
    } catch (error) {
      console.log(`❌ Failed to fetch ${url}:`, error.message);
    }
  }

  if (!workingUrl) {
    console.log("❌ All test URLs failed. Check network connectivity.");
    return;
  }

  console.log("\n=== Test 2: Link Extraction ===");
  try {
    // Test link extraction on interviewing.io blog instead
    const interviewingConfig = config.sites["interviewing.io"];
    const blogSource = interviewingConfig.sources[0]; // blog source

    console.log(`Testing selectors: ${blogSource.selectors.postLinks}`);

    const listingHtml = await fetcher.fetchWithRetry(blogSource.url);
    const links = fetcher.extractLinks(
      listingHtml,
      interviewingConfig.baseUrl,
      blogSource.selectors
    );

    console.log(`✅ Found ${links.length} links`);
    console.log("🔗 First few links:");
    links.slice(0, 5).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link}`);
    });

    if (links.length === 0) {
      console.log("⚠️  No links found - selectors might need adjustment");

      // Let's inspect the HTML structure
      console.log("\n🔍 Debugging: Looking for common link patterns...");
      const cheerio = require("cheerio");
      const $ = cheerio.load(listingHtml);

      // Look for various link patterns
      const patterns = [
        'a[href*="/blog/"]',
        'a[href*="blog"]',
        ".post-title a",
        ".entry-title a",
        "h2 a",
        "h3 a",
      ];

      patterns.forEach((pattern) => {
        const found = $(pattern).length;
        console.log(`   ${pattern}: ${found} matches`);
        if (found > 0) {
          console.log(`      Example: ${$(pattern).first().attr("href")}`);
        }
      });
    }
  } catch (error) {
    console.log("❌ Failed link extraction test:", error.message);
  }

  console.log("\n=== Test 3: Content Extraction ===");
  try {
    // Test content extraction on interviewing.io
    const interviewingConfig = config.sites["interviewing.io"];
    const blogSource = interviewingConfig.sources[0];

    // First get some links
    const listingHtml = await fetcher.fetchWithRetry(blogSource.url);
    const links = fetcher.extractLinks(
      listingHtml,
      interviewingConfig.baseUrl,
      blogSource.selectors
    );

    if (links.length > 0) {
      const testUrl = links[0];
      console.log(`Testing content extraction on: ${testUrl}`);

      const pageHtml = await fetcher.fetchWithRetry(testUrl);
      const content = fetcher.extractContent(
        pageHtml,
        testUrl,
        blogSource.selectors, // Fixed: was dsaSource.selectors
        blogSource // Fixed: was dsaSource
      );

      if (content) {
        console.log("✅ Successfully extracted content");
        console.log(`📝 Title: ${content.title}`);
        console.log(`👤 Author: ${content.author}`);
        console.log(`📊 Content length: ${content.content.length} characters`);
        console.log(`🏷️  Content type: ${content.content_type}`);
        console.log(`🔗 Source URL: ${content.source_url}`);
        console.log(
          `📄 Content preview: ${content.content.substring(0, 300)}...`
        );
      } else {
        console.log(
          "❌ Failed to extract content - might be too short or selectors need adjustment"
        );

        // Debug content extraction
        console.log("\n🔍 Debugging content selectors...");
        const cheerio = require("cheerio");
        const $ = cheerio.load(pageHtml);

        const contentPatterns = [
          ".post-content",
          ".entry-content",
          "article",
          ".content",
          "main",
          ".post-body",
          // Add more specific patterns for interviewing.io
          "[data-testid='post-content']",
          ".prose",
          ".markdown",
          ".blog-content",
        ];

        contentPatterns.forEach((pattern) => {
          const found = $(pattern).length;
          const text = $(pattern).first().text().substring(0, 100);
          console.log(`   ${pattern}: ${found} matches, text: "${text}..."`);
        });

        // Also check what the page structure looks like
        console.log("\n🔍 Page structure analysis:");
        console.log(`   Total paragraphs: ${$("p").length}`);
        console.log(`   Total divs: ${$("div").length}`);
        console.log(`   Total articles: ${$("article").length}`);
        console.log(`   Total mains: ${$("main").length}`);

        // Look for the actual content container
        const bodyText = $("body").text();
        console.log(`   Body text length: ${bodyText.length} characters`);
        if (bodyText.length > 1000) {
          console.log(`   Body preview: ${bodyText.substring(0, 200)}...`);
        }
      }
    } else {
      console.log("⚠️  No links available for content extraction test");
    }
  } catch (error) {
    console.log("❌ Failed content extraction test:", error.message);
  }

  console.log("\n=== Test 4: Full Source Scrape (Limited) ===");
  try {
    // Test full source scraping on interviewing.io blog
    const interviewingConfig = config.sites["interviewing.io"];
    const blogSource = interviewingConfig.sources[0];

    console.log(
      `Testing full scrape of ${blogSource.name} (limited to 2 articles)`
    );

    // Temporarily modify the source to limit results
    const originalScrapeSource = fetcher.scrapeSource;
    fetcher.scrapeSource = async function (siteConfig, sourceConfig) {
      console.log(`\nScraping ${sourceConfig.name} from ${sourceConfig.url}`);

      const listingHtml = await this.fetchWithRetry(sourceConfig.url);
      const links = this.extractLinks(
        listingHtml,
        siteConfig.baseUrl,
        sourceConfig.selectors
      );

      // Limit to 2 links for testing
      const limitedLinks = links.slice(0, 2);
      console.log(
        `Found ${links.length} total links, testing first ${limitedLinks.length}`
      );

      const results = [];
      for (let i = 0; i < limitedLinks.length; i++) {
        const link = limitedLinks[i];
        console.log(`Scraping ${i + 1}/${limitedLinks.length}: ${link}`);

        try {
          const pageHtml = await this.fetchWithRetry(link);
          const content = this.extractContent(
            pageHtml,
            link,
            sourceConfig.selectors,
            sourceConfig
          );

          if (content) {
            results.push(content);
          }

          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to scrape ${link}:`, error.message);
        }
      }

      return results;
    };

    const results = await fetcher.scrapeSource(interviewingConfig, blogSource);

    console.log(`✅ Successfully scraped ${results.length} articles`);
    results.forEach((item, i) => {
      console.log(`\n📄 Article ${i + 1}:`);
      console.log(`   Title: ${item.title}`);
      console.log(`   Author: ${item.author}`);
      console.log(`   Content length: ${item.content.length} chars`);
      console.log(`   URL: ${item.source_url}`);
    });
  } catch (error) {
    console.log("❌ Failed full source scrape test:", error.message);
  }

  console.log("\n🎉 Static fetcher testing complete!");
}

// Run the test
if (require.main === module) {
  testStaticFetcher().catch(console.error);
}

module.exports = testStaticFetcher;
