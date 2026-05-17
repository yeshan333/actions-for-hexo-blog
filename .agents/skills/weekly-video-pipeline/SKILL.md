---
name: weekly-video-pipeline
description: 端到端周刊视频生成流水线：抓取周刊 → 逐篇深度阅读 → 提炼核心观点 → 用 HyperFrames 生成多 scene 串联的完整长视频。当用户给你一个周刊链接并希望生成视频解读时使用此 skill。触发词包括"周刊视频"、"生成视频"、"weekly video"、"video digest"、"视频解读"，或者用户丢给你一个周刊链接并提到"做成视频"、"视频化"等意图时也应触发。即使用户只是说"帮我把这期周刊做成视频"，也应该使用此 skill。
---

# Weekly Video Pipeline — 周刊视频解读全流程

将一条周刊链接转化为一个多 scene 串联的完整视频，使用 HyperFrames 框架渲染输出。

## 核心流程

```
周刊 URL
  ↓
Step 1: 抓取周刊目录并分类
  ↓
Step 2: 逐篇深度阅读，提炼核心观点
  ↓
Step 3: 编写旁白脚本（全程中文语音解说）
  ↓
Step 4: 生成 TTS 音频（阿里云 qwen3-tts-flash）
  ↓
Step 5: 设计视频结构（场景规划 + 节奏编排，以旁白时长驱动 scene 时长）
  ↓
Step 6: 编写 HyperFrames HTML 组合（画面 + 音频同步）
  ↓
Step 7: 校验与渲染
  ↓
本地视频文件 ✅
```

## Step 1: 抓取周刊目录并分类

使用 `playwright-url-to-markdown` skill 的 playwright-cli 无头模式抓取周刊页面并转为 markdown。playwright-cli 启动浏览器耗时较长，建议后台运行：

```bash
# 后台抓取周刊页面
nohup node ~/.agents/skills/playwright-url-to-markdown/scripts/index.js <周刊URL> \
  --output weekly-page.md --timeout 90000 > /tmp/pw-fetch.log 2>&1 &

# 轮询检查结果
ls -la weekly-page.md  # 文件存在则抓取完成
```

**备选方案**：如果 playwright-cli 超时或不可用，使用 `web_fetch` 兜底。

从返回的 markdown 内容中解析出所有文章条目。每个条目提取：

- **标题**（原文标题）
- **作者**
- **原文链接**
- **周刊编辑的简介/推荐语**（如果有）
- **所属分类**（如 NEWS、TOOLS 等）
- **条目类型**

### 条目分类规则

| 条目类型 | 识别特征 | 视频处理方式 |
|----------|---------|-------------|
| **深度文章** | 有独立链接、有编辑推荐语 | 独立 scene，详细展示核心观点 |
| **快讯/简报** | "IN BRIEF" 板块、一两句话 | 合并为一个快速滚动 scene |
| **版本发布** | "RELEASES" 板块、版本号 | 合并为一个版本发布集锦 scene |
| **赞助商广告** | sponsor 标记 | 跳过 |
| **外部推荐** | "Elsewhere" 板块 | 合并为延伸阅读 scene |

向用户确认文章清单后开始处理。

## Step 2: 逐篇深度阅读

对每一篇**深度文章**：

1. 使用 `playwright-url-to-markdown` skill 的 playwright-cli 无头模式访问原文，获取全文 markdown。由于逐篇文章串行抓取耗时较长，建议并行后台抓取多篇文章：
   ```bash
   # 并行抓取多篇文章（每篇后台运行）
   for url in "${article_urls[@]}"; do
     nohup node ~/.agents/skills/playwright-url-to-markdown/scripts/index.js "$url" \
       --output "articles/${slug}.md" --timeout 60000 > /dev/null 2>&1 &
   done
   wait  # 等待全部完成
   ```
2. **备选方案**：如果 playwright-cli 超时，使用 `web_fetch` 兜底获取文章内容
3. 如果原文过长，从生成的 markdown 中提取核心段落
4. **链接失败容错**：先 `web_search` 搜索镜像；仍失败则基于周刊简介解读，标注"⚠️ 基于简介解读"

