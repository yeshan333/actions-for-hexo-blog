---
title: 【体验】使用 GitHub Copilot Agent 创建新的 RSSHub 路由
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "GitHub Copilot Agent、RSSHub"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
cover: https://ospy.shan333.cn/blog/agent-rsshub.jpg
description: "使用 GitHub Copilot Agent 创建新的 RSSHub 路由"
date: 2025-04-20 18:54:12
updated:
tags: ["LLM", "Copilot", "RSSHub", "Code Agent"]
categories: [Colipot Agent]
---

RSS Really Simple Syndication（简易信息聚合）是一种订阅某个网站内容更新的协议，目前用的没那么多了，很多网站也不提供 RSS 订阅了.

RSSHub 是一个强大的 RSS 订阅源制作工作，通过它我们可以很方便为任意网站制作 RSS. RSSHub 的生态非常丰富, 文档也较为完善. 不过根据 RSSHub 的开发指南，想要开发出一个 RSS route 路由 (RSS 订阅源)，还是需要一点背景知识。

目前正处于 AI 应用极为火热的时代，作为喜欢偷懒的程序员，当然要借助大模型的力量快速完成开发. 恰逢 GitHub Copilot 4 月份发布了类似 Cursor 的 Code Agent 模式，同时支持了 MCP 协议. 我们已经可以很方便的在 vscode 中使用 Agent 模式快速为一个网站开发出 RSS 路由. 我们所要做的，只需要将对应的 RSSHub 开发知识作为 Context 灌输给 Agent 即可，让 Agent 具备对应的开发知识.

让我们开始吧~

## 编写 prompt

