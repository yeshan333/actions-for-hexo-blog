---
name: blog-llms-refresh
description: 写完新博文后，半自动地把新文章同步到 source/llms.txt（llms.txt 规范的站点索引文件）。通过 git status 自动检测 source/_posts/ 下未提交的新文章，解析 frontmatter，按主题归类后追加到 llms.txt 对应的 H2 分节中。当用户说「刷新博客」「刷新 llms.txt」「同步新文章到 llms.txt」「refresh llms」「新文章写完了」「发布完成」「llms 刷新」，或者刚刚完成一篇新博文创作并希望同步索引时，使用此 skill。即使用户只说一句「刷新一下」且当前对话上下文是博客写作场景，也应触发。
---

# Blog LLMS Refresh — 新文章写完后自动刷新 `llms.txt`

把新写的博文同步到 `source/llms.txt`，让 LLM 索引始终跟得上博客最新内容。

## 设计目标

`source/llms.txt` 遵循 [llms.txt 规范](https://llmstxt.org/)，是给大模型读的站点入口文件，包含按主题归类的精选文章列表。每写完一篇新博文，都需要把它登记到对应主题分节中，否则 LLM 永远只能看到旧文章。

这个 skill 的核心约束：

- **半自动**：检测到新文章后，**必须先询问用户是否同步**，不要直接改文件
- **基于 git**：用 `git status` 找出 `source/_posts/` 下未提交（untracked / modified）的 `.md` 文件作为「新文章」
- **按主题归类**：根据文章 frontmatter 的 `tags` / `categories` / `keywords`，匹配到 `llms.txt` 中现有的 H2/H3 分节（优先匹配 H3 子分节），匹配不上时让用户决策
- **最小破坏**：只追加新条目，不动现有结构和其他条目的顺序

## 核心流程

```
git status 扫描 source/_posts/
  ↓
解析每篇新文章的 frontmatter（title / date / description / tags / categories / permalink）
  ↓
读取 source/llms.txt，提取现有 H2 分节列表 + 已收录的文章 URL 集合（去重用）
  ↓
为每篇新文章推荐归类分节，生成预览
  ↓
向用户展示预览 + 询问确认（半自动卡点）
  ↓
用户确认后，追加到 llms.txt 对应分节的开头（最新文章在前）
  ↓
完成汇报
```

## Step 1: 扫描未提交的新文章

在仓库根目录执行：

```bash
git -C <repo_root> status --porcelain source/_posts/ | cat
```

`git status --porcelain` 输出格式为 `XY filename`，其中 `X` 是 staged 状态，`Y` 是 working tree 状态。判断规则：

| porcelain 状态 | 含义 | skill 处理方式 |
|---|---|---|
| `??` | untracked，文件全新且未 `git add` | **必处理**（最常见的"刚写完新文章"场景）|
| `A ` | 已 `git add` 但未 commit 的新增文件 | **必处理** |
| `R ` 或 `R  old -> new` | 重命名 | **必处理新名**（permalink 会变，相当于一篇"新"文章）|
| ` M` / `M ` / `MM` | 修改 | **默认跳过**，仅当用户明确要求"包括修改的文章"时才处理 |
| `D ` / ` D` | 删除 | **跳过**，但提示用户「检测到删除的文章 X，记得手动从 llms.txt 移除对应条目」 |

额外过滤：

- 只处理 `.md` 后缀
- 跳过 `source/_posts/_drafts/`、`source/_posts/README.md`、隐藏文件（`.` 开头）
- 跳过 frontmatter 中 `published: false` 的文章
- 跳过 frontmatter 中 **`password` 字段值非空**的加密文章（注意：仅"存在 `password:` 字段"不算加密，必须值非空——博主部分模板文章保留了空的 `password:` 占位字段。例如 `password:` 后面跟换行属于空值，不应跳过；`password: 1234` 才属于加密文章）

如果没有任何符合条件的文件，直接告诉用户「未检测到 source/_posts/ 下未提交的新文章」，结束流程，**不要凭空编造也不要去找其他来源**。

## Step 2: 解析每篇新文章的 frontmatter

对每个新文件，用 `read_file` 读取**前 50 行**（足以覆盖绝大多数 frontmatter；若 50 行内未出现第二个 `---` 闭合标记，再追加读后续 50 行）。Frontmatter 是文件最开头被两行 `---` 包住的 YAML 块。

### 2.1 字段提取

提取以下字段（字段不存在时按"兜底规则"处理，**不要猜值**）：

| 字段 | 用途 | 缺失时 |
|---|---|---|
| `title` | 写入 `llms.txt` 的文章标题 | 必需，缺失则跳过该篇并提示 |
| `date` | 生成 permalink，推断"最新"排序 | 必需，缺失则跳过该篇并提示 |
| `description` | 链接后的简介首选来源 | 退到 `keywords` |
| `keywords` | `description` 缺失时的备选简介 | 再退到正文首段 |
| `tags` | 归类匹配的主信号 | 退到 `categories` |
| `categories` | 归类匹配的次信号 | 退到 `keywords` 和 `title` 关键词 |
| `permalink` | 自定义 URL 路径 | 用默认 permalink 规则生成 |

### 2.2 复杂字段的解析规范

Hexo frontmatter 中 `tags` / `categories` 写法多样，必须容错处理三种形式：

```yaml
# 形式 1: 单个字符串
tags: MacOS

# 形式 2: 行内数组
tags: [Claude Code, Qwen3 Coder, Stellar, Hexo]

# 形式 3: 块级列表（categories 还可能嵌套数组表示层级）
tags:
  - AI 生成
  - C/C++
categories:
  - [Claude Code]
  - [AI]
```

统一展平成一个**去重后的字符串列表**用于后续匹配，例如 `["Claude Code", "Qwen3 Coder", "Stellar", "Hexo"]`。**不要保留嵌套结构**，也不要把 `[Claude Code]` 当成单个字符串 `"[Claude Code]"`。

### 2.3 生成最终 URL

`_config.yml` 实测关键配置：
```yaml
url: https://shansan.top
permalink: :year/:month/:day/:title/
pretty_urls:
  trailing_index: true
  trailing_html: true
```

线上实测样本：`source/_posts/migrate-theme-to-stellar-with-claude-code.md`（`date: 2025-07-27 02:24:40`）→ `https://shansan.top/2025/07/27/migrate-theme-to-stellar-with-claude-code/`（带斜杠、无 `index.html`）。

URL 拼接规则：

```
{site.url}/{YYYY}/{MM}/{DD}/{文件名 slug}/
```

- `{site.url}`：固定为 `https://shansan.top`（来自 `_config.yml` 的 `url` 字段；如果 skill 在其他博客仓库被复用，应该从 `_config.yml` 读取，**不要硬编码**）
- `{YYYY}/{MM}/{DD}`：来自 frontmatter `date` 字段，**月和日必须零填充两位**（`2025-07-27` → `2025/07/27`，不是 `2025/7/27`；这是 Hexo `:month`/`:day` 占位符的语义）
- `{文件名 slug}`：取自 `.md` 文件名去掉后缀。这是 Hexo `:title` 占位符的实测行为（[官方文档](https://hexo.io/docs/permalinks)：`:title` = "Filename (relative to source/_posts/ folder)"）
- **末尾必须保留斜杠 `/`**（实测线上 URL 即如此）
- 如果 frontmatter 显式设置了 `permalink:` 字段，优先使用自定义值（拼到 `{site.url}/` 之后）

**不处理 i18n**：当前博客 `_config.yml` 虽有 `language: [zh-CN, en, zh-TW]` 和 `i18n_dir: :lang`，但 `source/_posts/` 下实际没有任何 `.zh-CN.md` / `.en.md` 后缀的多语言文章，permalink 中也没有 `:lang` 占位符。如果**未来**博主开始用 i18n，遇到带语言后缀的文件名时，明确提示用户「检测到疑似多语言文章 X，请手动确认其线上 URL，本次跳过」，**不要自作主张拼路径**。

### 2.4 解析失败处理

如果 frontmatter 解析失败（YAML 格式错误、缺 `title` 或 `date` 必需字段），告知用户具体文件名和原因，跳过该篇继续处理其他文章，**不要猜测日期或瞎编 URL**。

## Step 3: 读取并理解现有 `llms.txt` 结构

**每次都用 `read_file` 完整读取 `source/llms.txt`**（文件通常 < 200 行，可整文件读），从中动态解析：

1. **H2 分节列表**：所有 `^## ` 开头的标题
2. **H3 子分节列表**：所有 `^### ` 开头的标题，以及它归属的 H2
3. **已收录的文章 URL 集合**：所有 `- [...](URL): ...` 形式列表项中的 URL，用于去重判断
4. **每个分节的「插入锚点」**：该分节下第一个 `- [` 列表项的完整行内容（追加新条目时，新条目要插在它**之前**，使用 `file_replace` 把"旧第一行"替换为"新条目\n旧第一行"）

⚠️ **不要把任何分节名硬编码进 skill 的逻辑里**。文件结构会随用户编辑而变化。当前文件中观察到的结构示例（**仅作参考、运行时以实际读到为准**）：

```
## 站点入口                     ← H2，下面直接挂列表项
## 精选文章 / Featured Posts    ← H2，下面只有 H3 子分节，本身不直接挂列表
  ### AI Coding & AI 工作流     ← H3
  ### 云原生 & 分布式系统       ← H3
  ### Erlang / Elixir           ← H3
  ### 开发者工具 & 工程实践     ← H3
  ### 系统底层 & 安全           ← H3
## 连载专栏 / Series            ← H2，下面直接挂列表项（无 H3）
## 兴趣杂记 / Misc              ← H2，下面直接挂列表项（无 H3）
## Optional                     ← H2，按规范放最后
```

如果 `source/llms.txt` 文件不存在，进入下方「错误处理」段落的对应分支。

## Step 4: 为每篇文章推荐归类分节

**目标分节优先级**：优先选 H3（细粒度），没有合适 H3 时退回选 H2（粗粒度）。例如新文章主题是「年度回顾」时，归到 H2 「兴趣杂记 / Misc」即可，不用也不该新增 H3。

匹配优先级（从高到低）：

1. **关键词强匹配**：把文章的 `tags` / `categories` / `keywords` 全部小写化、去除空格符号后，与 Step 3 解析出的所有分节标题做关键词包含匹配。匹配到 ≥1 个关键词的分节即为候选；多个候选时，匹配关键词更多的分节胜出。下面是基于当前文件结构的**示例**映射（运行时应根据实际分节动态判断，不要硬写死）：

   | 文章关键词样例 | 倾向分节（示例）|
   |---|---|
   | `Claude Code` / `iFlow CLI` / `Qwen` / `LLM` / `AI Agent` / `n8n` / `Sider` / `LangChain` | AI Coding & AI 工作流 |
   | `Kubernetes` / `k8s` / `etcd` / `MongoDB` / `Chaos` / `分布式` / `YCSB` / `benchmark` | 云原生 & 分布式系统 |
   | `Erlang` / `Elixir` / `vfox` | Erlang / Elixir |
   | `MacOS` / `dotfiles` / `chezmoi` / `WXT` / `浏览器插件` / `Tech-Weekly` | 开发者工具 & 工程实践 |
   | `Sanitizer` / `内存安全` / `编译插桩` / `C/C++` / `LLVM` | 系统底层 & 安全 |
   | `Weekly` / `连载` | 连载专栏 / Series（H2） |
   | `music` / `年度回顾` / `年终` | 兴趣杂记 / Misc（H2） |

2. **语义判断**：关键词不直接命中时，结合 `title` + `description` 的语义判断最贴近的分节。

3. **新增分节**：只有当文章主题与所有现有分节都明显不匹配（如博客第一次出现「前端 / 区块链 / 数据库内核」等全新领域）时，才向用户**提议**新增 H3，并明确给出建议的分节名和它要插在哪个 H2 下、放在哪两个现有 H3 之间。**不要擅自新增**。

4. **置信度低时**：如果同时命中两个候选分节且权重相近，列出两个候选，让用户选。

**严禁瞎归类**——拿不准时让用户拍板，不要硬塞到某个分节里。

## Step 5: 生成预览并向用户确认（半自动卡点）

在动手改 `llms.txt` 之前，**必须**用清晰的 markdown 表格或列表向用户展示：

```
检测到 N 篇未提交的新文章：

| # | 文章标题（与 frontmatter 一致，不加书名号） | 推荐归类 | URL |
|---|---|---|---|
| 1 | 使用 uv 替代 pip 管理 Python 依赖 | 开发者工具 & 工程实践 | https://shansan.top/2026/05/01/using-uv-for-python-deps/ |
| 2 | 用 LangChain 给博客做一个 RSS RAG 问答机器人 | AI Coding & AI 工作流 | https://shansan.top/2026/04/30/blog-rag-with-langchain/ |

每条将以以下格式追加到对应分节的开头（标题原样保留，不加书名号或其他装饰）：

- [文章标题原样](URL): 一句话简介。

确认追加吗？（可以回复"确认"、"调整第 N 条到 XX 分节"、或"跳过第 N 条"）
```

**等待用户回复后再继续**。如果用户提出调整，按调整后的方案再次展示预览，直到用户明确确认。

## Step 6: 追加到 `llms.txt`

确认后执行追加。**所有写操作必须用 `file_replace` 做精确替换，禁止 `create_file` 覆盖整个文件**。

### 6.1 不同目标分节的插入策略

根据 Step 3 解析的结构，分三种情况：

**情况 A：目标是 H3 子分节（如「AI Coding & AI 工作流」）**
- 锚点 = 该 H3 下第一个 `- [` 开头的行
- 用 `file_replace`：`old_string = 锚点行`，`new_string = 新条目行 + "\n" + 锚点行`
- 如果该 H3 下当前没有任何列表项（H3 标题之后紧接着是空行或下一个标题），用 H3 标题行作为锚点：`old_string = "### XXX\n"`，`new_string = "### XXX\n\n- [...](...): ...\n"`

**情况 B：目标是 H2 直接挂列表项（如「连载专栏 / Series」、「兴趣杂记 / Misc」）**
- 同情况 A，锚点 = 该 H2 下第一个 `- [` 开头的行

**情况 C：需要新增 H3（用户已确认）**
- 锚点 = 同 H2 下下一个已存在的 H3 标题行，或该 H2 下的下一个 H2 标题行
- 用 `file_replace`：在锚点之前插入完整的 `### 新分节名\n\n- [...](...): ...\n\n`

### 6.2 行格式规范

严格遵循文件中已有的写法（参考 Step 3 解析时观察到的实际格式），一行一条：

```
- [文章完整标题](文章URL): 一句话简介，30~120 字，以中文句号「。」结尾。
```

格式细节：

- 标题：直接用 frontmatter 的 `title` 字段原值，不要做任何裁剪/翻译/改写。如果 title 包含中括号 `[]`，用反斜杠转义为 `\[\]`，避免破坏 markdown 链接语法
- URL：来自 Step 2 生成的完整 URL（含 `https://` 前缀和末尾 `/`）
- 冒号后面有一个**英文空格**（与现有条目对齐）
- 简介：**长度参考实际文件**——当前 `llms.txt` 中已收录 32 条，简介长度从 ~30 字到 ~120 字不等，平均约 60 字。**控制在 30~120 字**之间，必须以中文句号「。」结尾。生成顺序：
  1. 优先用 frontmatter 的 `description`（去掉首尾引号；如果末尾是英文句号 `.`，改为中文句号「。」；如果末尾没有标点，补上「。」）
  2. `description` 缺失时用 `keywords`（去掉引号、按逗号拆分）+ `title` 拼出一句话，模板：「关于 {keywords 列表} 的 {title 主题词}。」
  3. 都没有时，`read_file` 读正文前 50 行，提取第一段非空非标题非图片非代码块的文字（清洗掉 `##`、`![](...)`、` ``` `、`[](...)` 链接语法，保留链接的可见文本），截取/压缩成一句话

### 6.3 多篇文章同分节的处理

**多篇文章归属同一个分节时**，按 `date` **倒序**一次性合并到一个 `file_replace` 调用里：

- `old_string = 锚点行`
- `new_string = 文章A行 + "\n" + 文章B行 + "\n" + 锚点行`（A 比 B 新）

避免对同一锚点连续做多次 `file_replace`（第二次会因为锚点已经被改而匹配失败）。

### 6.4 写后复核（强制）

每完成一个分节的修改后，**必须**用 `read_file` 读取被修改区域的前后 ±5 行验证：

1. 新条目格式与同分节其他条目一致（前缀 `- `、`[](` 完整、`: ` 后简介、句号结尾）
2. 没有意外改动其他分节、H1、blockquote、Optional 段落
3. 没有引入空白行漂移、重复行

如果复核发现问题，**立即用 `file_replace` 回退**到修改前的内容，再重新尝试，**不要把破损的文件留给用户**。

## Step 7: 汇报与建议

完成后向用户汇报：

1. **追加结果**：哪几篇成功追加到了哪些分节，展示插入的具体行内容
2. **跳过项**：哪些文章被跳过及原因（已存在 / 用户跳过 / frontmatter 解析失败）
3. **后续建议**（按需提示，不要每次都全说）：
   - 「记得 `git add source/llms.txt` 一起提交，让本次新文章和索引同步上线」
   - 「需要我顺手帮你跑一下 `hexo clean && hexo g` 验证 llms.txt 能正常构建吗？」

## 错误处理

| 触发条件 | 处理方式 |
|---|---|
| 当前工作目录不在 git 仓库内（`git rev-parse --is-inside-work-tree` 非 `true`）| 提示用户当前目录不是 git 仓库，无法用 git 检测新文章，结束流程 |
| `source/llms.txt` 文件不存在 | 明确提示「`source/llms.txt` 不存在，无法追加。请先创建该文件（可参考 https://llmstxt.org/ 规范），或回复『帮我生成初始版本』我可以基于现有 _posts 自动生成」，**等待用户决策，不要静默回退** |
| `git status` 命令本身报错（权限、仓库损坏等）| 原样把 git 错误信息透传给用户 |
| 单篇 frontmatter 解析失败（YAML 错、缺 title/date）| 跳过该篇并明确告知文件名和原因，**继续处理其他篇**，不要让单篇错误中断整批 |
| 锚点 `file_replace` 匹配失败（用户在 skill 准备期间手动编辑了 llms.txt）| 重新跑一遍 Step 3 + Step 6.1 重新定位锚点；如果连续失败两次，停下并把生成好的待追加片段直接展示给用户让其手动粘贴 |
| 整批文章的 URL 都已存在于 llms.txt | 告知用户「所有检测到的新文章 URL 在 llms.txt 中均已存在，无需追加」，结束流程 |

## 完整示例

用户：「我刚写完两篇文章，刷新一下博客」

执行：

1. **Step 1** — `git -C /path/to/repo status --porcelain source/_posts/ | cat`
   ```
   ?? source/_posts/using-uv-for-python-deps.md
   ?? source/_posts/blog-rag-with-langchain.md
   ```
   两条都是 `??`（untracked .md），符合处理条件。

2. **Step 2** — `read_file` 两个文件的前 50 行解析 frontmatter：
   - `using-uv-for-python-deps.md`：title=`使用 uv 替代 pip 管理 Python 依赖`，date=`2026-05-01 14:00:00`，tags=`[uv, Python, dotfiles]`，description=`...`
     → URL = `https://shansan.top/2026/05/01/using-uv-for-python-deps/`
   - `blog-rag-with-langchain.md`：title=`用 LangChain 给博客做一个 RSS RAG 问答机器人`，date=`2026-04-30 22:00:00`，tags=`[LangChain, LLM, RAG, n8n]`，description=`...`
     → URL = `https://shansan.top/2026/04/30/blog-rag-with-langchain/`

3. **Step 3** — `read_file source/llms.txt`，解析出 H3 分节包括「AI Coding & AI 工作流」「开发者工具 & 工程实践」等；URL 集合中无这两个新 URL。

4. **Step 4** — 关键词匹配：
   - 第一篇 tags 含 `dotfiles` / `Python` → 候选「开发者工具 & 工程实践」
   - 第二篇 tags 含 `LangChain` / `LLM` / `RAG` / `n8n` → 候选「AI Coding & AI 工作流」

5. **Step 5** — 展示预览表格 → 等待用户确认。

6. **Step 6** — 用户回复「确认」→ 两个 `file_replace` 调用：
   - 在「开发者工具 & 工程实践」第一条前插入第一篇
   - 在「AI Coding & AI 工作流」第一条前插入第二篇
   - 各自完成后 `read_file` 校验上下 5 行

7. **Step 7** — 汇报：
   ```
   ✅ 已追加 2 篇到 source/llms.txt：
     - 「开发者工具 & 工程实践」+ 1 条
     - 「AI Coding & AI 工作流」+ 1 条
   建议执行：git add source/llms.txt source/_posts/using-uv-for-python-deps.md source/_posts/blog-rag-with-langchain.md
   ```
