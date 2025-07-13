---
title: 使用 n8n 和飞书多维表打造自己的 RSS Feed 订阅管理 & AI 大模型阅读提炼工作流
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "AI, N8N, n8n, 飞书， 多维表, RSS"
headimg: https://ospy.shan333.cn/blog/n8n_blog_post/banner.jpg
description: "使用 n8n 和飞书多维表打造自己的 RSS Feed 订阅管理 & AI 大模型阅读提炼工作流"
date: 2025-07-12 23:52:37
updated: 2025-07-13 15:52:37
tags: ["AI", "n8n", "飞书多维表", "RSS"]
categories: ["AI"]
---

2025 年是 AI 应用大爆发的一年. 最近工作内外, 都在通过一些可视化的低代码平台疯狂搞些基于 AI 的工作流来玩. 试用了 coze、dify、n8n 等几个产品之后, [n8n](https://n8n.io/) 的单步调试体验、强大的三方插件深得我心. 而且可以自部署 & 开源（超级高的 star 数量 10w+, 同时意味着社区不会差, 解决问题应该很方便）, 开源自部署版本的功能相比于企业版阉割不算太多, 正好可以用上刚搞的火山引擎的 ECS 4C8G 服务器. 

2024 年 4、5 月的时候曾经拿 [Elixir](https://elixir-lang.org/) 撸过一个用于定时跟踪、结合 AI 总结我的 RSS 订阅最新文章, 并将总结内容推送到我的个人 TG 频道的后台应用（我称之为 **rss_generic_i18n_bot**. AI 可以很好的将我订阅的各种语言（中文、英文、日文等）博客/播客整理成精炼的中文, 方便消化, 母语相对于其他语言还是更容易进行信息吸收的. 这个应用我一直用到了现在. 由于代码基本全自己撸的, 现在仍然还有不少 BUG 残留o(╯□╰)o, 缝缝补补~:

![rssbot-bug-track.jpg](https://ospy.shan333.cn/blog/n8n_blog_post/rssbot-bug-track.jpg)

> Elixir 的生态一言难尽~刚开始操作的时候, 都没啥好用的 AI 基础库.

> 可能有小伙伴会有疑惑, 为啥不用诸如 [Folo](https://github.com/RSSNext/Folo)、Inoreader 这些强大的可以很方便处理 RSS 信息源的软件. 原因是我本意上想尽可能的少打开一些软件, 就可以很方便的崛取我想要的信息. 所以我将处理后的信息发送到了诸如 TG、钉钉这样经常打开的即时消息软件群组内. 现在的 IM 软件消息展现能力也不差了, 搜索能力也基本够用，不用自己搞一大堆功能了. 

最近我使用了 n8n 编排了一个工作流出来, 去替代之前的这个后台应用 **rss_generic_i18n_bot*. 遂写篇文章记录一下过程, 也可以给使用 n8n 搭建工作流的小伙伴一点参考. 

## 使用 docker 部署 n8n

最先开始的部分肯定是先部署好 n8n 这个可视化工作流编排平台. 这里给出我使用的 docker-compose 编排文件, 镜像走了 [m.daocloud.io](m.daocloud.io) 这个镜像源（国内访问不了 Dockerhub 了, 需要“奇技”）, 速度还可以:

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

我将其部署在了火山引擎的 ECS 服务器上, 部署架构如下图:

![n8n-deployment.png](https://ospy.shan333.cn/blog/n8n_blog_post/n8n-deployment.png)

我在 n8n 容器的前面套了一层反向代理, 方便我们挂 SSL/TLS 证书和套个防火墙监控我们的流量信息. 

> 注意 n8n 开启了 origin 校验, 反向代理服务器可以通过 `proxy_set_header Origin http://127.0.0.1` 固定死 n8n Allow 允许的 Origin, 避免在 n8n 编辑面板经常遇到 WebSocket 的 [Connection Lost](https://community.n8n.io/t/connection-lost-you-have-a-connection-issue-or-the-server-is-down-n8n-should-reconnect-automatically-once-the-issue-is-resolved/80999) 导致保存不了工作流的问题. 


如果没有云服务器的小伙伴也可以参考这篇文章 [《Cursor一键生成n8n工作流+永久免费「n8n云部署」白嫖与效率齐飞~》](https://mp.weixin.qq.com/s/E-WI4fY8cRzFN991_iDTIw) 使用 Claw Cloud 将 n8n 部署在海外, 只需要使用 GitHub 注册且 GitHub 已经注册过 180 天以上, 那么就可以每个月获得 5 美元赠送额. 基本够用. 可以说是免费使用 Claw Cloud 部署 n8n 了. 我有一部分需要访问海外服务（如果 Google Sheet）的工作流就用了这种部署方式. 部署很方便, Claw Cloud 内置的 App Store 市场就有快速部署的模板. 

部署完成之后, 就可以进入管理页面, 编排我们的工作流, 接下来介绍如何使用 n8n 和飞书多维表打造自己的 RSS 订阅、AI 阅读整理工作流. 

## 工作流的设计

经常使用 RSS 管理自己的信息源的小伙伴可能知道, 订阅 RSS Feed 链接和阅读 RSS 源的文章是主要的两个高频动作. 所以我这里主要拆分出了两个工作流来分别完成这两项任务：**RSS 链接的订阅处理工作流**和**基于 AI 大模型 的 RSS 文章信息获取、整理和推送工作流*. 

### RSS 链接的订阅处理工作流

RSS 链接的订阅处理工作流, 主要负责基于 n8n 的 Webhook 接收从飞书等即时消息软件发送过来“带 RSS Feed 订阅链接”的消息, 将 RSS Feed 订阅链接存放到飞书的多维表格. 如下图：

![rss-feed-workflow.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-feed-workflow.png)

- Webhook 会监听我们发送给飞书机器人的消息, 触发整个流程的执行；
- AI Agent 节点可以处理我们发送给飞书机器人包含 RSS Feed 链接任意格式的消息, 自动抽取订阅链接, 给后续节点提取 RSS 订阅源信息存放到飞书多维表格使用；
- 飞书多维表格：作为数据库, 去持久化存储我们所有订阅的订阅链接, 给另外一个工作流去使用. 

在飞书管理订阅链接的效果如下图, 操作的多维表格如下:

{% gallery::::one %}
![add-rss-feed-with-bot.jpg](https://ospy.shan333.cn/blog/n8n_blog_post/add-rss-feed-with-bot.jpg)
![rss-feed-bitable.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-feed-bitable.png)
{% endgallery %}

左图是我们直接在飞书机器人聊天窗口，与应用机器人对话，触发 RSS 订阅管理工作流，触发完成后，可以直接在右图的多维表看到对应的订阅记录。

#### 工作流编排文件分享 

这里我们直接给出 n8n json 格式的工作流, 你可以直接复制粘贴到 n8n 的编排面板使用它：

{% folding 点击我查看 %}

```json
{
  "name": "飞书机器人控制 RSS 订阅链接 copy",
  "nodes": [
    {
      "parameters": {
        "enableResponseOutput": true,
        "respondWith": "json",
        "responseBody": "={ \n    \"challenge\": \"{{ $json.body.challenge }}\"\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        -1960,
        280
      ],
      "id": "0b0f6f7e-6536-4d12-a857-1298beedad66",
      "name": "Feishu webhook challenge"
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "208945ae-e6c1-4300-95c9-ec33780510cc",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -2180,
        280
      ],
      "id": "75f4f05f-eb18-4872-ae7b-a3d63fe4d612",
      "name": "Feishu Webhook",
      "webhookId": "208945ae-e6c1-4300-95c9-ec33780510cc"
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "qwen3-32b",
          "mode": "list",
          "cachedResultName": "qwen3-32b"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        -1660,
        500
      ],
      "id": "4420f524-6d40-47f7-9e65-441ca0b48689",
      "name": "OpenAI Chat Model",
      "credentials": {
        "openAiApi": {
          "id": "8Hmy9d6o6D8KLcY2",
          "name": "Qwen"
        }
      }
    },
    {
      "parameters": {
        "resource": "bitable",
        "operation": "bitable:table:record:add",
        "app_toke": "EEqtbliicaf3qRsgGPFcAxUtn1c",
        "table_id": "tbldTrKw4NsMY7Ix",
        "body": "={\n  \"fields\": {\n    \"feed_desc\": \"{{ $json.rss.channel.title }}\",\n    \"feed_url\": {\n      \"link\": \"{{ $('AI Agent 提取订阅链接').item.json.output }}\",\n      \"text\": \"{{ $('AI Agent 提取订阅链接').item.json.output }}\"\n    }\n  }\n}"
      },
      "type": "n8n-nodes-feishu-lite.feishuNode",
      "typeVersion": 1,
      "position": [
        -940,
        280
      ],
      "id": "2e265b22-9e2d-4312-8d2d-962a96b99ee1",
      "name": "新增订阅",
      "credentials": {
        "feishuCredentialsApi": {
          "id": "fxgtoinLSXcxpC2i",
          "name": "CloudysFeishu Credentials"
        }
      }
    },
    {
      "parameters": {
        "url": "={{ $json.output }}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        -1380,
        280
      ],
      "id": "80544b7d-e0b0-4638-8f94-c70419171c3f",
      "name": "获取 RSS 订阅信息"
    },
    {
      "parameters": {
        "dataPropertyName": "=data",
        "options": {}
      },
      "type": "n8n-nodes-base.xml",
      "typeVersion": 1,
      "position": [
        -1160,
        280
      ],
      "id": "a34785d4-0113-410a-9825-80f069f801a2",
      "name": "抽取 RSS 信息"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=你是一个专业的内容提取助手，我会给一份文本跟你，你的任务就是提取出文本中的 url 链接。然后以字符串的形式返回 url 链接给我。\n\n请提取文本： {{ $json.body.event.message.content }}",
        "hasOutputParser": true,
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2,
      "position": [
        -1740,
        280
      ],
      "id": "f690bdbb-d980-43e6-862d-a0f8b3bbc30d",
      "name": "AI Agent 提取订阅链接",
      "alwaysOutputData": true
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "message:send",
        "receive_id_type": "chat_id",
        "receive_id": "={{ $('Feishu Webhook').item.json.body.event.message.chat_id }}",
        "content": "={\n  \"text\": \"新增订阅成功: {{ $('AI Agent 提取订阅链接').item.json.output }}\"\n}"
      },
      "type": "n8n-nodes-feishu-lite.feishuNode",
      "typeVersion": 1,
      "position": [
        -720,
        280
      ],
      "id": "902cf65d-d202-4922-8379-da7193727258",
      "name": "订阅成功通知",
      "credentials": {
        "feishuCredentialsApi": {
          "id": "fxgtoinLSXcxpC2i",
          "name": "CloudysFeishu Credentials"
        }
      }
    }
  ],
  "pinData": {
    "Feishu Webhook": [
      {
        "json": {
          "headers": {
            "host": "127.0.0.1",
            "origin": "http://127.0.0.1",
            "x-real-ip": "182.92.128.190",
            "x-forwarded-for": "101.126.59.9, 182.92.128.190",
            "remote-host": "182.92.128.190",
            "connection": "close",
            "content-length": "740",
            "x-forwarded-proto": "https",
            "user-agent": "Go-http-client/1.1",
            "content-type": "application/json;charset=utf-8",
            "unit": "eu_nc",
            "x-lark-request-nonce": "950646929",
            "x-lark-request-timestamp": "1752346850",
            "x-lark-signature": "885f3a96d196cb195ac9fc69c0fae353dd78ffc2b9cb13c0ecfbee52b4a8f47b",
            "x-request-id": "55099ec9-214b-4276-ae4e-0500a75ef83c",
            "accept-encoding": "gzip"
          },
          "params": {},
          "query": {},
          "body": {
            "schema": "2.0",
            "header": {
              "event_id": "1290b470b9fa072e63f8f374da25caca",
              "token": "dFv0WkYeYKF7J4MK1c5tIeETHH6HZ34j",
              "create_time": "1752346850837",
              "event_type": "im.message.receive_v1",
              "tenant_key": "13d149c56acf5740",
              "app_id": "cli_a8f89f0647789013"
            },
            "event": {
              "message": {
                "chat_id": "oc_b4cf4d73e02ea650e86c4d2122ce1ec0",
                "chat_type": "p2p",
                "content": "{\"text\":\"订阅他[看]  https://supertechfans.com/cn/index.xml\"}",
                "create_time": "1752346850599",
                "message_id": "om_x100b481f40ebf8a80e3b6f49fa1a785",
                "message_type": "text",
                "update_time": "1752346850599"
              },
              "sender": {
                "sender_id": {
                  "open_id": "ou_ec81f38d6e7fdce6132f4605f7a37319",
                  "union_id": "on_9d281063b0791d2e40548e25ce854886",
                  "user_id": null
                },
                "sender_type": "user",
                "tenant_key": "13d149c56acf5740"
              }
            }
          },
          "webhookUrl": "https://n8n.shan333.cn/webhook/3cc586a2-4c62-47d4-8fd3-e371bde98ba7",
          "executionMode": "production"
        }
      }
    ]
  },
  "connections": {
    "Feishu Webhook": {
      "main": [
        [
          {
            "node": "Feishu webhook challenge",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Feishu webhook challenge": {
      "main": [
        [
          {
            "node": "AI Agent 提取订阅链接",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent 提取订阅链接",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "获取 RSS 订阅信息": {
      "main": [
        [
          {
            "node": "抽取 RSS 信息",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "抽取 RSS 信息": {
      "main": [
        [
          {
            "node": "新增订阅",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent 提取订阅链接": {
      "main": [
        [
          {
            "node": "获取 RSS 订阅信息",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "新增订阅": {
      "main": [
        [
          {
            "node": "订阅成功通知",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "9d4b7ea7-41ca-47cb-876e-321e6998f537",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "94953bffe8f887682af364b4ae4017e69e8558d5f6945655f253530415354041"
  },
  "id": "BPSFxXw7xiCf46yc",
  "tags": []
}
```

{% endfolding %}


#### 工作流使用注意

1. n8n 官方自带的节点不支持操作飞书的数据, 部署完成后需要先到 `Settings -> community-nodes` 安装社区的插件: [n8n-nodes-feishu-lite](https://community.n8n.io/t/custom-feishu-node/78169).
2. 要操作飞书的多维表格需要申请飞书的[开发者应用](https://open.feishu.cn/app), 给改应用分配对应的操作权限, 流程可以参考: [飞书服务端 API 调用流程概述](https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/overview) 去获取 n8n-nodes-feishu-lite 插件使用的调用凭证 (Credentials).
3. 飞书应用需要开通“机器人能力”, 并分配多维表的数据记录创建、读取权限. 
4. 被工作流操作的飞书多维表, 需要添加新创建的应用作为“文档应用”, 并赋予可以编辑的权限. 
5. 飞书应用管理后台添加 n8n Webhook 回调地址, 以便能处理飞书发送给应用机器人的消息. 

![bitable-acls](https://ospy.shan333.cn/blog/n8n_blog_post/bitable-acls.png)

![add-feishu-app-to-bitable](https://ospy.shan333.cn/blog/n8n_blog_post/add-feishu-app-to-bitable.png)

![add-webhook-to-feishu.png](https://ospy.shan333.cn/blog/n8n_blog_post/add-webhook-to-feishu.png)

接下来看看“基于 AI 大模型 的 RSS 文章信息获取、整理提炼和推送工作流程. 

### 基于 AI 大模型 的 RSS 文章信息获取、整理和推送工作流

RSS Feed 的订阅处理完成了. 下图的工作流主要用于定时从我们的飞书多维表格中获取订阅的 RSS Feed 链接. 然后逐一读取每一条订阅链接, 获取其最近 3 天发布的新文章内容, 通过 AI 大模型获取文章内容, 整理提炼后, 发送到即时消息软件（TG、飞书）群组内, 发送成功后会将已经发送过的链接记录到多维表中, 便于在发送前判断是否已经处理过这个新链接. 

![rss-summary-workflow.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-summary-workflow.png)

这个工作流会定时每小时执行一次, 获取 RSS 源新发布的信息, AI 整理提炼后发送到 TG 的效果与 AI 阅读提炼记录多维表结构如下：

{% gallery::::one %}
![tg-ai-filter-info.png](https://ospy.shan333.cn/blog/n8n_blog_post/tg-ai-filter-info.png)
![bitable-ai-read-history.png](https://ospy.shan333.cn/blog/n8n_blog_post/bitable-ai-read-history.png)
{% endgallery %}

左图为定时发送到 TG 的 AI 提炼信息，右图为发送记录的飞书多维表。

#### 工作流使用注意

1. 确保飞书节点使用的凭证已经在处理 **RSS 链接的订阅处理工作流** 时配置好, 权限要对；
2. TG 的通知节点使用到了 bot, 在 TG 可以向 [https://t.me/BotFather](https://t.me/BotFather) 申请创建机器人, 在频道或群组发消息需要有对应的权限. 

#### 编排文件分享

这里我们直接给出 n8n json 格式的工作流, 你可以直接复制粘贴到 n8n 的编排面板, 编排调试使用它：

{% folding 点击我查看 %}

```json
{
  "name": "飞书多维表 & RSS 智能总结",
  "nodes": [
    {
      "parameters": {
        "resource": "bitable",
        "operation": "bitable:table:record:search",
        "app_toke": "EEqtbliicaf3qRsgGPFcAxUtn1c",
        "table_id": "tbldTrKw4NsMY7Ix",
        "body": "={\n  \"field_names\": [\n    \"feed_url\",\n    \"feed_desc\"\n  ],\n  \"filter\": {\n    \"conjunction\": \"and\",\n    \"conditions\": []\n  }\n}"
      },
      "type": "n8n-nodes-feishu-lite.feishuNode",
      "typeVersion": 1,
      "position": [
        260,
        770
      ],
      "id": "dca798dd-51ec-41c5-8691-20f7868ea9d0",
      "name": "读取多维表记录，获取 RSS 订阅列表",
      "credentials": {
        "feishuCredentialsApi": {
          "id": "9zcGg2DbgzaOg0HP",
          "name": "Feishu Credentials n8n"
        }
      }
    },
    {
      "parameters": {
        "batchSize": "={{ 1 }}",
        "options": {}
      },
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 3,
      "position": [
        700,
        770
      ],
      "id": "d7cf0429-fb00-4a18-b2c6-3733a32b24f6",
      "name": "Loop Over Items1",
      "alwaysOutputData": true,
      "retryOnFail": false,
      "waitBetweenTries": 5000,
      "onError": "continueRegularOutput"
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "qwen3-235b-a22b",
          "mode": "list",
          "cachedResultName": "qwen3-235b-a22b"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        2020,
        740
      ],
      "id": "5f53e2c8-29d5-4a46-8e30-3bcec7c0563a",
      "name": "OpenAI Chat Model",
      "credentials": {
        "openAiApi": {
          "id": "7Eg9oNn5wpKXU7FP",
          "name": "Alibaba Qwen"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "return $input.first().json.data.items;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        480,
        770
      ],
      "id": "77cb1f74-a1fb-4f6c-97f9-c2dd04da8379",
      "name": "提取所有订阅链接"
    },
    {
      "parameters": {
        "url": "={{ $json.fields.feed_url.link }}",
        "options": {}
      },
      "type": "n8n-nodes-base.rssFeedRead",
      "typeVersion": 1.2,
      "position": [
        920,
        520
      ],
      "id": "959e31f1-7d9d-4018-9b9d-a27154c69aac",
      "name": "获取 RSS 订阅发布的文章",
      "notesInFlow": true,
      "retryOnFail": true,
      "waitBetweenTries": 5000,
      "onError": "continueRegularOutput",
      "notes": "如何判断是否有最新的 RSS Feed"
    },
    {
      "parameters": {
        "resource": "bitable",
        "operation": "bitable:table:record:search",
        "app_toke": "EEqtbliicaf3qRsgGPFcAxUtn1c",
        "table_id": "tbln3Bh6A6CTtuzv",
        "body": "={\n  \"filter\": {\n    \"conjunction\": \"and\",\n    \"conditions\": []\n  }\n}"
      },
      "type": "n8n-nodes-feishu-lite.feishuNode",
      "typeVersion": 1,
      "position": [
        1360,
        520
      ],
      "id": "7667ee26-4686-4854-9489-924668af2e14",
      "name": "查询已经整理过的 RSS 文章",
      "credentials": {
        "feishuCredentialsApi": {
          "id": "9zcGg2DbgzaOg0HP",
          "name": "Feishu Credentials n8n"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "\n// 默认认为第一篇即最新的一篇文章\nreturn {\n  \"feed_link\": $input.first().json.link,\n  \"title\": $input.first().json.title,\n  \"pub_date\": new Date($input.first().json.pubDate).getTime()\n};"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1140,
        520
      ],
      "id": "deed99e9-0a50-4a90-8013-12856c546116",
      "name": "获取最新发布的文章"
    },
    {
      "parameters": {
        "jsCode": "let urls = $input.first().json.data.items.map(item => item.fields.url.link)\n\nreturn [\n  {\n    json: {\n      sent_urs: urls,\n      send_url: $('获取最新发布的文章').first().json.feed_link,\n      title: $('获取最新发布的文章').first().json.title,\n      pub_date: $('获取最新发布的文章').first().json.pub_date\n    }\n  }\n];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1580,
        520
      ],
      "id": "2b6078c2-95b9-491e-87c6-b79da64c657d",
      "name": "聚合代发送信息和已发送信息"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "c931be49-c9c9-42e8-a97a-2758e06cb519",
              "leftValue": "={{ $json.pub_date }}",
              "rightValue": "={{ Date.now() - 3 * 24 * 60 * 60 * 1000 }}",
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            },
            {
              "id": "2e58720d-c671-4eda-b1b4-968556db1bc2",
              "leftValue": "={{ $json.sent_urs }}",
              "rightValue": "={{ $json.send_url }}",
              "operator": {
                "type": "array",
                "operation": "notContains",
                "rightType": "any"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        1800,
        520
      ],
      "id": "7957932e-bc1a-4d2a-8c10-888452d45371",
      "name": "过滤最近 3 天发布 & 并且没有整理过的文章"
    },
    {
      "parameters": {
        "chatId": "-1002056221907",
        "text": "=<strong>{{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.title }}</strong>\n\n{{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.send_url }}\n\nSummary:\n\n{{ $json.output }}",
        "additionalFields": {
          "parse_mode": "HTML"
        }
      },
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.2,
      "position": [
        2460,
        520
      ],
      "id": "196939c8-5d46-4a03-9a86-95f755ff34ea",
      "name": "发送最新文章到 TG 频道",
      "webhookId": "ea5f5231-946a-4847-ab40-73caeba82e38",
      "credentials": {
        "telegramApi": {
          "id": "ryEUflPWvRynMmig",
          "name": "Telegram account"
        }
      }
    },
    {
      "parameters": {
        "sseEndpoint": "https://mcp.api-inference.modelscope.net/521f5eb00f1d4d/sse"
      },
      "type": "@n8n/n8n-nodes-langchain.mcpClientTool",
      "typeVersion": 1,
      "position": [
        2260,
        740
      ],
      "id": "3ed34103-cb9f-4edf-9ab8-0fb96535ba5b",
      "name": "fetch tool"
    },
    {
      "parameters": {
        "resource": "bitable",
        "operation": "bitable:table:record:add",
        "app_toke": "EEqtbliicaf3qRsgGPFcAxUtn1c",
        "table_id": "tbln3Bh6A6CTtuzv",
        "body": "={\n  \"fields\": {\n    \"title\": \"{{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.title }}\",\n    \"url\": {\n      \"link\": \"{{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.send_url }}\",\n      \"text\": \"{{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.send_url }}\"\n    },\n    \"pubDate\": {{ $('过滤最近 3 天发布 & 并且没有整理过的文章').item.json.pub_date }}\n  }\n}"
      },
      "type": "n8n-nodes-feishu-lite.feishuNode",
      "typeVersion": 1,
      "position": [
        2680,
        640
      ],
      "id": "42d2aca4-5570-4c3e-96d8-79b4d731f5eb",
      "name": "记录文章已经被整理",
      "credentials": {
        "feishuCredentialsApi": {
          "id": "9zcGg2DbgzaOg0HP",
          "name": "Feishu Credentials n8n"
        }
      }
    },
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [
        40,
        780
      ],
      "id": "1533c646-66e2-4db5-a33b-20e0a25f5969",
      "name": "Schedule Trigger"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=要提炼的 url 如下：\n\n{{ $json.send_url }}\n",
        "options": {
          "systemMessage": "你是一个专业的内容总结助手，可以根据我提供给的 url 使用 fetch 工具获取 url 的网页内容，然后提炼出要点精华，并且要保证内容完整，不丢失文章信息。语言务必使用中文。最后输出的文本格式为 Telegram 支持的 HTML 格式，不要出现不支持的 HTML 标签。\n\n要求：使用 fetch 工具获取的网页内容要完整。最终总结输出格式不能出现 Telegram 不支持的 HTML 标签。\n\n在总结文章时，请遵循以下指南：\n1. 通读全文，理解文章的主旨和核心观点。\n2. 找出文章中的关键信息，如主要事件、重要数据、核心论点等。\n3. 用简洁明了的语言将关键信息组织起来，形成一篇连贯的总结。\n4. 避免包含文章中的细节和例子，除非它们对理解核心观点至关重要。\n5. 确保总结涵盖了文章的所有重要方面，不遗漏关键信息。\n\nTelegram 支持的 HTML 标签如下：\n<b>bold</b>, <strong>bold</strong>\n<i>italic</i>, <em>italic</em>\n<u>underline</u>, <ins>underline</ins>\n<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>\n<span class=\"tg-spoiler\">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>\n<b>bold <i>italic bold <s>italic bold strikethrough <span class=\"tg-spoiler\">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>\n<a href=\"http://www.example.com/\">inline URL</a>\n<a href=\"tg://user?id=123456789\">inline mention of a user</a>\n<tg-emoji emoji-id=\"5368324170671202286\">👍</tg-emoji>\n<code>inline fixed-width code</code>\n<pre>pre-formatted fixed-width code block</pre>\n<pre><code class=\"language-python\">pre-formatted fixed-width code block written in the Python programming language</code></pre>\n<blockquote>Block quotation started\\nBlock quotation continued\\nThe last line of the block quotation</blockquote>\n<blockquote expandable>Expandable block quotation started\\nExpandable block quotation continued\\nExpandable block quotation continued\\nHidden by default part of the block quotation started\\nExpandable block quotation continued\\nThe last line of the block quotation</blockquote>\n\n严禁是使用 HTML 标签: <ul>、<li>、<br>、<p>"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2,
      "position": [
        2060,
        520
      ],
      "id": "99c120dd-baec-469d-8315-709488188464",
      "name": "Summary AI Agent",
      "onError": "continueRegularOutput"
    }
  ],
  "pinData": {
    "Schedule Trigger": [
      {
        "json": {
          "timestamp": "2025-07-06T11:00:58.007-04:00",
          "Readable date": "July 6th 2025, 11:00:58 am",
          "Readable time": "11:00:58 am",
          "Day of week": "Sunday",
          "Year": "2025",
          "Month": "July",
          "Day of month": "06",
          "Hour": "11",
          "Minute": "00",
          "Second": "58",
          "Timezone": "America/New_York (UTC-04:00)"
        }
      }
    ]
  },
  "connections": {
    "Loop Over Items1": {
      "main": [
        [],
        [
          {
            "node": "获取 RSS 订阅发布的文章",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Summary AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "读取多维表记录，获取 RSS 订阅列表": {
      "main": [
        [
          {
            "node": "提取所有订阅链接",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "提取所有订阅链接": {
      "main": [
        [
          {
            "node": "Loop Over Items1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "获取 RSS 订阅发布的文章": {
      "main": [
        [
          {
            "node": "获取最新发布的文章",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "查询已经整理过的 RSS 文章": {
      "main": [
        [
          {
            "node": "聚合代发送信息和已发送信息",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "获取最新发布的文章": {
      "main": [
        [
          {
            "node": "查询已经整理过的 RSS 文章",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "聚合代发送信息和已发送信息": {
      "main": [
        [
          {
            "node": "过滤最近 3 天发布 & 并且没有整理过的文章",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "过滤最近 3 天发布 & 并且没有整理过的文章": {
      "main": [
        [
          {
            "node": "Summary AI Agent",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Loop Over Items1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "发送最新文章到 TG 频道": {
      "main": [
        [
          {
            "node": "记录文章已经被整理",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "fetch tool": {
      "ai_tool": [
        [
          {
            "node": "Summary AI Agent",
            "type": "ai_tool",
            "index": 0
          }
        ]
      ]
    },
    "记录文章已经被整理": {
      "main": [
        [
          {
            "node": "Loop Over Items1",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "读取多维表记录，获取 RSS 订阅列表",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Summary AI Agent": {
      "main": [
        [
          {
            "node": "发送最新文章到 TG 频道",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "bcb9ad0a-6964-473c-9b5e-c1d03e2fb850",
  "meta": {
    "templateId": "self-building-ai-agent",
    "templateCredsSetupCompleted": true,
    "instanceId": "1c9ed367917141e075921fdbc6cbe734bce9dde165b1e3a672c9dd236366be6c"
  },
  "id": "Sz06Yz8CTSIkC0ji",
  "tags": []
}
```

{% endfolding %}

## 结语

好啦~, 本次分享暂时结束 ღ( ´･ᴗ･` ), 期望看到的小伙伴能玩得更花. 舒服~, 对于性能不敏感的场景, 搞下 n8n 也不错滴. 