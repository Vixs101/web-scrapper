## Problem: 

Aline is a technical thought leader marketing her new book Beyond Cracking the Coding Interview. She wants to leave helpful Reddit comments using our tool.

Our AI generates great personal comments (eg: ADHD founder). But it's weak on technical ones (eg: Options trader)

If we can’t fix this, we’ll lose important customers like Aline.

Right now, our tool pulls from a user’s knowledgebase to generate comments.

To help Aline, we need to import her technical knowledge (blogs, guides, and book)  into that knowledgebase.

## Your Task:

Build a scraper that pulls content into our knowledgebase format.

### Sources to scrape:
* Every blog post on interviewing.io: https://interviewing.io/blog
* Every company guide here: https://interviewing.io/topics#companies 
* Every interview guide here: https://interviewing.io/learn#interview-guides
* All of Nil's DS&A blog posts: https://nilmamano.com/blog/category/dsa
* First 8 chapters of her book (PDF) Google Drive Link

## Requirements:
* Solve the core problem (importing technical knowledge)
* Make it reusable for future customers
* End-to-end delivery — no half-done projects

## Scoring
No rules. Vibe code. Use repos, APIs, whatever works.
You’ll be scored on:
How robust your implementation is (e.g. does it work on https://quill.co/blog?)
How well you understand what you're building
Your thinking process - why you built it the way you did


## Input Examples:
Blog URL (e.g. https://interviewing.io/blog)
PDF upload (e.g. Aline’s book)


## Expected Output:
```
{
  "team_id": "aline123",
  "items": [
    {
      "title": "Item Title",
      "content": "Markdown content",
      "content_type": "blog|podcast_transcript|call_transcript|linkedin_post|reddit_comment|book|other",
      "source_url": "optional-url",
      "author": "",
      "user_id": ""
    }
  ]
}
```




