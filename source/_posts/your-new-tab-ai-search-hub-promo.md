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
keywords: "AI search, browser extension, new tab, Google AI Search, Grok Search, Metaso, X Search, Your New Tab"
description: "指挥 Claude 和 Codex 折腾了一个开源浏览器扩展 Your New Tab，把新标签页改成 AI 搜索入口，一次输入后可以发给 Google AI Search、Grok Search、Metaso、X Search 等服务。"
cover: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
banner: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
poster: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
thumbnail: https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/assets/icon-source.png
---

![Your New Tab 使用演示](https://raw.githubusercontent.com/vibe-ideas/your-new-tab/main/demo.gif)

最近我经常在几个 AI 搜索之间切来切去。

查一些比较新的资料，可能会顺手打开 Google AI Search；想看看 Grok Search 的结果，又得切到 Grok；有时候还想试试 Metaso 或 X Search 会怎么回答。一个问题复制几遍、几个页面来回切，次数多了还是挺烦的。

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
- 自定义服务只需要在扩展弹窗里填 URL 模板，私有网关也能加进去
- 新标签页上的快捷入口也可以自己改，直接粘贴 JSON 即可
- 会保留本地搜索历史，方向键可以快速翻出来再问一次
- 数据都存在浏览器本地，不做代理，也没有遥测

这几个点不花哨，但对我来说还挺实用的。比如同一个问题先丢给 Grok Search，觉得结果不够，再换 Google AI Search、Metaso 或 X Search 对照一下。以前要来回开页面，现在基本在新标签页里就能完成。

## 自定义新标签页

除了搜索引擎，新标签页下面那排常用入口也可以改。现在不需要再放一个远程书签 JSON 地址了，直接在扩展弹窗里选择 JSON 模式，把配置粘进去即可。

每一项主要就是 `title`、`url` 和 `icon`。`icon` 可以放 SVG 字符串，也可以放图片地址。

{% folding "快捷入口 JSON 示例" %}

```json
[
  {
    "id": "1",
    "title": "ShanSan",
    "url": "https://shansan.top/",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>"
  },
  {
    "id": "2",
    "title": "GitHub",
    "url": "https://github.com",
    "icon": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22\"/></svg>"
  },
  {
    "id": "3",
    "title": "daily.dev",
    "url": "https://app.daily.dev/",
    "icon": "https://app.daily.dev/favicon.ico"
  }
]
```

{% endfolding %}

## 使用方式

现在支持 Chrome 和 Firefox，代码放在 GitHub 上，MIT 协议：

- GitHub：[github.com/vibe-ideas/your-new-tab](https://github.com/vibe-ideas/your-new-tab)
- 官网：[vibe-ideas.github.io/your-new-tab](https://vibe-ideas.github.io/your-new-tab/)

安装之后打开新标签页就可以用了。如果默认的搜索服务不够用，可以在扩展弹窗里继续加。

整体上就是一个很小的工具，不复杂，但刚好解决了我最近频繁切 AI 搜索的麻烦。如果你也有类似的使用习惯，可以拿去试试看。有问题欢迎提 Issue。