第一步，首先就是编写 prompt, 对于 Prompt，我们也可以通过 AI 帮我们生成（主打一个偷懒~/(ㄒoㄒ)/~~），这里我使用了 X 的 [Grok3](https://grok.com/) 去生成一个 RSSHub 路由制作专家的 prompt 提示词:

```shell
# 告诉 grok
根据 https://raw.githubusercontent.com/RSSNext/rsshub-docs/refs/heads/main/src/joinus/new-rss/start-code.md 的内容，帮我创建一个 RSSHub 路由制作专家的 prompt. 注意以 markdown 格式返回给我.
```

现在的各种 LLM 大模型对话平台的能力已经很强了，只要给一个 URL 就会帮我访问获取对应网站内容，根据网站内容和用户意图，完成各种工作.

最终 Grok3 给我的回复如下:

```markdown
# RSSHub 路由制作专家 Prompt

你是一位 RSSHub 路由制作专家，精通使用 Node.js、ofetch、Cheerio 等工具，根据 RSSHub 官方文档（https://raw.githubusercontent.com/RSSNext/rsshub-docs/refs/heads/main/src/joinus/new-rss/start-code.md）创建高质量的 RSS 路由。你的任务是帮助用户设计、编写和调试 RSSHub 路由代码，确保代码符合 RSSHub 的脚本标准，生成符合 RSS 2.0 规范的订阅源。

## 任务要求

1. **理解用户需求**：
   - 分析用户提供的目标网站或 API，确定数据来源（API、HTML 网页等）。
   - 确认目标网站是否已提供 RSS 订阅（如 HTML 头部包含 `<link rel="alternate" type="application/rss+xml" />`），若有则无需创建路由。
   - 提取用户需要的 RSS 内容（如标题、链接、描述、发布日期等）。

2. **路由设计**：
   - **命名空间**：根据目标网站的二级域名创建命名空间（如 `github` 用于 `github.com`），避免重复或变体命名空间。
   - **路由路径**：设计清晰的路由路径，支持动态参数（如 `/github/issue/:user/:repo`），并确保路径符合 Hono 路由规则。
   - **参数处理**：使用 `ctx.req.param()` 获取动态参数，并设置合理的默认值（如 `repo = 'RSSHub'`）。
   - **RSSHub Radar**：为路由配置 `radar.js`，便于用户通过 RSSHub Radar 浏览器扩展订阅。

3. **数据获取**：
   - **优先级**：优先使用 API 获取数据，因其稳定且高效；若无 API，则通过 `ofetch` 获取 HTML 并用 Cheerio 解析。
   - **工具使用**：
     - 使用 `@/utils/ofetch` 发送 HTTP 请求（如 GET 请求至 `https://api.github.com/repos/${user}/${repo}/issues`）。
     - 使用 Cheerio 解析 HTML，提取所需元素（如标题、链接等）。
     - 若需渲染动态页面，可考虑 `puppeteer`，但仅在必要时使用。
   - **异常处理**：确保代码处理 HTTP 请求失败、数据缺失等情况，输出清晰的错误信息。

4. **RSS 格式化**：
   - 生成符合 RSS 2.0 规范的输出，包含以下字段：
     - `title`：频道标题（如 `${user}/${repo} Issues`）。
     - `link`：频道链接（如 `https://github.com/${user}/${repo}/issues`）。
     - `description`：频道描述（可选）。
     - `item`：文章列表，每项包含 `title`、`link`、`description`、`pubDate` 等。
   - 将数据赋值给 `ctx.state.data`，由 RSSHub 中间件自动渲染。
   - 支持扩展功能（如 Sci-hub、Podcast、Media RSS、BitTorrent），通过设置 `supportSciHub`、`supportPodcast`、`supportBT` 等属性。

5. **代码规范**：
   - 遵循 RSSHub Script Standard，确保代码可读性高、易于维护。
   - 在 `lib/routes/<namespace>/<route>.ts` 中注册路由，返回符合 `Route` 类型的对象。
   - 添加路由描述（`description`）、分类（`categories`）、功能（`features`）等元数据。
   - 更新 `maintainer.js`，记录路由维护者信息。

6. **调试与测试**：
   - 在本地运行 RSSHub（`yarn dev` 或 `npm run dev`），访问 `http://localhost:1200` 查看路由效果。
   - 检查控制台输出，捕获错误信息并优化代码。
   - 使用 RSSHub Radar 验证路由的可订阅性。

7. **文档与社区**：
   - 为路由编写清晰的文档，说明参数、功能和使用方法。
   - 鼓励用户提交 Pull Request 或向社区求助（如 RSSHub Telegram 群组）。
```

拿到了 Prompt 之后，接下来我们需要将它注入到 GitHub Copilot Agent 的代码生成指令上下文中，这里可以参考 [Custom instructions for GitHub Copilot in VS Code](https://code.visualstudio.com/docs/copilot/copilot-customization#_reusable-prompt-files-experimental). 接下来，我们将会基于这个 prompt 指挥 Agent 进行 RSSHub Route 路由的开发.

## 让 GitHub Copilot Agent 自动编码实现 RSSHub Route

编码开始前，我们当然需要自己准备对应的 RSSHub 开发环境，这里可以参考 [https://docs.rsshub.app/joinus/new-rss/prerequisites](https://docs.rsshub.app/joinus/new-rss/prerequisites)，主要是需要安装 Node.js 和 pnpm. 代码编辑器我们使用的是 vscode. 开发环境为 Windows 11.

1. Fork RSSHub 的代码仓库: [https://github.com/DIYgod/RSSHub/fork](https://github.com/DIYgod/RSSHub/fork)

2. 下载 fork 后的仓库到本地开发环境，安装依赖:

```
git clone https://github.com/yeshan333/RSSHub.git

cd RSSHub

pnpm install
```

3. 将 Grok AI 生成的 RSSHub 路由开发专家 prompt 放到开发目录的 `.vscode/prompts` 子目录中:

```shell
mkdir -p .vscode/prompts
touch .vscode/prompts/rsshub.prompt.md

# 复制粘贴 prompt 到文件 vscode/prompts/rsshub.prompt.md 中
```

4. vscode 打开 GitHub Copilot 指挥 Agent 开发网站 [https://elixirmerge.com/](https://elixirmerge.com/) 的 RSSHub 路由:

```shell
帮我生成这个网站的 RSSHub 路由: https://elixirmerge.com/
```

这里我们使用的模型是 Claude 3.7 Sonnet.

## 效果

![https://ospy.shan333.cn/blog/rsshub-route-with-copilot-agent.jpg](https://ospy.shan333.cn/blog/rsshub-route-with-copilot-agent.jpg)

可以看到 Agent 会帮我创建好对应的源文件，不过仔细观察生成的代码还是需要调整的，这里调整也可以继续完善 prompt，如果想要一句话实现 RSSHub 路由，应该还需要不少的调优动作, 这里我拿到的 AI 生成代码如下:

```ts
import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/',
    categories: ['programming'],
    example: '/elixirmerge',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['elixirmerge.com/'],
        },
    ],
    name: 'Latest Articles',
    maintainers: [],
    handler,
    url: 'elixirmerge.com/',
};

async function handler() {
    const url = 'https://elixirmerge.com/';
    
    const response = await got({
        method: 'get',
        url,
    });

    const $ = load(response.data);
    
    const list = $('article').toArray();

    const items = await Promise.all(
        list.map((item) => {
            const $item = $(item);
            const $link = $item.find('a[href]').first();
            const link = new URL($link.attr('href') || '', url).href;
            const title = $item.find('h2').text().trim();
            const pubDateStr = $item.find('time').text().trim();
            
            // Extract description directly from the article preview
            const description = $item.find('.content, p').text().trim();

            return {
                title,
                link,
                pubDate: parseDate(pubDateStr, 'MMM DD, YYYY'),
                description,
            };
        })
    );

    return {
        title: 'Elixir Merge - Latest Articles',
        link: url,
        description: 'Latest updates from Elixir Merge - The daily Elixir development newsletter',
        item: items,
    };
}
```

启动开发环境调试服务器，看看还需要什么 (仔细观察代码结合 RSSHub 的路由开发指南，代码一看就有问题).

```shell
pnpm run dev
```

访问：[http://localhost:1200/elixirmerge](http://localhost:1200/elixirmerge)，可以观察到实现并不完备. emmm, 看来得来多几轮对话才行. 结合经验 HTML 抽取的不对，我们使用如下指令让 AI 继续优化下:

```shell
仔细阅读 https://elixirmerge.com/ 的 HTML 结构，重构代码
```

最终生成的 route 终于可用了~，效果如下：

![final-result-github-copilot-rsshub-route](https://ospy.shan333.cn/blog/final-result-github-copilot-rsshub-route.jpg)


路由代码如下，质量还凑合：

```ts
import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/updates',
    categories: ['programming'],
    example: '/elixirmerge/updates',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['elixirmerge.com/'],
        },
    ],
    name: 'Latest Articles',
    maintainers: [],
    handler,
    url: 'elixirmerge.com',
    description: 'Get the latest articles from Elixir Merge, a daily Elixir development newsletter.'
};

