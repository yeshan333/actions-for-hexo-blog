---
title: "Your New Tab：把常用的 AI 搜索放进新标签页"
toc: true
comments: true
popular_posts: false
mathjax: false
sticky: 3
top: false
date: 2026-05-17 17:13:00
tags: [AI, 浏览器扩展, 工具推荐, 开源]
categories: 工具
keywords: "AI search, browser extension, new tab, Google AI Search, Grok Search, Perplexity, Your New Tab"
description: "指挥 Claude 和 Codex 折腾了一个开源浏览器扩展 Your New Tab，把新标签页改成 AI 搜索入口，方便在 Grok Search、Google AI Search、Perplexity 等搜索服务之间切换。"
cover: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
banner: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
poster: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
thumbnail: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
---

![Your New Tab 新标签页全貌](https://blog-cloudflare-imgbed.pages.dev/file/1779011581521_01-newtab-overview.png)

最近我经常在几个 AI 搜索之间切来切去。

查一些比较新的资料，可能会顺手打开 Perplexity；想看看 Google AI Search 的结果，又得切到 Google；有时候还想试试 Grok Search 会怎么回答。一个问题复制几遍、几个页面来回切，次数多了还是挺烦的。

于是趁着有空，指挥 Claude 和 Codex 折腾了一个小浏览器扩展：[Your New Tab](https://github.com/vibe-ideas/your-new-tab)。

它干的事情很简单：把浏览器的新标签页换成一个搜索框，输入问题之后，选择要丢给哪个 AI 搜索服务。

![点击搜索框左侧即可切换 AI 引擎](https://blog-cloudflare-imgbed.pages.dev/file/1779011600161_02-provider-menu.png)

## 为什么放在新标签页

新标签页基本是每天打开最多的页面之一。以前它大概率就是一个搜索框，加一堆快捷入口。但实际用下来，快捷入口我点得并不多，反而每次想查东西都会先 `⌘ + T`。

那干脆就把这个动作改成：

1. 打开新标签页
2. 输入问题
3. 选择一个搜索服务

少一次打开站点、少一次复制粘贴，对我来说就够了。

![输入问题后直接发送到选定的 AI 引擎](https://blog-cloudflare-imgbed.pages.dev/file/1779011604436_03-search-typed.png)

## 现在能做什么

目前功能不复杂，主要是围绕我自己的使用习惯让它们一点点加出来的：

- 可以在一个搜索框里切换不同的 AI 搜索服务
- 内置了一些常见服务，也可以自己添加新的
- 自定义服务只需要填 URL 模板，私有网关也能加进去
- 会保留本地搜索历史，方向键可以快速翻出来再问一次
- 数据都存在浏览器本地，不做代理，也没有遥测

自定义配置大概长这样：

![配置面板 — 自由添加和管理搜索引擎](https://blog-cloudflare-imgbed.pages.dev/file/1779011614460_popup-search-providers.png)

这几个点不花哨，但对我来说还挺实用的。比如同一个问题先丢给 Grok Search，觉得结果不够，再换 Google AI Search 或 Perplexity 对照一下。以前要来回开页面，现在基本在新标签页里就能完成。

## 使用方式

现在支持 Chrome 和 Firefox，代码放在 GitHub 上，MIT 协议：

- GitHub：[github.com/vibe-ideas/your-new-tab](https://github.com/vibe-ideas/your-new-tab)
- 官网：[vibe-ideas.github.io/your-new-tab](https://vibe-ideas.github.io/your-new-tab/)

安装之后打开新标签页就可以用了。如果默认的搜索服务不够用，可以在扩展弹窗里继续加。

整体上就是一个很小的工具，不复杂，但刚好解决了我最近频繁切 AI 搜索的麻烦。如果你也有类似的使用习惯，可以拿去试试看。有问题欢迎提 Issue。