对**版本发布**条目，逐个访问发布页提取版本亮点。

### 每篇文章的提炼结构

```
- 中文标题 + 原文标题
- 一句话核心主张
- 3-5 个核心观点要点
- 1 句关键引用（如果有）
- 适合谁读
```

将所有解读内容保存到 `weekly-video-output/{周刊名}-{期号}/articles/` 目录。

## Step 3: 编写旁白脚本

全视频配中文旁白解说。为每个 scene 编写独立的旁白文本，语音驱动画面节奏 — scene 时长由旁白时长决定，而非反过来。

### 旁白节奏

中文旁白约 **4 个汉字/秒**（自然语速）。留出呼吸间隔 — 句间 0.3-0.5s、段间 0.8-1.0s。旁白总字数应略少于"scene 时长 × 4"，让画面有呼吸空间。

| Scene 类型 | 旁白时长参考 | 字数参考 | 旁白风格 |
|-----------|------------|---------|---------|
| 开场 Title | 3-4s | 12-16字 | 简洁有力，"欢迎来到本期..." |
| 本期概览 | 5-7s | 20-28字 | 概括性预告，点出本期亮点 |
| 深度文章 | 8-12s | 32-48字 | 一句话总结 + 1-2 个核心观点 |
| 版本发布集锦 | 5-7s | 20-28字 | 快速播报各版本亮点 |
| 快讯速览 | 4-5s | 16-20字 | 简短概述 |
| 趋势总结 | 5-7s | 20-28字 | 总结性洞察 |
| 结尾 CTA | 2-3s | 8-12字 | 引导订阅 |

### 旁白文风

- 像人说话，不像念稿 — 用口语化的短句，避免书面语堆砌
- 用缩略和连接词让句子流畅：「那么」「其实」「有意思的是」
- 句子长短交替 — 短句点题、长句展开
- 数字念法写出来：「超过两百万」而非「200万+」
- 英文术语保留原文发音（TTS 会自动处理混合语言）

### 旁白脚本格式

每个 scene 的旁白保存为独立文本文件，命名与 scene 对应：

```
narration/
├── 00-title.txt          # "欢迎收看本期软件测试周刊第三百一十二期解读。"
├── 01-overview.txt       # "本期我们精选了十篇深度文章，涵盖..."
├── 02-article-01.txt     # 第一篇文章的旁白
├── 03-article-02.txt
├── ...
├── N-releases.txt
├── N+1-briefs.txt
├── N+2-trends.txt
└── N+3-outro.txt
```

## Step 4: 生成 TTS 音频

使用阿里云百炼 `qwen3-tts-flash` 模型，将每个 scene 的旁白文本转为语音音频。

### 前提条件

- `DASHSCOPE_API_KEY` 已配置。脚本会自动从 `.baoyu-skills/.env` 加载（向上搜索 3 级目录），也可通过环境变量直接设置
- 已安装 `dashscope` Python SDK：`pip install dashscope`（或 `pip install --break-system-packages dashscope`）

### 调用方式

使用本 skill 自带的 TTS 脚本逐个生成音频：

```bash
python .agents/skills/weekly-video-pipeline/scripts/tts.py \
  narration/00-title.txt \
  --output audio/00-title.wav \
  --voice Cherry \
  --lang Chinese
```

脚本参数说明：
- 第一个参数：旁白文本文件路径（或直接传入文本字符串）
- `--output`：输出音频文件路径
- `--voice`：音色，默认 `Cherry`（芊悦，中文女声）
- `--lang`：语种，默认 `Chinese`

### 批量生成

对 `narration/` 目录下的所有 `.txt` 文件批量生成音频：

```bash
python .agents/skills/weekly-video-pipeline/scripts/tts.py \
  --batch narration/ \
  --output-dir audio/ \
  --voice Cherry \
  --lang Chinese
```

输出到 `audio/` 目录，文件名与输入对应（`00-title.txt` → `00-title.wav`）。

### 获取音频时长

TTS 生成完成后，获取每个音频文件的精确时长（秒），用于 Step 5 中确定各 scene 的 `data-duration`。使用 ffprobe 或 soxi：

```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 audio/00-title.wav
```

