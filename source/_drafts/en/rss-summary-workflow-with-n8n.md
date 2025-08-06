---
title: Building Your Own RSS Feed Subscription Management & AI Large Model Reading Workflow with n8n and Feishu Multi-dimensional Tables
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "AI, N8N, n8n, Feishu, Multi-dimensional Tables, RSS"
cover: https://ospy.shan333.cn/blog/n8n_blog_post/banner.jpg
description: "Building Your Own RSS Feed Subscription Management & AI Large Model Reading Workflow with n8n and Feishu Multi-dimensional Tables"
date: 2025-07-12 23:52:37
updated: 2025-07-13 15:52:37
tags: ["AI", "n8n", "Feishu Multi-dimensional Tables", "RSS"]
categories: ["AI"]
---

2025 is the year of explosive growth in AI applications. Recently, both in and outside of work, I've been using some visual low-code platforms to experiment with AI-based workflows. After trying several products like coze, dify, and n8n, [n8n](https://n8n.io/)'s single-step debugging experience and powerful third-party plugins really impressed me. Moreover, it can be self-deployed and is open-source (with a very high star count of 100k+, which also means the community is strong and problem-solving should be convenient). The open-source self-deployed version doesn't have too many features cut compared to the enterprise version, making it perfect for use with my newly acquired Volcengine ECS 4C8G server.

