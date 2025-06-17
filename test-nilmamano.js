const StaticFetcher = require("./src/fetchers/fetchStatic");
const config = require("./src/config");

async function testNilmamano() {
  console.log("🧪 Testing Nilmamano.com Static Fetcher\n");

  const fetcher = new StaticFetcher();

  console.log("=== Test 1: Basic URL Fetch ===");
  try {
    const url = "https://nilmamano.com/blog/category/dsa";
    console.log(`Trying: ${url}`);
    const html = await fetcher.fetchWithRetry(url);
    console.log("✅ Successfully fetched HTML");
    console.log(`📄 HTML length: ${html.length} characters`);
    console.log(`📄 First 200 chars: ${html.substring(0, 200)}...`);
  } catch (error) {
    console.log(`❌ Failed to fetch:`, error.message);
    return;
  }

  console.log("\n=== Test 2: Link Extraction ===");
  try {
    const nilConfig = config.sites["nilmamano.com"];
    const dsaSource = nilConfig.sources[0];

    console.log(`Testing selectors: ${dsaSource.selectors.postLinks}`);

    const listingHtml = await fetcher.fetchWithRetry(dsaSource.url);
    const links = fetcher.extractLinks(
      listingHtml,
      nilConfig.baseUrl,
      dsaSource.selectors
    );

    console.log(`✅ Found ${links.length} links`);
    console.log("🔗 First few links:");
    links.slice(0, 5).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link}`);
    });

    if (links.length === 0) {
      console.log("⚠️  No links found - let's debug the selectors");

      // Debug the page structure
      console.log("\n🔍 Debugging: Looking for link patterns...");
      const cheerio = require("cheerio");
      const $ = cheerio.load(listingHtml);

      const patterns = [
        'a[href*="/blog/"]',
        'a[href*="blog"]',
        'a[href*="dsa"]',
        ".post-title a",
        ".entry-title a",
        "h2 a",
        "h3 a",
        ".post a",
        "article a",
        ".content a"
      ];

      patterns.forEach((pattern) => {
        const found = $(pattern).length;
        console.log(`   ${pattern}: ${found} matches`);
        if (found > 0) {
          const href = $(pattern).first().attr("href");
          const text = $(pattern).first().text().trim();
          console.log(`      Example: ${href} - "${text}"`);
        }
      });

      // Also check the page structure
      console.log("\n🔍 Page structure:");
      console.log(`   Total links: ${$("a").length}`);
      console.log(`   Links with /blog/: ${$('a[href*="/blog/"]').length}`);
      console.log(`   Articles: ${$("article").length}`);
      console.log(`   Posts: ${$(".post").length}`);
    }
  } catch (error) {
    console.log("❌ Failed link extraction test:", error.message);
  }

  console.log("\n=== Test 3: Content Extraction ===");
  try {
    const nilConfig = config.sites["nilmamano.com"];
    const dsaSource = nilConfig.sources[0];

    // Get links first
    const listingHtml = await fetcher.fetchWithRetry(dsaSource.url);
    const links = fetcher.extractLinks(
      listingHtml,
      nilConfig.baseUrl,
      dsaSource.selectors
    );

    if (links.length > 0) {
      const testUrl = links[0];
      console.log(`Testing content extraction on: ${testUrl}`);

      const pageHtml = await fetcher.fetchWithRetry(testUrl);
      const content = fetcher.extractContent(
        pageHtml,
        testUrl,
        dsaSource.selectors,
        dsaSource
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
        console.log("❌ Failed to extract content");
        
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
          ".blog-content",
          ".prose",
          ".markdown"
        ];

        contentPatterns.forEach((pattern) => {
          const found = $(pattern).length;
          const text = $(pattern).first().text().substring(0, 100);
          console.log(`   ${pattern}: ${found} matches, text: "${text}..."`);
        });
      }
    } else {
      console.log("⚠️  No links available for content extraction test");
    }
  } catch (error) {
    console.log("❌ Failed content extraction test:", error.message);
  }

  console.log("\n🎉 Nilmamano testing complete!");
}

// Run the test
if (require.main === module) {
  testNilmamano().catch(console.error);
}

module.exports = testNilmamano;