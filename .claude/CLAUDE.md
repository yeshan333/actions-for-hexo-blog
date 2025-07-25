# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hexo blog project that uses GitHub Actions for CI/CD deployment to GitHub Pages. The blog content is deployed to <https://yeshan333.github.io>.

## Key Commands

- `npm install` - Install project dependencies
- `npm run build` - Generate static files (hexo generate)
- `npm run clean` - Clean cached files and generated files (hexo clean)
- `npm run server` or `npm start` - Start local development server (hexo server)

## Architecture and Structure

- **Hexo Framework**: Static site generator based on Node.js
- **Themes**: Multiple themes available (volantis variants, landscape, material_x)
- **Content**: Blog posts stored in `source/_posts/` directory
- **Configuration**: Main config in `_config.yml`, theme-specific configs in `_config.volantis576.yml`
- **Deployment**: GitHub Actions workflow in `.github/workflows/hexo_blog_build_and_deploy_ci.yaml`

## CI/CD Process

The GitHub Actions workflow:

1. Builds the Hexo site on Ubuntu runner
2. Deploys to GitHub Pages (yeshan333.github.io repository)
3. Optionally syncs to personal cloud machine via rsync

## Development Workflow

1. Make changes to content in `source/_posts/` or configuration files
2. Test locally with `npm run server`
3. Commit changes to main branch
4. GitHub Actions automatically builds and deploys
