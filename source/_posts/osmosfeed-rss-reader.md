---
title: 使用 osmosfeed 创建自己的 Web RSS 阅读器
toc: true
comments: true
popular_posts: false
mathjax: false
pin: false
headimg: https://cdn.jsdelivr.net/gh/ssmath/mypic/you%20really%20need%20rss.png
date: 2021-06-29 15:34:20
tags: [RSS Reader]
categories:
  - [blog]
  - [RSS]
keywords: "rss feed, web reader"
---

之前一直用 App Store 上的一个 RSS 阅读器 RSS Reader Prime 订阅技术周刊和 dalao 的技术博客，不得不说挺好用的，奈何全线下架了，现在就平板上保留着这个 App，手机上没有（国区好用的 RSS 阅读器基本无了）。有时候又想着用手机读读技术文章（板子太大，不好拿），于是乎翻了下 GitHub [rss-reader topic](https://github.com/topics/rss-reader) 下的相关阅读器项目，挑了手基于 Web 和 GitHub Pages 的 RSS 阅读器（Web 才是真的“跨端”，2333~），水篇文章微微记录下。

<!-- more -->

## 什么是 RSS

> [RSS](https://baike.baidu.com/item/rss/24470), Really Simple Syndication. 一种描述和同步网站内容的 XML 格式，一般网站都会提供 RSS，有利于让用户通过 **RSS Feed**（RSS源，一般即为站点的RSS地址） 获取网站内容的最新更新。

更多关于 RSS 的内容在 GitHub 上有个名为 ALL-about-RSS 的项目有介绍。

## 使用 osmosfeed 搭建 Web-based RSS 阅读器

osmosfeed 是 GitHub 上开源的一个 RSS Web 版阅读器，可以使用 GitHub Pages 托管，主题可自定义。

1、首先根据 osmosfeed 的模板仓 [osmosfeed-template](https://github.com/osmoscraft/osmosfeed-template) 新建个人仓库。

> 戳此链接使用模板仓库：[https://github.com/osmoscraft/osmosfeed-template/generate](https://github.com/osmoscraft/osmosfeed-template/generate)

{% gallery %}
![通过模板库新建个人公共仓库](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210629211254.png)
{% endgallery %}

2、仓库建好后，GitHub Actions 会自动触发 RSS Web Reader 构建的 action[`Build site on schedule or main branch update`](https://github.com/yeshan333/osmosfeed-rss-reader/blob/main/.github/workflows/update-feed.yaml)，构建产物将会被推送到仓库的 gh-pages 分支。


3、最近 GitHub 更新了波，GitHub Pages 的开启有了新的选项卡，仓库顶部 `Settings` -> 左侧边栏 `Pages`，调整发布源分支*gh-pages*，反手一个 Save 就好了。

{% gallery %}
![开启仓库 Pages，源分支为 gh-pages](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210629212354.png)
{% endgallery %}

4、订阅源可直接编辑根目录下的 [osmosfeed.yaml](https://github.com/yeshan333/osmosfeed-rss-reader/blob/main/osmosfeed.yaml) 文件，反手把自己博客订阅上👻😎。preview: [https://shansan.top/osmosfeed-rss-reader/](https://shansan.top/osmosfeed-rss-reader/)

```yaml
# cacheUrl: https://GITHUB_USERNAME.github.io/REPO_NAME/cache.json
sources:
  - href: https://github.com/osmoscraft/osmosfeed/releases.atom # Get new feature announcement via this feed
  - href: https://shansan.top/rss2.xml
```

action 在没有对仓库 main 分支变动的情况下，会每天自动触发一次。

{% gallery %}
![action schedule, crontab.guru](https://cdn.jsdelivr.net/gh/ssmath/mypic/20210629214608.png)
{% endgallery %}

更多操作可参考 osmosfeed 项目的 README：https://github.com/osmoscraft/osmosfeed
