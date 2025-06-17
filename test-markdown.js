const HtmlToMarkdownConverter = require("./src/parsers/htmlToMarkdown");

async function testMarkdownConverter() {
  console.log("🧪 Testing HTML to Markdown Converter\n");

  const converter = new HtmlToMarkdownConverter();

  console.log("=== Test 1: Basic Conversion ===");
  const result = converter.test();
  console.log("✅ Basic conversion test completed");

  console.log("\n=== Test 2: Real Blog Content ===");
  // Simulate some real blog content HTML
  const blogHtml = `
    <article class="post-content">
      <h1>Understanding Binary Search Trees</h1>
      <div class="author">By Nil Mamano</div>
      <p>Binary Search Trees (BSTs) are a fundamental data structure in computer science. 
      They provide <strong>efficient</strong> searching, insertion, and deletion operations.</p>
      
      <h2>Basic Operations</h2>
      <p>The main operations on a BST include:</p>
      <ul>
        <li><code>insert(value)</code> - Insert a new node</li>
        <li><code>search(value)</code> - Find if a value exists</li>
        <li><code>delete(value)</code> - Remove a node</li>
      </ul>

      <h3>Implementation Example</h3>
      <pre><code class="language-python">
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def insert(root, val):
    if not root:
        return TreeNode(val)
    
    if val < root.val:
        root.left = insert(root.left, val)
    else:
        root.right = insert(root.right, val)
    
    return root
      </code></pre>

      <blockquote>
        <p><em>Time Complexity:</em> O(log n) average case, O(n) worst case</p>
      </blockquote>

      <p>For more advanced topics, see the <a href="/advanced-trees">Advanced Trees</a> section.</p>

      <!-- Navigation and other elements that should be removed -->
      <nav class="post-navigation">
        <a href="/prev">Previous</a>
        <a href="/next">Next</a>
      </nav>

      <div class="social-share">
        <button>Share on Twitter</button>
        <button>Share on LinkedIn</button>
      </div>
    </article>
  `;

  console.log("Converting blog HTML to Markdown...");
  const blogMarkdown = converter.convert(blogHtml);

  console.log("✅ Blog content converted");
  console.log("📄 Markdown output:");
  console.log("─".repeat(50));
  console.log(blogMarkdown);
  console.log("─".repeat(50));

  console.log("\n=== Test 3: Conversion with Context ===");
  const contextMarkdown = converter.convertWithContext(blogHtml, {
    title: "Understanding Binary Search Trees",
    author: "Nil Mamano",
    baseUrl: "https://nilmamano.com/blog/bst-basics",
  });

  console.log("✅ Conversion with context completed");
  console.log("📄 Markdown with context:");
  console.log("─".repeat(50));
  console.log(contextMarkdown);
  console.log("─".repeat(50));

  console.log("\n=== Test 4: Error Handling ===");

  // Test with malformed HTML
  const malformedHtml = `<div><p>Unclosed paragraph<div>Nested without closing</p>`;
  const errorResult = converter.convert(malformedHtml);
  console.log("✅ Error handling test completed");
  console.log(`📄 Result length: ${errorResult.length} characters`);

  // Test with empty/null input
  const emptyResult = converter.convert("");
  const nullResult = converter.convert(null);
  console.log(`📄 Empty input result: "${emptyResult}"`);
  console.log(`📄 Null input result: "${nullResult}"`);

  console.log("\n🎉 Markdown converter testing complete!");
}

// Run the test
if (require.main === module) {
  testMarkdownConverter().catch(console.error);
}

module.exports = testMarkdownConverter;