将音频时长记录下来，作为视频结构设计的核心输入。

## Step 5: 设计视频结构

这是从"文字解读"到"视频创作"的关键转换步骤。在写任何 HTML 之前，先完成整体结构设计。

**核心原则：旁白时长驱动 scene 时长。** 每个 scene 的 `data-duration` = 对应音频文件的实际时长 + 0.5-1.0s 尾部留白。不要先定时长再凑旁白。

### 视频整体结构

| Scene 类型 | 内容 | 旁白驱动时长 | 节奏 |
|-----------|------|------------|------|
| **开场 Title** | 周刊名 + 期号 + 日期 + 本期主题关键词 | 音频时长 + 1.0s | SLAM |
| **本期概览** | 所有文章标题 + 分类快速呈现 | 音频时长 + 0.5s | fast-build |
| **深度文章 Scene** (×N) | 每篇文章标题 + 核心观点 + 关键数据 | 音频时长 + 0.5s | 各有节奏变化 |
| **版本发布集锦** | 多个版本发布快速展示 | 音频时长 + 0.5s | fast-cascade |
| **快讯速览** | 短条目快速滚动 | 音频时长 + 0.5s | rapid-fire |
| **趋势总结** | 本期关键趋势词 + 编辑洞察 | 音频时长 + 0.5s | hold-resolve |
| **结尾 CTA** | 周刊链接 + 订阅提示 | 音频时长 + 1.0s | fade-out |

### 节奏规划

在实现之前，先声明整体节奏模式。参照 hyperframes 的 beat-direction 原则：

```
SLAM(开场) → build(概览) → hold(文章1) → build(文章2) → PEAK(文章3-高亮)
→ fast(版本发布) → rapid(快讯) → hold(趋势) → resolve(结尾)
```

每个深度文章 scene 之间应有节奏变化：
- **观点/思考类**：沉稳展开，大字标题 + 要点逐条浮入
- **工具/实践类**：活泼节奏，代码片段 + 图标元素
- **数据/趋势类**：数字动画 count-up + 图表化展示

### Per-Beat Direction

为每个 scene 编写导演指令（遵循 hyperframes beat-direction 原则）：

1. **Concept** — 这个 scene 要传达什么体验？
2. **Mood direction** — 设计参考和文化基调
3. **Animation choreography** — 每个元素的动效动词（SLAM / CASCADE / FLOAT / COUNT UP 等）
4. **Transition** — 如何过渡到下一个 scene（CSS transition / shader transition / hard cut）
5. **Depth layers** — 前景/中景/背景各是什么

### 视觉统一

整个视频使用统一的设计系统：
- **背景**：全视频统一深色基底（推荐 dark-premium 调色板），每个 scene 通过装饰元素和强调色区分
- **字体**：标题 700-900 weight + 正文 300-400 weight，serif + sans 搭配
- **强调色**：从周刊主题中提取 1 个主强调色，贯穿全视频
- **分辨率**：1920×1080 横屏

## Step 6: 编写 HyperFrames HTML 组合

严格遵循 `hyperframes` skill 的所有规则编写 HTML 组合。以下是针对周刊视频场景的具体指导。

### 项目初始化

```bash
npx hyperframes init weekly-{周刊名}-{期号}
```

### 组合结构

使用 sub-composition 模式组织多个 scene，音频文件放在 `audio/` 目录：

```
weekly-{name}-{issue}/
├── index.html                    # 根组合，串联所有 scene + 音频轨道
├── audio/                        # TTS 生成的旁白音频
│   ├── 00-title.wav
│   ├── 01-overview.wav
│   ├── 02-article-01.wav
│   └── ...
├── compositions/
│   ├── title-card.html           # 开场标题
│   ├── overview.html             # 本期概览
│   ├── article-01.html           # 深度文章 scene
│   ├── article-02.html
│   ├── ...
│   ├── releases.html             # 版本发布集锦
│   ├── briefs.html               # 快讯速览
│   ├── trends.html               # 趋势总结
│   └── outro.html                # 结尾
```

### 根组合 index.html 结构

