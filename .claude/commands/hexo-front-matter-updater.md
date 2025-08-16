---
title: Hexo Front-matter Updater
description: Automatically categorize and tag Hexo blog posts by analyzing their markdown content and updating the front-matter accordingly.
command: |
  claude-code agent hexo-front-matter-updater "$@"
examples:
  - description: Update front-matter for a specific post
    command: claude-code hexo-front-matter-updater /source/_posts/my-new-tech-article.md
  - description: Update front-matter for all posts
    command: claude-code hexo-front-matter-updater /source/_posts/*.md
---