Back in April and May 2024, I built an application using [Elixir](https://elixir-lang.org/) for periodically tracking and using AI to summarize the latest articles from my RSS subscriptions, then pushing the summaries to my personal Telegram channel (I call it **rss_generic_i18n_bot**). AI can effectively consolidate blogs/podcasts in various languages (Chinese, English, Japanese, etc.) that I subscribe to into concise Chinese, making them easier to digest. My native language is still easier for absorbing information compared to other languages. I've been using this application until now. Since the code was mostly written by myself, there are still quite a few bugs remaining o(╯□╰)o, patching them up~:

![rssbot-bug-track.jpg](https://ospy.shan333.cn/blog/n8n_blog_post/rssbot-bug-track.jpg)

> Elixir's ecosystem is hard to describe~When I started operating, there weren't many good AI foundation libraries available.

> Some friends might wonder why I don't use powerful software like [Folo](https://github.com/RSSNext/Folo) or Inoreader that can conveniently process RSS information sources. The reason is that I want to minimize opening additional software and still easily extract the information I want. So I send the processed information to instant messaging software groups like Telegram and DingTalk that I frequently open. The message display capabilities of current IM software are also quite good, and the search functionality is basically sufficient, so I don't need to build a lot of features myself.

Recently, I used n8n to orchestrate a workflow to replace my previous backend application **rss_generic_i18n_bot**. So I'm writing this article to document the process, which can also serve as a reference for friends using n8n to build workflows.

## Deploying n8n with Docker

The first step is obviously to deploy the n8n visual workflow orchestration platform. Here's the docker-compose orchestration file I'm using, with the image sourced from [m.daocloud.io](m.daocloud.io) (since Dockerhub is no longer accessible domestically, we need "special techniques"), and the speed is acceptable:

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
# You can directly start using docker-compose
docker-compose up -d
```

I deployed it on Volcengine's ECS server, with the deployment architecture as shown in the figure below:

![n8n-deployment.png](https://ospy.shan333.cn/blog/n8n_blog_post/n8n-deployment.png)

I put a reverse proxy in front of the n8n container, which is convenient for us to mount SSL/TLS certificates and add a firewall to monitor our traffic information.

> Note that n8n enables origin validation. The reverse proxy server can fix the n8n Allow allowed Origin with `proxy_set_header Origin http://127.0.0.1` to avoid frequently encountering WebSocket [Connection Lost](https://community.n8n.io/t/connection-lost-you-have-a-connection-issue-or-the-server-is-down-n8n-should-reconnect-automatically-once-the-issue-is-resolved/80999) issues that prevent saving workflows in the n8n editing panel.

If you don't have a cloud server, you can also refer to this article [《Cursor一键生成n8n工作流+永久免费「n8n云部署」白嫖与效率齐飞~》](https://mp.weixin.qq.com/s/E-WI4fY8cRzFN991_iDTIw) to deploy n8n overseas using Claw Cloud. You only need to register with GitHub, and if your GitHub account has been registered for more than 180 days, you can get $5 monthly credits. It's basically sufficient. You could say it's free to use Claw Cloud to deploy n8n. I use this deployment method for some workflows that need to access overseas services (like Google Sheet). Deployment is convenient, and Claw Cloud's built-in App Store marketplace has quick deployment templates.

After deployment is complete, you can enter the management page to orchestrate our workflows. Next, I'll introduce how to use n8n and Feishu multi-dimensional tables to build your own RSS subscription and AI reading workflow.

## Workflow Design

Friends who frequently use RSS to manage their information sources may know that subscribing to RSS Feed links and reading RSS source articles are the two main high-frequency actions. So I mainly split these into two workflows to complete these tasks separately: **RSS link subscription processing workflow** and **AI large model-based RSS article information acquisition, organization, and push workflow**.

### RSS Link Subscription Processing Workflow

The RSS link subscription processing workflow is mainly responsible for receiving messages containing "RSS Feed subscription links" sent from instant messaging software like Feishu through n8n's Webhook, storing the RSS Feed subscription links in Feishu's multi-dimensional tables. As shown in the figure below:

![rss-feed-workflow.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-feed-workflow.png)

- Webhook will listen to messages we send to the Feishu robot, triggering the execution of the entire process;
- AI Agent node can process messages containing RSS Feed links in any format that we send to the Feishu robot, automatically extracting subscription links for subsequent nodes to extract RSS subscription source information and store it in Feishu multi-dimensional tables;
- Feishu multi-dimensional tables: As a database, to persistently store all our subscription links for use by another workflow.

The effect of managing subscription links in Feishu is shown in the figure below, operating the multi-dimensional table as follows:

![add-rss-feed-with-bot.jpg](https://ospy.shan333.cn/blog/n8n_blog_post/add-rss-feed-with-bot.jpg)
![rss-feed-bitable.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-feed-bitable.png)

The left image shows us directly chatting with the application robot in the Feishu robot chat window, triggering the RSS subscription management workflow. After triggering is complete, you can directly see the corresponding subscription records in the multi-dimensional table in the right image.

#### Workflow Orchestration File Sharing

Here we directly provide the n8n json format workflow, which you can directly copy and paste into n8n's orchestration panel to use it:

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
        "text": "=You are a professional content extraction assistant. I will give you a text, and your task is to extract the URL link from the text. Then return the URL link to me as a string.\n\nPlease extract the text: {{ $json.body.event.message.content }}",
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

#### Workflow Usage Notes

1. n8n's official built-in nodes do not support operating Feishu data. After deployment, you need to first go to `Settings -> community-nodes` to install the community plugin: [n8n-nodes-feishu-lite](https://community.n8n.io/t/custom-feishu-node/78169).
2. To operate Feishu multi-dimensional tables, you need to apply for Feishu's [developer application](https://open.feishu.cn/app), allocate corresponding operation permissions to the application. The process can refer to: [Feishu Server API Call Process Overview](https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/overview) to obtain the credentials used by the n8n-nodes-feishu-lite plugin.
3. The Feishu application needs to enable "robot capabilities" and allocate data record creation and reading permissions for multi-dimensional tables.
4. The Feishu multi-dimensional table operated by the workflow needs to add the newly created application as a "document application" and grant editable permissions.
5. Add the n8n Webhook callback address in the Feishu application management backend to enable processing of messages sent to the application robot by Feishu.

![bitable-acls](https://ospy.shan333.cn/blog/n8n_blog_post/bitable-acls.png)

![add-feishu-app-to-bitable](https://ospy.shan333.cn/blog/n8n_blog_post/add-feishu-app-to-bitable.png)

![add-webhook-to-feishu.png](https://ospy.shan333.cn/blog/n8n_blog_post/add-webhook-to-feishu.png)

Next, let's look at the "AI large model-based RSS article information acquisition, organization, and push workflow."

### AI Large Model-Based RSS Article Information Acquisition, Organization, and Push Workflow

The RSS Feed subscription processing is complete. The workflow shown in the figure below is mainly used to periodically obtain subscribed RSS Feed links from our Feishu multi-dimensional tables. Then it reads each subscription link one by one, obtains the newly published articles in the last 3 days, uses the AI large model to acquire the article content, organizes and refines it, and sends it to instant messaging software (Telegram, Feishu) groups. After successful sending, it will record the sent links to the multi-dimensional table, which is convenient for determining whether this new link has already been processed before sending.

![rss-summary-workflow.png](https://ospy.shan333.cn/blog/n8n_blog_post/rss-summary-workflow.png)

This workflow will execute once every hour, obtaining newly published information from RSS sources. After AI organization and refinement, it will be sent to Telegram. The effect and AI reading refinement record multi-dimensional table structure are as follows:

![tg-ai-filter-info.png](https://ospy.shan333.cn/blog/n8n_blog_post/tg-ai-filter-info.png)
![bitable-ai-read-history.png](https://ospy.shan333.cn/blog/n8n_blog_post/bitable-ai-read-history.png)

The left image shows the AI-refined information sent to Telegram at regular intervals, and the right image shows the Feishu multi-dimensional table for sending records.

#### Workflow Usage Notes

1. Ensure that the credentials used by the Feishu node have been configured during the processing of the **RSS link subscription processing workflow** and that permissions are correct;
2. The TG notification node uses a bot, which can be applied for and created by [https://t.me/BotFather](https://t.me/BotFather) in Telegram. Sending messages in channels or groups requires corresponding permissions.

#### Orchestration File Sharing

Here we directly provide the n8n json format workflow, which you can directly copy and paste into n8n's orchestration panel for orchestration and debugging:


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
        "text": "=The URL to be refined is as follows:\n\n{{ $json.send_url }}\n",
        "options": {
          "systemMessage": "You are a professional content summary assistant. You can use the fetch tool to obtain the web page content of the URL I provide, and then extract the key points and essence, ensuring the content is complete and no article information is lost. The language must be Chinese. The final output text format should be HTML format supported by Telegram, without unsupported HTML tags.\n\nRequirements: The web page content obtained using the fetch tool must be complete. The final summary output format must not contain HTML tags not supported by Telegram.\n\nWhen summarizing articles, please follow these guidelines:\n1. Read the entire article to understand the main idea and core points.\n2. Identify key information in the article, such as major events, important data, core arguments, etc.\n3. Organize the key information using concise and clear language to form a coherent summary.\n4. Avoid including details and examples from the article unless they are crucial to understanding the core points.\n5. Ensure the summary covers all important aspects of the article without missing key information.\n\nTelegram-supported HTML tags are as follows:\n<b>bold</b>, <strong>bold</strong>\n<i>italic</i>, <em>italic</em>\n<u>underline</u>, <ins>underline</ins>\n<s>strikethrough</s>, <strike>strikethrough</strike>, <del>strikethrough</del>\n<span class=\"tg-spoiler\">spoiler</span>, <tg-spoiler>spoiler</tg-spoiler>\n<b>bold <i>italic bold <s>italic bold strikethrough <span class=\"tg-spoiler\">italic bold strikethrough spoiler</span></s> <u>underline italic bold</u></i> bold</b>\n<a href=\"http://www.example.com/\">inline URL</a>\n<a href=\"tg://user?id=123456789\">inline mention of a user</a>\n<tg-emoji emoji-id=\"5368324170671202286\">👍</tg-emoji>\n<code>inline fixed-width code</code>\n<pre>pre-formatted fixed-width code block</pre>\n<pre><code class=\"language-python\">pre-formatted fixed-width code block written in the Python programming language</code></pre>\n<blockquote>Block quotation started\\nBlock quotation continued\\nThe last line of the block quotation</blockquote>\n<blockquote expandable>Expandable block quotation started\\nExpandable block quotation continued\\nExpandable block quotation continued\\nHidden by default part of the block quotation started\\nExpandable block quotation continued\\nThe last line of the block quotation</blockquote>\n\nStrictly prohibited HTML tags: <ul>, <li>, <br>, <p>"
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


## Conclusion

Alright~, this sharing session ends here ღ( ´･ᴗ･` ). I hope friends who see this can have more fun with it. Comfortable~, for scenarios that are not performance-sensitive, using n8n is not bad.