视频轨道（track 0）放画面 scene，音频轨道（track 1）放 TTS 旁白。每个音频元素的 `data-start` 和对应画面 scene 保持一致，`data-duration` 使用音频文件的实际时长。

```html
<!doctype html>
<html>
<body>
  <div data-composition-id="root" data-width="1920" data-height="1080">
    <!-- === 视频轨道 (track 0) === -->

    <!-- 开场 -->
    <div id="scene-title" data-composition-id="title-card"
         data-composition-src="compositions/title-card.html"
         data-start="0" data-duration="5" data-track-index="0"></div>

    <!-- 概览 -->
    <div id="scene-overview" data-composition-id="overview"
         data-composition-src="compositions/overview.html"
         data-start="scene-title" data-duration="7" data-track-index="0"></div>

    <!-- 深度文章（串联） -->
    <div id="scene-article-01" data-composition-id="article-01"
         data-composition-src="compositions/article-01.html"
         data-start="scene-overview" data-duration="10" data-track-index="0"></div>

    <!-- ... 更多文章 scene ... -->

    <!-- 版本发布 / 快讯 / 趋势 / 结尾 ... -->

    <!-- === 音频轨道 (track 1) — TTS 旁白 === -->

    <audio id="vo-title" data-start="0"
           data-duration="4.2" data-track-index="1"
           src="audio/00-title.wav" data-volume="1"></audio>

    <audio id="vo-overview" data-start="scene-title"
           data-duration="6.5" data-track-index="1"
           src="audio/01-overview.wav" data-volume="1"></audio>

    <audio id="vo-article-01" data-start="scene-overview"
           data-duration="9.8" data-track-index="1"
           src="audio/02-article-01.wav" data-volume="1"></audio>

    <!-- ... 每个 scene 对应一个 audio 元素 ... -->
  </div>
</body>
</html>
```

**关键规则**：
- 音频的 `data-duration` 使用 ffprobe 获取的实际时长（精确到小数点后 1 位）
- 画面 scene 的 `data-duration` = 对应音频时长 + 0.5~1.0s 尾部留白
- 音频 `data-start` 与对应画面 scene 使用相同的起始引用
- 所有音频放在 `data-track-index="1"`，不要和画面 scene 混用同一 track

### Scene 编写规则

每个 sub-composition scene 必须遵循以下规范（均来自 hyperframes skill 的核心规则）：

#### 1. Layout Before Animation

先写静态 CSS 布局（hero frame），再用 `gsap.from()` 添加入场动画。`.scene-content` 容器必须用 `width: 100%; height: 100%; padding: Npx;` + `display: flex` 填满整个 scene。

#### 2. 视频帧密度

每个 scene 目标 8-10 个视觉元素：
- **背景层**：radial glow / ghost text / geometric shapes（带缓慢 breathing 动画）
- **内容层**：标题、要点卡片、数据指标、引用文本
- **前景层**：分隔线、标签、元数据装饰

#### 3. Scene Transitions（必须遵守）

- **必须**在每两个 scene 之间使用 transition（不允许跳切）
- **必须**为每个 scene 的每个元素添加入场动画（`gsap.from()`）
- **禁止**在非最后一个 scene 中使用退出动画 — transition 就是退出
- **仅最后一个 scene**（结尾）允许 fade out

推荐的 transition 配置：
- 开场 → 概览：**Zoom through**（`scale:1→1.2, blur:20px`）
- 文章之间：**Blur through** 或 **Velocity-matched upward**（交替使用保持节奏变化）
- 版本发布/快讯等集锦 scene：**Whip pan**（快节奏）
- 趋势 → 结尾：**Crossfade**（从容收尾）

#### 4. 动画规范

- 第一帧动画偏移 0.1-0.3s（不要从 t=0 开始）
- 每个 scene 内至少 3 种不同的 ease
- 同一 scene 内不重复入场模式
- 标题 60px+ / 正文 20px+ / 数据标签 16px+
- 数字列使用 `font-variant-numeric: tabular-nums`

#### 5. 深度文章 Scene 模板

每个深度文章 scene 的核心结构：

