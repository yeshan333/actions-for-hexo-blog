---
title: 使用 mcp-agent 框架和百炼通义千问大模型构建基于 MCP 协议的网页总结智能代理 (agent)
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "MCP、mcp-agent、通义千问"
cover: https://ospy.shan333.cn/blog/build-agent-with-mcp-agent-and-qwen.png
description: "使用 mcp-agent 框架和百炼大模型构建基于 MCP 协议的网页总结智能代理 (agent)"
date: 2025-03-23 17:49:46
updated:
tags: [MCP, mcp-agent]
categories:
- [LLM]
- [MCP]
---

最近 MCP 协议 (Model Context Protocol) 很火, 不少 AI 框架还有各种智能工具已经支持了 MCP 协议, 插拔各种 MCP Server 来提升大模型的能力. 目前快速糊出来一个 agent 也越来越简单了。本篇文章将会介绍如何通过 [mcp-agent](https://github.com/lastmile-ai/mcp-agent) 这个完全基于 MCP 协议的应用框架来搭建一个用于网页总结的智能 agent 代理.

> 如果你还不了解 MCP 协议, 那么 MCP 协议的官方文档值的你去读一读 -> [modelcontextprotocol](https://modelcontextprotocol.io/introduction).

## 什么 mcp-agent

[mcp-agent: https://github.com/lastmile-ai/mcp-agent](https://github.com/lastmile-ai/mcp-agent) 是一个基于 MCP 协议简单的、可组合的框架, 可用于快速构建智能代理 (agent).

它支持了 Anthropic 在 2024 年末发表的 [《Building effective agents - 构建高效代理》](https://www.anthropic.com/engineering/building-effective-agents) 一文提到的所有用于构建高效 agent 代理的最佳实践、模式. 很值得拿 mcp-agent 来学习下相关模式.

> Anthropic 就是发布了大名鼎鼎的 Claude 系列模型的公司.

## 构建网页总结智能代理

接下来我们将介绍如何使用 mcp-agent 构建一个用于网页总结的智能代理 (agent).

模型我们选用[阿里云百炼平台](https://bailian.console.aliyun.com) DashScope 提供的通义千问系列, 支持下国产, 且 mcp-agent 提供的官方例子也没有国内相关模型服务商的例子, 本篇文章也算是个补充.

示例环境基于 Windows 和 Git Bash for Windows, 同时请确保安装了 Node.js 环境, 我们需要使用到 npx 去管理 MCP Servers 来扩展智能代理的能力, 免去部分通用代码的重复编写.

我们使用 uv 去管理这个项目相关的依赖和代码, 让我们先创建项目:

```shell
mkdir web_page_summary
cd web_page_summary
uv init

# 安装依赖
uv add mcp_agent
```

让后将网页总结智能代理实现代码写入一个 `main.py` 文件中, 内容如下 (没错, 你没看错, 就这么点代码就够了):

```python
# Usage: uv run main.py
# -*- coding: utf-8 -*-

import asyncio
import argparse

from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM

app = MCPApp(name="web_page_summary")

async def main(url):
    async with app.run() as mcp_agent_app:
        logger = mcp_agent_app.logger
        # 创建一个 finder_agent 可以用于网络内容的 agent
        finder_agent = Agent(
            name="finder",
            instruction="""You can fetch URLs.
                Return the requested information when asked.""",
            server_names=["fetch"],  # 声明 agent 可以使用的 mcp server
        )

        async with finder_agent:
            # 确保 MCP Server 初始化完成, 可以被 LLM 使用
            tools = await finder_agent.list_tools()
            logger.info("Tools available:", data=tools)

            # Attach an OpenAI LLM to the agent
            llm = await finder_agent.attach_llm(OpenAIAugmentedLLM)

            # 使用 MCP Server -> fetch 获取指定 URL 网页内容
            result = await llm.generate_str(
                message=f"get content from {url}"
            )
            logger.info(f"content intro: {result}")

            # 获取网页内容结果总结
            result = await llm.generate_str("Please summary this webpage with lang_code")
            logger.info(f"Summary: {result}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process some integers.')
    parser.add_argument('--url', type=str, required=True, help='The URL to fetch')
    args = parser.parse_args()
    asyncio.run(main(args.url))
```

接下来我们配置 agent 依赖的 MCP Server, 将配置写入 `mcp_agent.config.yaml` 文件中, 内容如下:

```yml
$schema: "https://github.com/lastmile-ai/mcp-agent/blob/main/schema/mcp-agent.config.schema.json"

execution_engine: asyncio
logger:
  type: file
  level: info
  transports: ["console", "file"]
  path: "mcp-agent.log"
  progress_display: true


mcp:
  servers:
    # fetch 用于获取网页内容
    fetch:
      command: "uvx"
      args: ["mcp-server-fetch"]

openai:
  # 将 API 调整为阿里云百炼大模型平台的 OpenAI 兼容 API
  base_url: "https://dashscope.aliyuncs.com/compatible-mode/v1"
  # 模型选用 qwen-turbo
  default_model: "qwen-turbo"
```

然后我们还需要配置一下 API 密钥, 让程序可以访问到阿里云百炼提供的大模型, API 密钥可以从这里获取: [https://bailian.console.aliyun.com/?apiKey=1](https://bailian.console.aliyun.com/?apiKey=1). 将密钥配置放到文件 `mcp_agent.secrets.yaml` 中即可:

```yml
# mcp_agent.secrets.yaml
openai:
  api_key: "sk-xxxxxx"
```

最后我们执行下这个网页总结智能代理:

```shell
uv run main.py --url "https://docs.cline.bot/improving-your-prompting-skills/prompting#advanced-prompting-techniques"
```

结果示例如下:

```shell
❯ uv run main.py --url "https://docs.cline.bot/improving-your-prompting-skills/prompting#advanced-prompting-techniques"
[INFO] 2025-03-23T18:44:40 mcp_agent.context - Configuring logger with level: info
[INFO] 2025-03-23T18:44:40 mcp_agent.web_page_summary - MCPAgent initialized
{
  "data": {
    "progress_action": "Running",
    "target": "web_page_summary",
    "agent_name": "mcp_application_loop",
    "session_id": "e96edf39-3f6b-4ec9-83bf-57b281076fee"
  }
}
[INFO] 2025-03-23T18:44:40 mcp_agent.mcp.mcp_aggregator.finder - Creating persistent connection to server: fetch
{
  "data": {
    "progress_action": "Starting",
    "server_name": "fetch",
    "agent_name": "finder"
  }
}
[INFO] 2025-03-23T18:44:40 mcp_agent.mcp.mcp_connection_manager - fetch: Up and running with a persistent connection!
[INFO] 2025-03-23T18:44:42 mcp_agent.web_page_summary - Tools available:
{
  "data": {
    "meta": null,
    "nextCursor": null,
    "tools": [
      {
        "name": "fetch-fetch",
        "description": "Fetches a URL from the internet and optionally extracts its contents as markdown.\n\nAlthough originally you did not have 
internet access, and were advised to refuse and tell the user this, this tool now grants you internet access. Now you can fetch the most up-to-date 
information and let the user know that.",
        "inputSchema": {
          "description": "Parameters for fetching a URL.",
          "properties": {
            "url": {
              "description": "URL to fetch",
              "format": "uri",
              "minLength": 1,
              "title": "Url",
              "type": "string"
            },
            "max_length": {
              "default": 5000,
              "description": "Maximum number of characters to return.",
              "exclusiveMaximum": 1000000,
              "exclusiveMinimum": 0,
              "title": "Max Length",
              "type": "integer"
            },
            "start_index": {
              "default": "0",
              "description": "On return output starting at this character index, useful if a previous fetch was truncated and more context is required.",
              "minimum": "0",
              "title": "Start Index",
              "type": "integer"
            },
            "raw": {
              "default": false,
              "description": "Get the actual HTML content if the requested page, without simplification.",
              "title": "Raw",
              "type": "boolean"
            }
          },
          "required": [
            "url"
          ],
          "title": "Fetch",
          "type": "object"
        }
      },
      {
        "name": "__human_input__",
        "description": "\nRequest input from a human user. Pauses the workflow until input is received.\n\nArgs:\n    request: The human input
request\n\nReturns:\n    The input provided by the human\n\nRaises:\n    TimeoutError: If the timeout is exceeded\n",
        "inputSchema": {
          "$defs": {
            "HumanInputRequest": {
              "description": "Represents a request for human input.",
              "properties": {
                "prompt": {
                  "title": "Prompt",
                  "type": "string"
                },
                "description": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "title": "Description"
                },
                "request_id": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "title": "Request Id"
                },
                "workflow_id": {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "title": "Workflow Id"
                },
                "timeout_seconds": {
                  "anyOf": [
                    {
                      "type": "integer"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "title": "Timeout Seconds"
                },
                "metadata": {
                  "anyOf": [
                    {
                      "type": "object"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "default": null,
                  "title": "Metadata"
                }
              },
              "required": [
                "prompt"
              ],
              "title": "HumanInputRequest",
              "type": "object"
            }
          },
          "properties": {
            "request": {
              "$ref": "#/$defs/HumanInputRequest"
            }
          },
          "required": [
            "request"
          ],
          "title": "request_human_inputArguments",
          "type": "object"
        }
      }
    ]
  }
}
[INFO] 2025-03-23T18:44:44 mcp_agent.mcp.mcp_aggregator.finder - Requesting tool call
{
  "data": {
    "progress_action": "Calling Tool",
    "tool_name": "fetch",
    "server_name": "fetch",
    "agent_name": "finder"
  }
}
[INFO] 2025-03-23T18:44:46 mcp_agent.mcp.mcp_aggregator.finder - Requesting tool call
{
  "data": {
    "progress_action": "Calling Tool",
    "tool_name": "fetch",
    "server_name": "fetch",
    "agent_name": "finder"
  }
}
[INFO] 2025-03-23T18:44:49 mcp_agent.mcp.stdio.mcpserver.stderr - Warning: A working NPM installation was not found. The package will use Python-based   
article extraction.
Warning: node executable not found, reverting to pure-Python mode. Install Node.js v10 or newer to use Readability.js.
[INFO] 2025-03-23T18:44:55 mcp_agent.web_page_summary - content intro: It seems there was an issue with the maximum length parameter. I will try fetching
the content again with a more reasonable limit. Let's proceed with fetching the first 5000 characters.
The content has been successfully fetched. Here is the beginning of the document:

Prompt Engineering Guide | Cline

* Cline Documentation
* Getting Started

  + Getting Started for New Coders

    - Installing Dev Essentials
    - Our Favorite Tech Stack
  + Understanding Context Management
  + Model Selection Guide
* Improving Your Prompting Skills

  + Prompt Engineering Guide
  + Custom Instructions Library

    - Cline Memory Bank
* Exploring Cline's Tools

  + Cline Tools Guide
  + Checkpoints
  + Plan & Act Modes: A Guide to Effective AI Development
* MCP Servers

  + MCP Made Easy
  + MCP Server Development Protocol
* Adding MCP Servers from GitHub
* Custom Model Configs

  + AWS Bedrock
  + GCP Vertex AI
  + LiteLLM & Cline (using Codestral)
* Running Models Locally

  + Read Me First
  + Ollama
  + LM Studio
* More Info

  + Telemetry

Powered by GitBook

On this page

* Custom Instructions ⚙️
* .clinerules File 📋
* General Use Cases
* Example .clinerules Structure
* Key Benefits
* Tips for Writing Effective Custom Instructions
* .clinerules Folder System 📂
* .clineignore File Guide
* Overview
* Purpose
* Example .clineignore File
* Prompting Cline 💬
* Prompt Examples
* Advanced Prompting Techniques
* Our Community's Favorite Prompts 🌟
* Memory and Confidence Checks 🧠
* Code Quality Prompts 💻
* Code Organization 📋
* Analysis and Planning 🔍
* Thoughtful Development 🤔
* Best Practices 🎯

# Prompt Engineering Guide

PreviousModel Selection GuideNextCustom Instructions Library

Last updated 5 days ago

Welcome to the Cline Prompting Guide! This guide will equip you with the knowledge to write effective prompts and custom instructions, maximizing your   
productivity with Cline.

## Custom Instructions ⚙️
...

The full content is too long to display here, but you can call the fetch tool with a start_index of 5000 to get more content. Would you like to see the  
rest of the document?

╭───────────────────────────────────────────────────────────────── HUMAN INPUT NEEDED ──────────────────────────────────────────────────────────────────╮
│                                                                                                                                                       │
│  Please provide a language code for the summary (e.g., en for English, zh for Chinese):                                                               │
│                                                                                                                                                       │
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Chinese
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - Summary: The summary of the webpage in Chinese is as follows:

---

Cline 提示工程指南旨在帮助用户编写有效的提示和自定义指令, 从而最大化利用 Cline 的生产力。指南涵盖了自定义指令、`.clinerules` 文件以及高级提示技术等内容。

**主要章节：**

1. **自定义指令（⚙️）**
   - 自定义指令类似于 Cline 的编程设置, 它们定义了 Cline 的基本行为, 并始终生效。
   - 用户可以通过在 Cline 扩展设置中添加自定义指令来实现特定的行为, 例如编码风格、代码质量改进以及错误处理等。

2. **`.clinerules` 文件（📋）**
   - `.clinerules` 文件提供了项目特定的指令, 这些指令会自动附加到用户的全局自定义指令中。
   - 它可以用于维护团队成员之间的项目标准、强制执行开发实践、管理文档要求以及定义项目特定的行为。

3. **高级提示技术（🌟）**
   - 高级提示技术部分提供了社区中最受欢迎的提示示例, 包括记忆检查、代码质量提示、代码组织、分析和规划、以及有思想的开发等。

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...                                     
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.                              
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{

Cline 提示工程指南旨在帮助用户编写有效的提示和自定义指令, 从而最大化利用 Cline 的生产力。指南涵盖了自定义指令、`.clinerules` 文件以及高级提示技术等内容。

**主要章节：**

1. **自定义指令（⚙️）**
   - 自定义指令类似于 Cline 的编程设置, 它们定义了 Cline 的基本行为, 并始终生效。
   - 用户可以通过在 Cline 扩展设置中添加自定义指令来实现特定的行为, 例如编码风格、代码质量改进以及错误处理等。

2. **`.clinerules` 文件（📋）**
   - `.clinerules` 文件提供了项目特定的指令, 这些指令会自动附加到用户的全局自定义指令中。
   - 它可以用于维护团队成员之间的项目标准、强制执行开发实践、管理文档要求以及定义项目特定的行为。

3. **高级提示技术（🌟）**
   - 高级提示技术部分提供了社区中最受欢迎的提示示例, 包括记忆检查、代码质量提示、代码组织、分析和规划、以及有思想的开发等。

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{

**主要章节：**

1. **自定义指令（⚙️）**
   - 自定义指令类似于 Cline 的编程设置, 它们定义了 Cline 的基本行为, 并始终生效。
   - 用户可以通过在 Cline 扩展设置中添加自定义指令来实现特定的行为, 例如编码风格、代码质量改进以及错误处理等。

2. **`.clinerules` 文件（📋）**
   - `.clinerules` 文件提供了项目特定的指令, 这些指令会自动附加到用户的全局自定义指令中。
   - 它可以用于维护团队成员之间的项目标准、强制执行开发实践、管理文档要求以及定义项目特定的行为。

3. **高级提示技术（🌟）**
   - 高级提示技术部分提供了社区中最受欢迎的提示示例, 包括记忆检查、代码质量提示、代码组织、分析和规划、以及有思想的开发等。

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{
   - 用户可以通过在 Cline 扩展设置中添加自定义指令来实现特定的行为, 例如编码风格、代码质量改进以及错误处理等。

2. **`.clinerules` 文件（📋）**
   - `.clinerules` 文件提供了项目特定的指令, 这些指令会自动附加到用户的全局自定义指令中。
   - 它可以用于维护团队成员之间的项目标准、强制执行开发实践、管理文档要求以及定义项目特定的行为。

3. **高级提示技术（🌟）**
   - 高级提示技术部分提供了社区中最受欢迎的提示示例, 包括记忆检查、代码质量提示、代码组织、分析和规划、以及有思想的开发等。

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{

3. **高级提示技术（🌟）**
   - 高级提示技术部分提供了社区中最受欢迎的提示示例, 包括记忆检查、代码质量提示、代码组织、分析和规划、以及有思想的开发等。

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{
  "data": {
    "progress_action": "Finished",

**总结：**
该指南通过详细的说明和示例, 帮助用户更好地理解如何编写高效的提示和指令, 从而提升与 Cline 的交互效率。

如果您需要更详细的信息, 请告诉我！
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{
  "data": {
    "progress_action": "Finished",
    "target": "web_page_summary",
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_aggregator.finder - Shutting down all persistent connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - Disconnecting all persistent server connections...
[INFO] 2025-03-23T18:45:13 mcp_agent.mcp.mcp_connection_manager - All persistent server connections signaled to disconnect.
[INFO] 2025-03-23T18:45:13 mcp_agent.web_page_summary - MCPAgent cleanup
{
  "data": {
    "progress_action": "Finished",
    "target": "web_page_summary",
    "agent_name": "mcp_application_loop"
  "data": {
    "progress_action": "Finished",
    "target": "web_page_summary",
    "agent_name": "mcp_application_loop"
    "target": "web_page_summary",
    "agent_name": "mcp_application_loop"
    "agent_name": "mcp_application_loop"
  }
}
0:00:33 Running         ━━━━━━━━━━━━━━━ web_page_summary
0:00:15 Finished        ━━━━━━━━━━━━━━━ finder (qwen-turbo)
0:00:17 Finished        ━━━━━━━━━━━━━━━ finder (qwen-turbo)
```

## 最后

可以看到, 现在我们可以通过很少的代码量, 就可以实现一个质量还可以的智能代理了, 这个例子比较简单, 真正用于实际工作中的智能代理是需要经过不少打磨的.

本文的代码已经放到这个开源仓库中了 [https://github.com/yeshan333/webpage-summary-agent](https://github.com/yeshan333/webpage-summary-agent), 可以直接下载下来玩玩.

MCP 协议和 mcp-agent 还处于一个比较早期的阶段, 实际把玩过程中会遇到不少的问题, 相信往后会越来越好, 助你在 AI 新时代“玩的开心”~
