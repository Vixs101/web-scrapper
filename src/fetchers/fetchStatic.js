const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");

class StaticFetcher {
  constructor() {
    this.axiosInstance = axios.create({
      timeout: config.requestDefaults.timeout,
      headers: {
        "User-Agent": config.requestDefaults.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });
  }

  /**
   * Fetch HTML content from a URL with retry logic
   */
  async fetchWithRetry(url, retries = config.requestDefaults.retries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Fetching ${url} (attempt ${attempt}/${retries})`);

        const response = await this.axiosInstance.get(url);

        if (response.status === 200) {
          return response.data;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for ${url}:`, error.message);

        if (attempt === retries) {
          throw new Error(
            `Failed to fetch ${url} after ${retries} attempts: ${error.message}`
          );
        }

        // Wait before retrying
        await this.delay(config.requestDefaults.retryDelay * attempt);
      }
    }
  }

  /**
   * Extract links from a listing page
   */
  extractLinks(html, baseUrl, selectors) {
    const $ = cheerio.load(html);
    const links = new Set(); // Use Set to avoid duplicates

    // Try each selector until we find links
    const linkSelectors = Array.isArray(selectors.postLinks)
      ? selectors.postLinks
      : [selectors.postLinks];

    for (const selector of linkSelectors) {
      $(selector).each((i, elem) => {
        let href = $(elem).attr("href");
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith("/")) {
            href = baseUrl + href;
          } else if (!href.startsWith("http")) {
            href = baseUrl + "/" + href;
          }

          // Basic validation - should be a reasonable URL
          if (
            href.includes("http") &&
            !href.includes("#") &&
            !href.includes("mailto:")
          ) {
            links.add(href);
          }
        }
      });

      // If we found links with this selector, stop trying others
      if (links.size > 0) {
        break;
      }
    }

    return Array.from(links);
  }

  /**
   * Extract content from an individual page
   */
  extractContent(html, url, selectors, siteConfig) {
    const $ = cheerio.load(html);

    // Extract title
    const title =
      this.extractBySelectors($, selectors.title) ||
      this.extractBySelectors($, config.fallbackSelectors.title) ||
      "Untitled";

    // Extract main content
    const content =
      this.extractBySelectors($, selectors.content) ||
      this.extractBySelectors($, config.fallbackSelectors.content) ||
      "";

    // Extract author
    const author =
      this.extractBySelectors($, selectors.author) ||
      this.extractBySelectors($, config.fallbackSelectors.author) ||
      siteConfig.defaultAuthor ||
      "";

    // Clean up content
    const cleanContent = this.cleanContent(content);

    // Validate content length
    if (cleanContent.length < config.processing.minContentLength) {
      console.warn(`Content too short for ${url} (${cleanContent.length} chars), skipping`);
      
      // Debug: Show what we actually extracted
      console.log(`  Title found: "${title}"`);
      console.log(`  Author found: "${author}"`);
      console.log(`  Raw content length: ${content.length}`);
      console.log(`  Clean content preview: "${cleanContent.substring(0, 100)}..."`);
      
      return null;
    }

    return {
      title: title.trim(),
      content: cleanContent,
      content_type: siteConfig.contentType || "other",
      source_url: url,
      author: author.trim(),
      user_id: "",
    };
  }

  /**
   * Try multiple selectors and return the first match
   */
  extractBySelectors($, selectors) {
    if (!selectors) return "";

    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    for (const selector of selectorList) {
      const elements = $(selector);
      if (elements.length > 0) {
        // For content, get HTML; for others, get text
        if (
          selector.includes("content") ||
          selector.includes("article") ||
          selector.includes("main") ||
          selector.includes("prose") ||
          selector.includes("markdown") ||
          selector === "p"
        ) {
          // For content selectors, try to get the best content
          let content = "";
          
          if (selector === "p") {
            // If we're falling back to paragraphs, combine them
            elements.each((i, elem) => {
              const pText = $(elem).html();
              if (pText && pText.trim().length > 20) {
                content += pText + "\n\n";
              }
            });
          } else {
            content = elements.first().html() || "";
          }
          
          // Only return if we got substantial content
          if (content && content.trim().length > 20) {
            return content;
          }
        } else {
          const text = elements.first().text() || "";
          if (text && text.trim().length > 0) {
            return text;
          }
        }
      }
    }

    return "";
  }

  /**
   * Clean and normalize content
   */
  cleanContent(content) {
    if (!content) return "";

    // Remove script and style tags
    const $ = cheerio.load(content);
    $("script, style, nav, footer, header, .navigation, .nav, .menu").remove();

    let cleaned = $.html();

    if (config.processing.cleanupRules.removeExcessiveWhitespace) {
      cleaned = cleaned.replace(/\s+/g, " ");
    }

    if (config.processing.cleanupRules.removeEmptyParagraphs) {
      cleaned = cleaned.replace(/<p>\s*<\/p>/g, "");
    }

    // Truncate if too long
    if (cleaned.length > config.processing.maxContentLength) {
      cleaned =
        cleaned.substring(0, config.processing.maxContentLength) + "...";
    }

    return cleaned.trim();
  }

  /**
   * Scrape a single source (blog listing, guide listing, etc.)
   */
  async scrapeSource(siteConfig, sourceConfig) {
    console.log(`\nScraping ${sourceConfig.name} from ${sourceConfig.url}`);

    try {
      // Fetch the listing page
      const listingHtml = await this.fetchWithRetry(sourceConfig.url);

      // Extract individual page links
      const links = this.extractLinks(
        listingHtml,
        siteConfig.baseUrl,
        sourceConfig.selectors
      );
      console.log(`Found ${links.length} links to scrape`);

      if (links.length === 0) {
        console.warn(
          `No links found for ${sourceConfig.name}. Check selectors.`
        );
        return [];
      }

      // Scrape each individual page
      const results = [];

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        console.log(`Scraping ${i + 1}/${links.length}: ${link}`);

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

          // Be nice to the server
          await this.delay(1000);
        } catch (error) {
          console.error(`Failed to scrape ${link}:`, error.message);
          // Continue with other links
        }
      }

      console.log(
        `Successfully scraped ${results.length}/${links.length} pages from ${sourceConfig.name}`
      );
      return results;
    } catch (error) {
      console.error(
        `Failed to scrape source ${sourceConfig.name}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Simple delay utility
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = StaticFetcher;