```
┌─────────────────────────────────────────────┐
│  [分类标签]              [序号 / 总数]        │  ← 顶部元数据栏
│                                             │
│  文 章 标 题                                 │  ← 大号标题，60-80% 宽度
│  Article Original Title                     │  ← 原文标题（小号）
│                                             │
│  ● 核心观点 1                                │  ← 逐条 stagger 入场
│  ● 核心观点 2                                │
│  ● 核心观点 3                                │
│                                             │
│  "关键引用文本..."        — 作者名            │  ← 引用高亮
│                                             │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │  ← 底部分隔线
│  👤 适合谁读：...                            │  ← 底部标签
└─────────────────────────────────────────────┘
```

入场编排示例：
1. 背景装饰 breathing 动画先启动
2. 分类标签从左侧 slide in（0.1s）
3. 标题从底部 SLAM in（0.3s, power3.out）
4. 原文标题 fade in（0.5s）
5. 核心观点逐条 CASCADE（stagger 0.2s, 从 y:30 滑入）
6. 引用文本从右侧 slide in + 引号装饰 scale up（0.8s）
7. 底部元素 fade in（1.0s）

#### 6. Timeline 规范

- 所有 timeline 以 `{ paused: true }` 创建
- 必须注册到 `window.__timelines["<composition-id>"]`
- 不使用 `Math.random()` / `Date.now()`
- 不使用 `repeat: -1`（计算精确重复次数）
- 同步构建 timeline（不在 async / setTimeout 中）

## Step 7: 校验与渲染

### 快速校验（必须通过后才能渲染）

```bash
npx hyperframes lint
npx hyperframes validate
```

### 渲染输出

```bash
npx hyperframes render --output weekly-{周刊名}-{期号}.mp4
```

渲染完成后检查视频文件是否正确生成。

## 工作目录结构

```
weekly-video-output/
├── {周刊名}-{期号}/
│   ├── articles/                       # Step 2 输出：文章解读
│   │   ├── 01-article-name.md
│   │   ├── 02-article-name.md
│   │   ├── briefs-roundup.md
│   │   └── releases-roundup.md
│   ├── narration/                      # Step 3 输出：旁白脚本
│   │   ├── 00-title.txt
│   │   ├── 01-overview.txt
│   │   ├── 02-article-01.txt
│   │   └── ...
│   ├── video/                          # Step 6 输出：HyperFrames 项目
│   │   ├── index.html
│   │   ├── audio/                      # Step 4 输出：TTS 音频
│   │   │   ├── 00-title.wav
│   │   │   ├── 01-overview.wav
│   │   │   └── ...
│   │   ├── compositions/
│   │   │   ├── title-card.html
│   │   │   ├── overview.html
│   │   │   ├── article-01.html
│   │   │   └── ...
│   │   └── weekly-{name}-{issue}.mp4   # Step 7 输出：最终视频
│   └── storyboard.md                   # Step 5 输出：视频结构设计
```

## 注意事项

- **跳过广告**：赞助商条目一律跳过
- **尊重原文**：解读忠实于原文观点
- **中文输出**：视频中所有文字和旁白均使用中文，保留原文标题作为参考
- **访问限制**：付费墙文章基于周刊简介解读
- **视觉多样性**：每个深度文章 scene 应有不同的视觉处理和动画编排，避免千篇一律
- **节奏把控**：全视频应有明确的节奏起伏，旁白时长驱动 scene 时长
- **音画同步**：旁白开始说时，对应的视觉元素应已经入场或正在入场；避免画面静止时旁白还在说
- **TTS 前提**：确保 `DASHSCOPE_API_KEY` 环境变量已配置，否则 TTS 步骤会失败
- **参考 hyperframes skill**：编写 HTML 组合时务必遵循 hyperframes skill 的所有核心规则（Layout Before Animation、Scene Transitions、Animation Guardrails 等）

## 完成汇报

所有步骤完成后，向用户汇报：

1. **解读完成**：本期共处理了多少篇文章
2. **旁白生成**：共生成多少段旁白音频，总时长
3. **视频结构**：总共多少个 scene、总时长
4. **视频输出**：确认视频文件路径和大小
5. **预览提示**：提醒用户可以用 `npx hyperframes preview` 预览，或直接播放 mp4 文件
