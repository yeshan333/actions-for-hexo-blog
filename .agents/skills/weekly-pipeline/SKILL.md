---
name: weekly-pipeline
description: 端到端周刊处理流水线：解读周刊 → 上传信息图到图床 → 更新博客文档。当用户给你一个周刊链接并希望你完成从解读到发布的全流程时使用此 skill。触发词包括"处理周刊"、"周刊流水线"、"周刊全流程"、"process newsletter"、"weekly pipeline"，或者用户丢给你一个周刊链接并提到"更新文档"、"发布"、"上传"等意图时也应触发。即使用户只是说"帮我处理一下这期周刊"，也应该使用此 skill。
---

# Weekly Pipeline — 周刊处理全流程

将一条周刊链接转化为完整的图文解读，并自动上传图片、更新博客文档，实现从阅读到发布的端到端自动化。

## 核心流程

```
周刊 URL
  ↓
Step 1: 调用 weekly-digest 深度解读周刊，生成信息图
  ↓
Step 2: 收集所有生成的信息图（PNG 文件）
  ↓
Step 3: 调用 cfbed-uploader 逐张上传到图床，收集 URL
  ↓
Step 4: 将图片 URL 按格式追加到博客文档
  ↓
完成 ✅
```

## Step 1: 调用 weekly-digest 处理周刊

按照 `weekly-digest` skill 的完整流程处理用户提供的周刊链接：

1. 抓取周刊目录并分类
2. 逐篇深度阅读文章
3. 提炼核心观点，生成解读 Markdown
4. 为每篇文章生成信息图
5. 生成总览信息图

所有输出存放在 `weekly-digest-output/{周刊名}-{期号}/` 目录下。

完成后，确认 `infographics/` 目录下的所有 PNG 文件已生成。

## Step 2: 收集信息图文件

从 `weekly-digest-output/{周刊名}-{期号}/infographics/` 目录收集所有 PNG 文件。

按以下顺序排列（这个顺序决定了最终在文档中的展示顺序）：

1. **`overview.png`** — 总览信息图，放在最前面（作为 banner）
2. **按编号排序的文章信息图** — `01-xxx.png`, `02-xxx.png`, ...
3. **合并类信息图** — `briefs-roundup.png`, `elsewhere-roundup.png` 等

## Step 3: 上传信息图到图床

使用 `cfbed-uploader` skill 的上传脚本，将每张信息图上传到 CloudFlare ImgBed。

上传脚本路径（相对于项目根目录）：

```bash
bun run .agents/skills/cfbed-uploader/scripts/upload.ts <图片路径>
```

逐张上传，记录每张图片的上传结果 URL。如果某张图片上传失败，重试一次；仍然失败则记录错误并继续处理其余图片，最后汇报失败的文件。

上传完成后，整理出一份有序的 URL 列表，对应 Step 2 中的文件顺序。

## Step 4: 更新博客文档

将上传后的图片 URL 追加到 `source/_posts/Software-Testing-Weekly-Visual-Interpretation.md` 文件末尾。

### 文档格式

严格遵循以下格式模板（参照文档中已有的内容格式）：

```markdown

## Software Testing Weekly #{期号}

> 原文: {周刊原文URL}

{% gallery layout:flow %}
![banner]({总览信息图URL})
![image]({文章1信息图URL})
![image]({文章2信息图URL})
...
{% endgallery %}
```

格式要点：

- 新的一期内容追加在文件**末尾**，与上一期之间空一行
- 第一张图片的 alt 文本用 `banner`，其余用 `image`
- `{% gallery layout:flow %}` 和 `{% endgallery %}` 标签必须各占一行
- 期号从周刊 URL 或页面内容中提取（如 `#308`、`#309`）
- 原文链接保留周刊的完整 URL

### 更新前检查

在追加之前，先读取文档内容，检查该期号是否已经存在：
- 如果已存在，提示用户"该期已存在，是否覆盖？"，等待确认
- 如果不存在，直接追加

## 错误处理

- **weekly-digest 失败**：如果周刊抓取或解读过程中出现严重错误，停止流程并告知用户
- **图片上传失败**：单张失败不阻塞整体流程，记录失败文件，最终汇报
- **文档更新失败**：如果文件写入失败，将完整的 Markdown 片段输出给用户，让用户手动粘贴

## 完成汇报

所有步骤完成后，向用户汇报：

1. **解读完成**：本期共处理了多少篇文章
2. **上传结果**：成功上传了多少张图片，是否有失败
3. **文档更新**：确认已追加到文档，展示追加的内容片段
4. **预览提示**：提醒用户可以通过 `hexo s` 本地预览效果
