---
title: 使用 n8n 和飞书多维表打造自己的 RSS 订阅、AI 阅读整理工作流
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: SEO 关键词
music:
  enable: false
  server: netease
  type: song
  id: 26664345
headimg: 文章头图 url 824x280
thumbnail: 标题右边缩略图 url
description: RSS 描述
abstract: Welcome to my blog, enter password to read.
message: Welcome to my blog, enter password to read.
date: 2025-07-12 23:52:37
updated:
tags:
categories:
password:
---

2025 年是 AI 应用大爆发的一年。最近工作内外，都在通过一些可视化的低代码平台疯狂搞些工作流来玩玩。试用了 coze、dify、n8n 等几个产品之后，[n8n](https://n8n.io/) 的单步调试体验、强大的三方插件深得我心。而且可以自部署 & 开源（超级高的 star 数量 10w+， 同时意味着社区不会差，解决问题应该很方便），开源自部署版本相比于企业版阉割不算太多，正好可以用上刚搞的火山引擎的 4C8G 服务器上。

2024 年 4、5 月的时候曾经拿 [Elixir](https://elixir-lang.org/) 撸过一个用于定时跟踪、结合 AI 总结我的 RSS 订阅最新文章，并将总结内容推送到我的个人 TG 频道的后台应用（我称之为 **rss_generic_i18n_bot**）。AI 很可以很好的将我订阅的各种语言（中文、英文、日文等）博客/播客整理成精炼的中文，方便消化，母语相对于其他语言还是更容易进行信息吸收的。这个应用我一直用到了现在。由于代码基本全自己撸的，现在仍然还有不少 BUG 残留o(╯□╰)o，缝缝补补~:

![rssbot-bug-track.jpg](http://ospy.shan333.cn/blog/n8n_blog_post/rssbot-bug-track.jpg)

> Elixir 的生态一言难尽~刚开始操作的时候，都没啥好用的 AI 基础库。

> 可能有小伙伴会有疑惑，为啥不用诸如 [Folo](https://github.com/RSSNext/Folo)、Inoreader 这些强大的可以很方便处理 RSS 信息源的软件。原因是我本意上想尽可能的少打开一些软件，就可以很方便的崛取我想要的信息。所以我将处理后的信息发送到了诸如 TG、钉钉这样经常打开的即时消息软件群组内。现在的 IM 消息展现能力也不差了，搜索能力也自带。

最近我使用了 n8n 编排了一个工作流出来，去替代之前的这个后台应用 **rss_generic_i18n_bot**。遂写篇文章记录一下过程，也可以给使用 n8n 搭建工作流的小伙伴一点参考。

## 使用 docker 部署 n8n

最先开始的部分肯定是先部署好 n8n 这个可视化工作流编排平台。这里给出我使用的 docker-compose 编排文件，镜像走了 [m.daocloud.io](m.daocloud.io) 这个镜像源（国内访问不了 Dockerhub 了，需要“奇技”），速度还可以:

```yaml
version: '3.8'

services:
  n8n:
    image: m.daocloud.io/docker.io/n8nio/n8n
    container_name: n8n
    ports:
      - "5678:5678"
    volumes:
      - ./data:/home/node/.n8n
    stdin_open: true
    tty: true
    restart: unless-stopped
    environment:
      - N8N_HOST=your-domain
      - N8N_PORT=5678
      # - N8N_PROTOCOL=https
      - NODE_ENV=production
      - N8N_LOG_OUTPUT=file
      - WEBHOOK_URL=https://your-domain/
      - GENERIC_TIMEZONE=Asia/Shanghai
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - N8N_RUNNERS_ENABLED=true
      - N8N_SECURE_COOKIE=false
```

```shell
# 使用 docker-compose 可以直接启动
docker-compose up -d
```

我将其部署在了火山引擎的 ECS 服务器上，部署架构如下图:

![n8n-deployment.png](http://ospy.shan333.cn/blog/n8n_blog_post/n8n-deployment.png)

我在 n8n 容器的前面套了一层反向代理，方便我们挂 SSL/TLS 证书和套个防火墙监控我们的流量信息。

> 注意 n8n 开启了 origin 校验，反向代理服务器可以通过 `proxy_set_header Origin http://127.0.0.1` 固定死 n8n Allow 允许的 Origin，避免在 n8n 编辑面板经常遇到 WebSocket 的 [Connection Lost](https://community.n8n.io/t/connection-lost-you-have-a-connection-issue-or-the-server-is-down-n8n-should-reconnect-automatically-once-the-issue-is-resolved/80999) 导致保存不了工作流的问题。


如果没有云服务器的小伙伴也可以参考这篇文章 [《Cursor一键生成n8n工作流+永久免费「n8n云部署」白嫖与效率齐飞~》](https://mp.weixin.qq.com/s/E-WI4fY8cRzFN991_iDTIw) 使用 Claw Cloud 将 n8n 部署在海外，只需要使用 GitHub 注册且 GitHub 已经注册过 180 天已上，那么就可以每个月获得5美元赠送额度。基本够用了。可以说是免费使用 Claw Cloud 部署 n8n 了。我有一部分需要访问海外服务（如果 Google Sheet）的工作流就用了它。部署很方便，Claw Cloud 内置的 App Store 市场就有快速部署的模板。

部署完成之后，就可以进入管理页面，编排我们的工作流，接下来介绍如何使用 n8n 和飞书多维表打造自己的 RSS 订阅、AI 阅读整理工作流。

## 工作流的设计

经常使用 RSS 管理自己的信息源的小伙伴可能知道，订阅 RSS Feed 链接和阅读 RSS 源的文章是主要的两个高频动作。所以我这里主要拆分出了两个工作流来分别完成 **RSS 链接的订阅处理工作流**和**基于 AI 大模型 的RSS 文章信息获取、整理和推送工作流**。

### RSS 链接的订阅处理工作流

RSS 链接的订阅处理工作流，主要负责基于 n8n 的 Webhook 接收从飞书等即时消息软件发送过来“带 RSS Feed 订阅链接”的消息，将 RSS Feed 订阅链接存放到飞书的多维表格中。如下图：

![rss-feed-workflow.png](http://ospy.shan333.cn/blog/n8n_blog_post/rss-feed-workflow.png)

- Webhook 会监听我们发送给飞书机器人的消息，触发整个流程的执行；
- AI Agent 节点可以处理我们发送给飞书机器人包含 RSS Feed 链接任意格式的消息，自动抽取订阅链接，给后续节点提取 RSS 订阅源信息存放到飞书多维表格使用；
- 飞书多维表格：作为数据库，去持久化存储我们所有订阅的订阅链接，给另外一个工作流去使用。

使用效果如下图，操作的多维表格如下:



这里我们直接给出 n8n json 格式的工作流, 你可以直接复制粘贴到 n8n 的编排面板使用它：

```json

```

#### 工作流使用注意

1. n8n 官方自带的节点不支持操作飞书的数据，部署完成后需要先到 Settings -> community-nodes 安装社区的插件: [n8n-nodes-feishu-lite](https://community.n8n.io/t/custom-feishu-node/78169).
2. 要操作飞书的多维表格需要申请飞书的[开发者应用](https://open.feishu.cn/app)，给改应用分配对应的操作权限，流程可以参考: [飞书服务端 API 调用流程概述](https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/overview) 去获取 n8n-nodes-feishu-lite 插件使用的调用凭证 (Credentials).
3. 飞书应用需要开通“机器人能力”，并分配多维表的数据记录创建、读取权限。
4. 被工作流操作的飞书多维表，需要添加新创建的应用作为“文档应用”，并赋予可以编辑的权限。
5. 飞书应用管理后台添加 n8n Webhook 回调地址，以便能处理飞书发送给应用机器人的消息。

![bitable-acls](http://ospy.shan333.cn/blog/n8n_blog_post/bitable-acls.png)

![add-feishu-app-to-bitable](http://ospy.shan333.cn/blog/n8n_blog_post/add-feishu-app-to-bitable.png)

![add-webhook-to-feishu.png](http://ospy.shan333.cn/blog/n8n_blog_post/add-webhook-to-feishu.png)

接下来看看“基于 AI 大模型 的 RSS 文章信息获取、整理和推送工作流”。

### 基于 AI 大模型 的 RSS 文章信息获取、整理和推送工作流

RSS Feed 的订阅处理完成了。下图的工作流主要用于定时从我们的飞书多维表格中获取订阅的 RSS Feed 链接。然后逐一读取每一条订阅链接，获取其最进 3 天发布的新文章内容，通过 AI 大模型获取文章内容，整理提炼后，发送到即时消息软件（TG、飞书）群组内，发送成功后会将已经发送过的链接记录到多维表中，便于发送的前判断是否已经处理过这个新链接。

![rss-summary-workflow.png](http://ospy.shan333.cn/blog/n8n_blog_post/rss-summary-workflow.png)

#### 工作流使用注意

### 编排文件分享


## 结语