async function handler() {
    const url = 'https://elixirmerge.com/';

    const response = await got({
        method: 'get',
        url,
    });

    const $ = load(response.data);

    // 重新实现文章提取逻辑，更加精确地定位文章元素
    const articles = [];

    // 方法1：获取带有日期的文章条目
    $('body').find('div, article').each((_, element) => {
        const $element = $(element);
        // 寻找包含日期格式文本的元素
        const dateText = $element.text().match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/)?.[0];

        if (dateText) {
            // 查找标题和描述
            const fullText = $element.text().trim();
            const parts = fullText.split(dateText);

            if (parts.length >= 1) {
                const title = parts[0].trim();

                // 确保这是一个有效的文章条目，而不是导航或其他元素
                if (title.length > 10 && title !== 'Subscribe') {
                    let description = '';

                    // 检查当前元素或前一个元素是否包含描述文本
                    const prevElement = $element.prev();
                    if (prevElement.text().length > 20 && !prevElement.text().includes('Subscribe')) {
                        description = prevElement.text().trim();
                    }

                    // 从标题生成 slug
                    const slug = title
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/\s+/g, '-');

                    const link = `https://elixirmerge.com/p/${slug}`;

                    articles.push({
                        title,
                        link,
                        pubDate: parseDate(dateText, 'MMM D, YYYY'),
                        description: description || title,
                    });
                }
            }
        }
    });

    // 方法2：获取特色文章（通常有更结构化的内容）
    $('a:contains("Continue reading")').each((_, element) => {
        const $parent = $(element).closest('div');

        // 从父元素中提取标题、描述和日期
        let title = $parent.find('h1, h2, h3').text().trim();
        if (!title) {
            // 有时标题可能在相邻元素中
            const $container = $parent.parent();
            title = $container.find('h1, h2, h3').first().text().trim();
        }

        // 提取描述
        let description = '';
        $parent.find('p').each((_, p) => {
            const text = $(p).text().trim();
            if (text.length > 30) { // 避免短文本，如日期或作者
                description = text;
                return false; // 获取第一个长段落
            }
        });

        // 提取日期
        const dateMatch = $parent.text().match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/);
        const dateText = dateMatch ? dateMatch[0] : '';

        if (title && dateText) {
            const slug = title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');

            const link = `https://elixirmerge.com/p/${slug}`;

            articles.push({
                title,
                link,
                pubDate: parseDate(dateText, 'MMM D, YYYY'),
                description: description || title,
            });
        }
    });

    // 方法3：查找包含日期的组合结构
    $('.grid, .flex, .container, main').find('div').each((_, container) => {
        const $container = $(container);
        const dateMatch = $container.text().match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{1,2},\s\d{4}/);

        if (dateMatch && $container.text().length > 50 && $container.text().length < 1000) {
            const dateText = dateMatch[0];
            let title = '';
            let description = '';

            // 尝试从结构中获取标题和描述
            $container.children().each((_, child) => {
                const text = $(child).text().trim();
                if (!title && text.length > 10 && !text.includes(dateText)) {
                    title = text;
                } else if (title && text.length > 30 && !text.includes(dateText)) {
                    description = text;
                }
            });

            if (!title) {
                // 备选方法：从全文中提取标题
                const fullText = $container.text().replace(dateText, '').trim();
                const lines = fullText.split('\n').map(line => line.trim()).filter(line => line);
                if (lines.length > 0) {
                    title = lines[0];
                    if (lines.length > 1) {
                        description = lines.slice(1).join(' ');
                    }
                }
            }

            if (title && title !== 'Subscribe') {
                const slug = title
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/\s+/g, '-');

                const link = `https://elixirmerge.com/p/${slug}`;

                articles.push({
                    title,
                    link,
                    pubDate: parseDate(dateText, 'MMM D, YYYY'),
                    description: description || title,
                });
            }
        }
    });

    // 去重，因为可能有重复的文章
    const uniqueArticles = [];
    const titleSet = new Set();

    for (const article of articles) {
        if (!titleSet.has(article.title)) {
            titleSet.add(article.title);
            uniqueArticles.push(article);
        }
    }

    // 按发布日期排序，最新的在前
    uniqueArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 只保留最新的 30 篇文章
    const latestArticles = uniqueArticles.slice(0, 30);

    return {
        title: 'Elixir Merge - Daily Elixir Newsletter',
        link: url,
        description: 'The latest updates from Elixir Merge - A daily newsletter with the best Elixir content in just 5 minutes',
        item: latestArticles,
        language: 'en',
    };
}
```