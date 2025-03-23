---
title: 手把手教你如何在 Sider (ChatGPT Sidebar) 中免费使用通义千问 
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "手把手教你如何在 Sider (ChatGPT Sidebar) 中免费使用通义千问"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: https://telegraph.shansan.top/file/d9c87ca70a7d46c9e9ce0.png
description: "手把手教你如何在 Sider (ChatGPT Sidebar) 中免费使用通义千问"
date: 2024-05-29 00:29:49
updated:
tags: ["Sider", "通义千问"]
categories:
  - [大模型]
  - [LLMs]
  - [Sider]
---

最近国产大模型正在疯狂降价，推出了众多的免费策略，是时候该“白嫖”一手了。用过 Sider 的小伙伴应该很少有说不“妙”啊，用户体验也做得很棒。奈何它要开通使用全部的功能价格有可能不太能承受，且有些功能不一定用得上。但是免费，又有一定的额度和次数限制。Sider 其实是支持用户使用自己的 OpenAI 密钥的，但 OpenAI 的价格也不太低呐。

接下来本文将会介绍如何在 Sider 中“免费”使用通义千问。足够大部分场景的使用了。

## 什么是 Sider (ChatGPT Sidebar)

>Sider 是一款智能工具,可以添加到您的浏览器中,帮助您轻松完成各种在线任务。它使用 ChatGPT、GPT-4、Gemini 和 Claude 3 等 API,可以帮助您进行写作、阅读、聊天以及内容摘要等。以下是 Sider 的主要功能:

> 聊天任何话题、文件、图像 - 您可以就任何感兴趣的话题进行聊天, 甚至可以向 Sider 展示图片或文档,它会给出清晰的答复或建议,让每次聊天都很有趣且有帮助。

> 更快地阅读网页、选定文本、电子邮件 - Sider 可以帮助您更快地浏览网页、文本和电子邮件, 提供要点总结, 让您轻松快速地浏览长篇文章或消息。

> 更好地写作任何内容 - 无论是电子邮件、文章还是消息, Sider 都可以帮助您改善写作质量,提供建议以使您的写作更符合您的风格和目的。

> 等等

访问产品官网即可在浏览器快速安装 Sider 插件: [https://sider.ai/zh-CN/](https://sider.ai/zh-CN/)


## 在 Sider 浏览器插件中使用通义千问

> "通义千问"是阿里云开发的一款大型语言模型.

如果你用过 Sider，应该知道能在通用配置处配置自己的 OpenAI 密钥的。要想在 Sider 中使用通义千问大模型，我们也需要用到这个配置。

最近阿里云的灵积模型服务开放 API 出了 OpenAI 的兼容模式接口 -> [OpenAI接口兼容](https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope/?spm=a2c4g.11186623.0.0.5ded5b78He8YAy), 这意味着我们使用这个兼容接口作为 Sider 插件的配置即可使用通义千问。如下图，我们有三个配置需要填写：

![settings](https://telegraph.shansan.top/file/347edb0faac6d22aec6b4.png)

- 1、API Key 从阿里云的模型服务灵积控制台获取 -> [获取 API Key](https://help.aliyun.com/zh/dashscope/opening-service?spm=a2c4g.11186623.0.0.4262fa70VPao9L)
- 2、url 填写：[https://dashscope.aliyuncs.com/compatible-mode](https://dashscope.aliyuncs.com/compatible-mode)
- 3、使用自定义模型名称，Model Name 填写你想使用的大模型名字，比如 qwen-turbo, 模型可以从这里找到: [通义前文-模型概览](https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction?spm=a2c4g.11186623.0.0.2167140baXMR9G)

配置完成之后，就可以直接使用它啦~

![demo](https://telegraph.shansan.top/file/d5e6ebefdc52698262021.png)
