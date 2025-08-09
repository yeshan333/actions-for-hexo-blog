---
title: Generate Slideshow-Style Documentation Sites for GitHub Repositories with iFLOW-CLI GitHub Action
comments: true
cover: https://ospy.shan333.cn/blog/iflow-cli-action/iflow-action-usage-demo.gif
mathjax: true
mermaid: true
keywords: "iFLOW CLI, AI Agent, GitHub Actions"
description: "Generate slideshow-style documentation sites for GitHub repositories with iFLOW-CLI GitHub Action"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
abstract: Welcome to my blog, enter password to read.
message: Welcome to my blog, enter password to read.
date: 2025-08-09 23:40:21
updated:
tags: [iFlow CLI, AI, GitHub Actions]
categories: [[iFlow CLI], [AI], [GitHub Actions]]
sticky:
password:
---

The iFLOW team from Alibaba [https://www.iflow.cn/](https://www.iflow.cn/) has recently open-sourced a terminal-based AI Agent tool [iFLOW CLI](https://github.com/iflow-ai/iflow-cli), which can currently be used **free of charge** with powerful models like Qwen3-Coder and Kimi K2. It's another product similar to Anthropic's [Claude Code](https://github.com/anthropics/claude-code).

> iFlow CLI is a powerful AI assistant that runs directly in the terminal. It can seamlessly analyze code repositories, execute programming tasks, understand contextual requirements, and enhance your work efficiency through automated processing from simple file operations to complex workflows.

Since it's a terminal-based AI Agent tool, it can be well utilized with Github Actions to automatically generate slideshow-style documentation sites.

Taking advantage of the release day, I immediately vibe-coded a GitHub Actions based on GitHub Copilot Agent and iFLOW CLI to facilitate large-scale usage in isolated GitHub Actions environments.

The GitHub Actions [https://github.com/marketplace/actions/iflow-cli-action](https://github.com/marketplace/actions/iflow-cli-action) has been published to GitHub's Marketplace. Feel free to try it out~

Here we'll introduce how to generate slideshow-style documentation sites based on this GitHub Actions. The final effect can be viewed at this website [https://vibe-ideas.github.io/iflow-cli-action/#/](https://vibe-ideas.github.io/iflow-cli-action/#/), with a preview as follows:

![iflow-action-usage-demo](https://ospy.shan333.cn/blog/iflow-cli-action/iflow-action-usage-demo.gif)

Next, let's see how to use this GitHub Actions.

## Using iFLOW CLI GitHub Action

To use this iFLOW CLI GitHub Action, you need to create a repository on GitHub [https://github.com/new](https://github.com/new), then create a `.github/workflows` directory in the repository, and create an `iflow-cli-action.yml` file in the `.github/workflows` directory to use the iFLOW CLI GitHub Action:

```shell
git clone https://github.com/yourname/your-repo.git
cd your-repo

mkdir -p .github/workflows
touch .github/workflows/iflow-cli-action.yml
```

The content of the iflow-cli-action.yml file is as follows:

```yaml
name: iFlow CLI Example
on: [push]

jobs:
  analyze-code:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run iFlow CLI
        uses: vibe-ideas/iflow-cli-action@v1.2.0
        with:
          prompt: "Analyze this codebase and suggest improvements"
          api_key: ${{ secrets.IFLOW_API_KEY }}
          model: "Qwen3-Coder"
          timeout: "1800"
          extra_args: "--debug"
```

`prompt` is the prompt that guides the AI Agent to complete your goal🎯.

`secrets.IFLOW_API_KEY` is the API access key for iFLOW CLI. You can register an account on the iFLOW CLI official website [https://www.iflow.cn/](https://www.iflow.cn/), and then obtain the key through this link [https://iflow.cn/?open=setting](https://iflow.cn/?open=setting).

We save the key to the GitHub repository's Secrets to avoid key leakage. Settings -> Secrets and variables -> Actions -> New repository secret, with the secret name `IFLOW_API_KEY`:

![iflow-cli-action-settings-1.jpg](https://ospy.shan333.cn/blog/iflow-cli-action/iflow-cli-action-settings-1.jpg)

![iflow-cli-action-settings-2.jpg](https://ospy.shan333.cn/blog/iflow-cli-action/iflow-cli-action-settings-2.jpg)

After completing the above configuration, commit the workflow file to the GitHub repository to use this GitHub Actions normally:

```shell
git add .
git commit -m "add iflow-cli-action.yml"
git push
```

After pushing, you can generally see the execution process and results in the repository's Actions. The effect is as follows [https://github.com/vibe-ideas/iflow-cli-action/actions/runs/16844856504](https://github.com/vibe-ideas/iflow-cli-action/actions/runs/16844856504):

![iflow-cli-action-settings-2.jpg](https://ospy.shan333.cn/blog/iflow-cli-action/iflow-cli-action-running-result.png)

Next, let's see how to generate the aforementioned slideshow-style documentation site based on the iFLOW CLI GitHub Action.

## Generating Slideshow-Style Documentation Sites with iFLOW CLI GitHub Action

Assuming you already know how to use the iFLOW CLI GitHub Action through the previous text. Here we directly provide the GitHub Actions configuration file for reference. This orchestration file is also placed in a public GitHub repository []():

```yaml
name: Build and Deploy Homepage

on:
  # Allow manual trigger
  workflow_dispatch:
  # Also run on pushes to main branch
  push:
    branches: [ main ]

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      GITHUB_PAGES: true
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Create homepage directory
        run: mkdir -p _site

      - name: Generate homepage using iFlow CLI
        uses: vibe-ideas/iflow-cli-action@main
        with:
          prompt: |
            Please read only the README.md file content from the current repository (do not read any other files), and convert it into a beautiful slideshow-style documentation website based on Reveal.js and save it as _site/index.html.
            
            Requirements:
            
            1. Use the Reveal.js framework to build a slideshow presentation, splitting the README content into multiple slide pages according to logical structure;
            
            2. Slideshow structure design:
               - Homepage slide: Project title, subtitle, GitHub link, and project introduction
               - Feature highlights slide: Showcase main features and characteristics
               - Installation guide slide: Step-by-step installation process
               - Usage examples slide: Display code examples and configuration instructions
               - Advanced features slide: Show advanced usage and best practices
               - Closing slide: Acknowledgments, contribution guidelines, and contact information;
            
            3. Use modern Reveal.js themes and configurations:
               - Enable horizontal and vertical navigation
               - Configure slide transition animation effects (such as slide, fade, zoom)
               - Add progress bar and slide counter
               - Support keyboard navigation and touch gestures
               - Enable autoplay functionality (pausable)
               - Add slide thumbnail overview;
            
            4. Visual design using surreal digital collage style:
               - Use vivid color contrasts and geometric elements
               - Create layered visual effects combining text and graphic elements
               - Use irregular shapes, transparency, and overlapping effects to create depth
               - Employ dynamic backgrounds and animated transitions for visual impact
               - Use abstract graphics and digital elements as decorative elements
               - Ensure overall design has artistic appeal and visual attraction;
            
            5. Font size and layout optimization (important):
               - Title font sizes: Main title 2.5em, subtitle 1.8em, section title 1.5em
               - Body text font size: Use 1.2em, ensure clear readability on all devices
               - Code font size: Use 0.9em, avoid code blocks being too large causing layout issues
               - Line height settings: Body text 1.6x line height, titles 1.4x line height
               - Content area margins: Set appropriate padding for each slide (60px top/bottom, 40px left/right)
               - Ensure sufficient spacing between text and background, avoid blocking and overlap
               - Limit content amount per slide to avoid information overload
               - Implement vertical scrolling for long code blocks instead of shrinking font;
            
            6. Code display optimization:
               - Use Reveal.js code highlighting plugin
               - Support syntax highlighting (YAML, Bash, Markdown, etc.)
               - Add line numbers and copy buttons
               - Use appropriate maximum height (60vh) and scrollbars for code blocks
               - Implement animated display effects for code snippets;
            
            7. Interactive features:
               - Add navigation menu and chapter jumping
               - Implement fullscreen mode and speaker mode
               - Support ESC key to display slide overview
               - Add sharing and export functionality;
            
            8. Responsive design:
               - Ensure good experience on desktop, tablet, and mobile devices
               - Appropriately reduce font size on mobile devices while maintaining readability
               - Adapt fonts and layout to different screen sizes
               - Optimize interaction experience for touch devices;
            
            9. Technical implementation:
                - Import latest version of Reveal.js from CDN
                - Configure necessary plugins (highlight.js, notes, zoom, etc.)
                - Add custom CSS styles to enhance visual effects
                - Ensure fast loading and smooth animation performance;
            
            10. SEO and accessibility:
                - Add complete meta tags and structured data
                - Ensure keyboard navigation accessibility
                - Add alt text and aria labels
                - Optimize search engine indexing.
            
            Please directly create a complete HTML file using inline CSS and JavaScript, ensuring the file is self-contained and can run directly in browsers.
            
            Project URL: https://github.com/version-fox/vfox-erlang
          api_key: ${{ secrets.IFLOW_API_KEY }}
          # settings_json: ${{ secrets.IFLOW_SETTINGS_JSON }}
          model: "Qwen3-Coder"
          timeout: "1800"
          extra_args: "--debug"

      - name: Verify reveal.js presentation was generated
        run: |
          if [ -f "_site/index.html" ]; then
            echo "Reveal.js presentation generated successfully!"
            echo "Checking for reveal.js content..."
            if grep -q "reveal.js" "_site/index.html"; then
              echo "✓ Reveal.js framework detected"
            else
              echo "⚠ Warning: Reveal.js framework not found in generated file"
            fi
            ls -la _site/
          else
            echo "Error: Presentation was not generated by iFlow"
            exit 1
          fi

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./_site

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Here, iFLOW CLI will generate a slideshow-style documentation site based on the repository's README and [reveal.js](https://revealjs.com/), and then publish it to the web through GitHub Pages. The effect can be seen at this website 👀 [https://version-fox.github.io/vfox-erlang/#/](https://version-fox.github.io/vfox-erlang/#/)

## Conclusion

I look forward to seeing what more creative things you can do with the iFLOW CLI Action~