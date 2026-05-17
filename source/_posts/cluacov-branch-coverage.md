---
title: 【Draft】cluacov 的分支覆盖率统计：从行级近似到指令级精确
toc: true
comments: true
sticky: 1
popular_posts: true
mathjax: false
top: false
cover: https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777666850700_cover.png
thumbnail: https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777666850700_cover.png
music:
  enable: false
  server: netease
  type: song
  id: 26664345
date: 2026-05-02 03:59:00
tags:
  - Lua
  - LuaCov
  - Code Coverage
  - cluacov
categories: Lua
updated:
excerpt: 深入剖析 cluacov 的两套分支覆盖率方案——基于行级调试钩子的近似实现（兼容 Lua 5.1-5.5 与 LuaJIT），以及基于指令级计数钩子的精确实现（仅 Lua 5.4+），从 Lua 字节码、调试钩子、Proto 元数据生命周期到 GC 安全性设计，完整呈现 Lua 调试接口在不同粒度下的能力边界。
description: 深入剖析 cluacov 的两套分支覆盖率方案——基于行级调试钩子的近似实现与基于指令级计数钩子的精确实现，涵盖 Lua 字节码、调试钩子、Proto 元数据生命周期与 GC 安全设计。
keywords: "lua, luacov, cluacov, 分支覆盖率, branch coverage, lua bytecode, debug hook, pchook, deepbranches"
---

> 五一前几天错峰，闲来无事，在 GPT 5.5 和 Claude Opus 4.7 的帮助下，尝试完善 Lua 生态的测试代码覆盖率统计。重构 cluacov。最终拿到了一份分支覆盖率数据：[https://shansan.top/cluacov/](https://shansan.top/cluacov/)，这数据对应的测试代码为 [https://github.com/yeshan333/cluacov/tree/master/e2e](https://github.com/yeshan333/cluacov/tree/master/e2e)

## 引言

代码覆盖率是衡量测试质量的基础度量之一。行覆盖率（line coverage）回答"这一行是否被执行过"，但它无法回答一个更关键的问题："这个条件分支的两条路径是否都被覆盖了？"

考虑这样的 Lua 代码：

```lua
if a or b or c then
   do_something()
end
```

行覆盖率只能告诉你 `if` 所在行是否被执行。但 `a or b or c` 在编译为字节码时，Lua 编译器会为每个操作数生成一条独立的 `TEST` 指令——总共 3 条，每条都是一个独立的分支决策点（这是 `or` 短路求值的编译实现：若 `a` 为真则直接跳转，否则继续检查 `b`，依此类推）。仅凭行命中数据，无法区分"只有 `a` 为真"和"三个条件都被测试过"这两种情况。

[cluacov](https://github.com/yeshan333/cluacov) 是 [LuaCov](https://github.com/lunarmodules/luacov)（Lua 生态中最主流的代码覆盖率工具，纯 Lua 实现）的 C 扩展，它提供了两套分支覆盖率实现方案：一套基于行级调试钩子的近似方案（兼容 Lua 5.1 到 5.5 及 LuaJIT），一套基于指令级计数钩子的精确方案（仅支持 Lua 5.4+）。两者的设计差异，本质上反映了 Lua 调试接口在不同粒度下的能力边界。

![cluacov 架构对比：行级方案 vs 指令级方案](https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777718191373_01-architecture-comparison.png)

## Lua 背景知识

本节为不熟悉 Lua 内部机制的读者提供必要的背景。如果你已经了解 Lua 的编译模型和 C API，可以直接跳到"快速上手"。

### 编译与执行模型

Lua 是一门解释执行的语言。源代码首先被编译为**字节码**（bytecode），然后由一个基于寄存器的虚拟机（VM）逐条解释执行。这类似于 Python 的 `.pyc` 或 Java 的 `.class`，但 Lua 的 VM 使用寄存器而非操作数栈。

每个 Lua 函数编译后在 VM 内部对应一个 C 结构体 **`Proto`**（prototype），它存储了函数运行所需的全部静态信息：

| Proto 字段 | 含义 |
|-----------|------|
| `code[]` | 字节码指令数组，VM 实际执行的内容 |
| `lineinfo[]` | 每条指令对应的源码行号（用于调试和错误报告） |
| `source` | 源文件名字符串，如 `"@test.lua"` |
| `linedefined` | 函数定义的起始行号 |
| `sizecode` | 字节码总条数 |
| `p[]` | 嵌套子函数的 Proto 指针数组 |
| `k[]` | 常量表（字符串、数字等字面量） |

一个 Lua 文件加载后，最外层是一个 Proto，文件中定义的每个 `function` 又是一个子 Proto（通过 `p[]` 嵌套）。`loadfile("foo.lua")` 编译文件并返回最外层 Proto 对应的闭包（closure）。cluacov 的分支分析就是通过读取 `Proto.code[]` 来扫描字节码中的分支指令。

### 调试钩子

Lua 提供了 C 级别的**调试钩子**（debug hook）API，允许在特定事件发生时调用用户提供的 C 回调函数：

```c
lua_sethook(L, callback, mask, count);
```

`mask` 参数控制触发条件：

| 掩码 | 触发时机 |
|------|---------|
| `LUA_MASKCALL` | 每次函数调用时 |
| `LUA_MASKRET` | 每次函数返回时 |
| `LUA_MASKLINE` | 每次执行到新的源码行时 |
| `LUA_MASKCOUNT` | 每执行 `count` 条指令时 |

覆盖率工具正是利用这些钩子来拦截程序执行并记录命中数据。行覆盖率使用 `LUA_MASKLINE`，而 cluacov 的指令级方案巧妙地将 `LUA_MASKCOUNT` 的 `count` 设为 1，实现每条指令触发。

### Lua C API 基础

Lua 和 C 之间通过一个**虚拟栈**通信。C 代码不直接操作 Lua 对象，而是通过 `lua_push*` 压入值、`lua_to*` 读取值、`lua_rawgeti`/`lua_rawseti` 访问表元素等 API 间接操作。本文代码中出现的几个关键概念：

- **`lua_State`**：Lua 执行上下文（线程），所有 API 调用的第一个参数
- **`CallInfo`**：VM 调用栈中的一帧，保存了当前函数的执行状态（包括 `savedpc`——下一条要执行的指令地址）
- **Registry**：一个只有 C 代码能访问的全局 Lua 表，用于存储不想暴露给 Lua 层的私有数据。cluacov 用 Registry 存储 per-Proto 的命中计数表

### GC 与 `__gc` 终结器

Lua 使用自动垃圾回收（mark-and-sweep）。当一个对象不再被引用时，GC 会回收它的内存。Lua 支持 **`__gc` 元方法**（终结器/finalizer）：在对象被回收前调用，用于清理资源。

关键问题：当 Lua 解释器关闭时（`lua_close`），所有对象在 `luaC_freeallobjects` 阶段被释放，终结器在此阶段触发。**对象的释放顺序不可预测**——当终结器 A 执行时，终结器 A 依赖的对象 B 可能已经被释放了。这正是 cluacov 需要"写时快照"设计的原因：在 Proto 还活着的时候提前把数据拷出来。

### Lua 版本生态

Lua 主线（PUC-Rio）有多个主要版本，内部结构在版本间有显著变化：

| 版本 | 特点 |
|------|------|
| Lua 5.1（2006） | 最广泛部署的版本，LuaJIT 兼容此版本 |
| Lua 5.2（2011） | 引入 `goto`、移除 `setfenv` |
| Lua 5.3（2015） | 原生整数类型、位运算 |
| Lua 5.4（2020） | 泛型 `for` 改进、`CallInfo` 布局重构 |
| Lua 5.5（2025） | 全局变量声明、增量式主 GC、只读循环变量 |
| LuaJIT 2.1 | 高性能 JIT 编译器，API 兼容 5.1 |

Proto 结构、`CallInfo` 布局、操作码编码在这些版本间都有差异。cluacov 需要针对每个版本做适配——这也是为什么代码中有大量条件编译和 vendor 头文件。

## 快速上手

### 指令级覆盖率（推荐，Lua 5.4+）

最简单的使用方式是通过 `cluacov.runner`，它封装了完整的采集和报告生成流程：

```sh
lua -lcluacov.runner your_program.lua
```

程序退出后，当前目录下会生成两个文件：

- `luacov.stats.out` — LuaCov 兼容的行命中数据
- `lcov.info` — 包含行覆盖率和分支覆盖率的 LCOV 报告

使用 `genhtml` 生成 HTML 报告：

```sh
genhtml lcov.info --output-directory html --branch-coverage
```

如果需要手动控制采集生命周期（`loadfile` 编译 Lua 文件并返回一个可调用的函数对象）：

```lua
local pchook = require("cluacov.pchook")
local branchcov = require("cluacov.branchcov")

pchook.start()

-- 加载并执行被测代码
local func = loadfile("module_under_test.lua")
local mod = func()
mod.run_tests()

pchook.stop()

-- 分析分支覆盖率
local result = branchcov.analyze(func)
for _, branch in ipairs(result.branches) do
   print(string.format("Line %d [%s]: %s",
      branch.line, branch.kind, branch.status))
end
```

### 行级覆盖率（Lua 5.1-5.3 / LuaJIT）

在不支持指令级钩子的环境下，使用传统的 LuaCov 行命中数据配合 `deepbranches` 静态分析：

```sh
lua -lluacov your_program.lua
```

然后用 `deepbranches.get(func)` 发现分支站点，与行命中数据交叉比对来估算分支覆盖率。由于行级钩子的粒度限制，需要经过 `branchfilter.lua` 过滤无法区分的同行分支。

## 核心概念：分支站点的静态发现

无论使用哪套方案，分支覆盖率的第一步都相同：通过 `deepbranches.get(func)` 静态分析字节码，找出函数中所有的分支站点。

`deepbranches.get` 接受一个 Lua 函数，遍历其 `Proto` 结构中的字节码数组，识别四类分支指令：

| 类型 | 字节码 | 源码对应 |
|------|--------|---------|
| `test` | `OP_TEST`, `OP_TESTSET`, `OP_EQ`, `OP_LT` 等 | `if`、`elseif`、`and`、`or`、比较运算 |
| `loop` | `OP_FORLOOP` | 数值 `for` 循环的继续/退出 |
| `loop-entry` | `OP_FORPREP`（仅 Lua 5.4+） | 数值 `for` 循环的初始进入 |
| `iterator` | `OP_TFORLOOP` | 泛型 `for` 迭代器的耗尽判断 |

每个分支站点恰好有两个目标——两条可能的执行路径。目标按 PC（程序计数器）升序排列，不按语义方向（"真/假"）排列。

```lua
local deepbranches = require("cluacov.deepbranches")

local function example(x)
   if x > 0 then
      return "positive"
   else
      return "non-positive"
   end
end

local branches = deepbranches.get(example)
-- branches[1] = {
--    line = 2,           -- "if x > 0" 所在行
--    pc = 2,             -- 分支指令的 PC（1-based）
--    kind = "test",
--    linedefined = 1,    -- 函数定义起始行
--    sizecode = ...,     -- Proto 的字节码长度
--    targets = {
--       { line = 3, pc = 4 },  -- 路径 A
--       { line = 5, pc = 6 },  -- 路径 B
--    }
-- }
```

`deepbranches.get` 会递归遍历嵌套函数的 Proto 链（`proto->p[]`），一次调用即可获取整个文件中所有函数的分支站点。

## 行级方案（旧架构）的实现

### 工作原理

旧架构的数据采集依赖 Lua 的 `LUA_MASKLINE` 调试钩子。`hook.c` 中的 `l_debug_hook` 在每行代码执行时被调用，记录 `data[filename][line_nr]` 的命中次数。这是标准的 LuaCov 行覆盖率采集机制，cluacov 的 `hook.c` 只是将其从 Lua 实现改为 C 实现以提升性能。

采集完成后，分支覆盖率的计算逻辑如下：

1. `deepbranches.get(func)` 静态发现所有分支站点及其两个目标的行号
2. 检查每个目标行是否有命中数据（`line_hits[target.line] > 0`）
3. 两个目标都命中 → covered；一个命中 → partial；都未命中 → uncovered

### 行级粒度的根本限制

问题出在第 2 步：行命中数据的粒度是"行"，而非"指令"。当同一行包含多条分支指令时，它们共享同一个命中计数。

以 `if a or b or c then` 为例，Lua 编译器会生成 3 条 `TEST` 指令，都对应同一行源码。假设 `a` 为真，程序直接跳入 `then` 体。此时第 2、第 3 条 `TEST` 根本未执行，但行命中数据显示 `if` 所在行被命中了——3 条 `TEST` 的命中状态无法区分。

![if a or b or c then 的字节码流与分支可见性对比](https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777718196476_02-or-bytecode-flow.png)

这不是 cluacov 的设计缺陷，而是 Lua 调试接口的能力边界：`LUA_MASKLINE` 钩子按行触发，Lua 官方不提供指令级的回调机制。C/gcov 之所以能做到精确的分支覆盖率，是因为编译器在编译期就插入了弧计数器（arc counters），每条分支指令有独立的计数。Lua 的调试钩子没有这个能力。

### branchfilter：过滤不可区分的分支

既然同行多分支不可区分，旧架构就需要把这些分支过滤掉，避免产生误导性的报告。`branchfilter.lua` 的过滤规则：

对于同一行上有多个分支站点的情况，只保留**两个目标行都不在本行**的分支。同时，对目标行对相同的分支做去重。

这条规则有明确的语义基础。以 `if a and b` 为例，编译为两条 `TEST`：第一条的两个目标中，一个指向本行的第二条 TEST（短路跳转），另一个也在本行（顺序执行）；只有最后一条 `TEST` 的两个目标分别指向 `then` 体和 `else` 体（都不在本行），因此只有它被保留。这保证了保留下来的分支是可以通过行命中数据真正区分的。

以下为核心逻辑的简化版（省略了跳过计数 `skipped`）：

```lua
function M.filter(branches)
   local line_counts = {}
   for _, branch in ipairs(branches) do
      line_counts[branch.line] = (line_counts[branch.line] or 0) + 1
   end

   local result = {}
   local seen_target_pairs = {}

   for _, branch in ipairs(branches) do
      if line_counts[branch.line] == 1 then
         result[#result + 1] = branch  -- 该行只有一个分支，直接保留
      else
         local t1 = branch.targets[1].line
         local t2 = branch.targets[2].line
         if t1 ~= branch.line and t2 ~= branch.line then
            local key = branch.line .. ":" .. t1 .. ":" .. t2
            if not seen_target_pairs[key] then
               seen_target_pairs[key] = true
               result[#result + 1] = branch
            end
         end
      end
   end

   return result
end
```

过滤后的分支数量通常远少于原始分支数量。对于 `if a or b or c then`，3 条 `TEST` 只保留 1 条；对于 `for i = 1, n`，`FORPREP` 和 `FORLOOP` 的目标行对相同，去重后只保留 1 条。

## 指令级方案（新架构）的实现

### 核心设计：每条指令一次回调

新架构的核心突破在于使用 `LUA_MASKCOUNT` 计数钩子（`count=1`），使得 C 回调在**每条字节码指令执行时**触发。这不是 Lua 标准调试 API 中的"指令钩子"（Lua 并未提供 `LUA_MASKPC`），而是利用计数钩子的一种技巧：将计数间隔设为 1，效果上等同于每条指令触发。

`pchook.c` 中的 `l_start` 函数注册钩子（若传入 tick 配置则额外注册 `LUA_MASKLINE` 用于定期保存）：

```c
lua_sethook(L, pc_hook, LUA_MASKCOUNT, 1);  // 基础模式
// 或: LUA_MASKCOUNT | LUA_MASKLINE  (tick 模式, 定期触发 save_stats)
```

钩子回调 `pc_hook` 在每次触发时读取当前函数的 Proto 指针和程序计数器（PC），然后在一个 Lua 表中递增该 PC 的命中计数。以下仅展示 count 事件的核心处理逻辑（省略了 tick 模式下的 `LUA_HOOKLINE` 事件处理）：

```c
static void pc_hook(lua_State *L, lua_Debug *ar) {
    Proto *proto;
    CallInfo *ci;
    int pc;

    lua_getinfo(L, "f", ar);
    if (lua_iscfunction(L, -1)) { lua_pop(L, 1); return; }

    proto = get_proto(L, -1);
    lua_pop(L, 1);

    ci = (CallInfo *)ar->i_ci;
    pc = (int)(ci->u.l.savedpc - proto->code);

    // 获取或创建该 Proto 的 hits 表
    if (push_hits_for_proto(L, proto) != 0) return;

    // hits[pc] += 1
    lua_rawgeti(L, -1, pc);
    lua_Integer count = lua_tointeger(L, -1) + 1;
    lua_pop(L, 1);
    lua_pushinteger(L, count);
    lua_rawseti(L, -2, pc);
    lua_pop(L, 1);
}
```

关键的技术细节在于 PC 的获取方式：通过 `ar->i_ci`（`CallInfo` 指针）访问 `ci->u.l.savedpc`，它是 Lua 5.4 的 `CallInfo` 结构中保存的**下一条待执行指令的地址**。按照 Lua 解释器的惯例（`luaG_traceexec` 中先执行 `pc++; ci->u.l.savedpc = pc;` 再调用钩子），`savedpc` 始终指向下一条指令而非刚刚执行的指令。因此 `savedpc - proto->code` 得到的是"next-instruction PC"，而非当前指令的偏移量。这个内部结构在 Lua 5.4 之前的版本中有不同的布局，所以 `pchook` 仅支持 Lua 5.4+。

这个惯例产生了一个重要的双层契约：

| 层 | hits[pc] 的含义 | 是否需要校正 |
|---|---|---|
| **存储层**（`pc_hook`） | "savedpc 指向此处时计数钩子触发" | 否——直接存储 |
| **分支读取层**（`branchcov.lua`） | 与 `target.pc`（跳转目标 PC）直接兼容 | 否——target.pc 也是 next-instruction PC |
| **行聚合层**（`collect_line_hits_recursive`） | 需要回退到实际执行指令的行号 | **需要 `pc - 1`** |

行聚合层的 `pc - 1` 校正对应 Lua 源码中的 `pcRel` 宏（`src/ldebug.h`）：

```c
#define pcRel(pc, p)  (cast_int((pc) - (p)->code) - 1)
```

如果省略这个校正，每个函数体的第一条可执行语句（如 `local t = obj.field`）会显示 hits = 0，后续行会被错误地多计。这是因为 PC 0 永远不会作为 hits 表键出现（没有"上一条指令"能产生 `savedpc == 0`），而每条指令的命中被归因到了下一条指令的行号。

### Proto 元数据的写时快照：GC 安全性设计

`pchook.c` 最精妙的设计在于它如何处理 `Proto*` 指针的生命周期问题。

`cluacov.runner` 使用 GC finalizer（`__gc`，参见前文"GC 与 `__gc` 终结器"）来确保程序退出时自动保存覆盖率数据。但 `__gc` 在 `luaC_freeallobjects` 阶段触发，此时 Proto 对象可能已被释放。如果报告生成函数试图读取 `proto->source` 或 `proto->lineinfo`，就是一次 use-after-free，直接导致 SIGSEGV。

解决方案是**写时快照**（snapshot on first write）：在钩子第一次遇到某个 Proto 时，立即将所有后续需要的元数据复制到纯 Lua 表中，此后再也不需要访问 Proto 指针。

![pchook.c 数据生命周期：Proto 写时快照与 GC 安全](https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777718199933_03-pchook-lifecycle.png)

以下代码经过轻微简化以突出核心逻辑（源码中的变量声明和 NULL 判断略有展开）：

```c
static void materialize_proto_entry(lua_State *L, const Proto *proto) {
    lua_createtable(L, 0, 5);

    // 复制 source 字符串（Lua 管理的副本）
    const char *source = get_source_name(proto);
    lua_pushstring(L, source ? source : "?");
    lua_setfield(L, -2, "source");

    lua_pushinteger(L, proto->linedefined);
    lua_setfield(L, -2, "linedefined");

    lua_pushinteger(L, proto->sizecode);
    lua_setfield(L, -2, "sizecode");

    // 预计算 PC -> 行号的映射（Proto 此时保证存活）
    lua_createtable(L, proto->sizecode, 0);
    for (int pc = 0; pc < proto->sizecode; pc++) {
        int line = get_pc_line(proto, pc);
        if (line > 0) {
            lua_pushinteger(L, line);
            lua_rawseti(L, -2, pc);
        }
    }
    lua_setfield(L, -2, "lines");

    lua_createtable(L, 0, 0);
    lua_setfield(L, -2, "hits");
}
```

Registry 中的数据布局：

```
PCHOOK_KEY[entry_id] = {
    source      = "string",     -- Lua 字符串，GC 安全
    linedefined = integer,
    sizecode    = integer,
    lines       = { [pc] = line, ... },  -- 0-based PC 键
    hits        = { [pc] = count, ... }, -- 由钩子更新
}

PROTO_INDEX_KEY[Proto*] = entry_id   -- 仅钩子存活期有效
```

`PROTO_INDEX_KEY` 是唯一持有 `Proto*` 的结构。`l_stop` 在关闭钩子后立即预构建两种聚合快照——`SNAPSHOT_ALL_HITS_KEY`（per-PC 命中，供 `branchcov.lua` 使用）和 `SNAPSHOT_LINE_HITS_KEY`（per-line 命中，供 `runner.lua` 生成 `luacov.stats.out` 使用），将聚合结果缓存；后续从 `__gc` 中调用 `get_all_hits` 或 `get_all_line_hits` 时直接返回缓存，无需再碰 Proto。这意味着 pchook 现在同时输出 PC 级数据（用于分支覆盖率）和行级数据（用于行覆盖率），一次采集兼顾两种粒度。

### branchcov：指令级分支覆盖率分析

有了 per-PC 命中数据，`branchcov.lua` 的分析逻辑非常直接：

```lua
function M.analyze(func)
   local branches = deepbranches.get(func)
   local all_hits = pchook.get_hits(func)

   -- 按 linedefined:sizecode 索引命中表
   local hits_by_func = {}
   for _, entry in ipairs(all_hits) do
      hits_by_func[entry.linedefined .. ":" .. entry.sizecode] = entry.hits
   end

   local result_branches = {}
   local total, hit = 0, 0

   for _, branch in ipairs(branches) do
      local proto_hits = hits_by_func[branch.linedefined .. ":" .. branch.sizecode] or {}
      local targets = {}
      local targets_hit = 0

      for _, target in ipairs(branch.targets) do
         local target_hits = proto_hits[target.pc] or 0
         targets[#targets + 1] = { pc = target.pc, line = target.line, hits = target_hits }
         total = total + 1
         if target_hits > 0 then hit = hit + 1; targets_hit = targets_hit + 1 end
      end

      local status = (targets_hit == #targets) and "covered"
                  or (targets_hit > 0) and "partial"
                  or "uncovered"
      result_branches[#result_branches + 1] = {
         line = branch.line, pc = branch.pc, kind = branch.kind,
         linedefined = branch.linedefined, targets = targets, status = status,
      }
   end

   return { branches = result_branches, total = total, hit = hit }
end
```

Proto 的标识使用 `linedefined:sizecode` 组合键，而非 Proto 指针，这与写时快照的设计一致。每个分支的每个目标都有独立的命中计数，`if a or b or c then` 的 3 条 TEST 指令各自产生 2 个目标，总共 6 个分支目标，每个都可以独立判断是否被执行。

因此，指令级方案**不需要 branchfilter**。

## 行为细节与常见误区

### 目标 PC 的排序不代表语义方向

`deepbranches.get` 返回的 `targets[1]` 和 `targets[2]` 按 PC 升序排列，不是 `targets[1]` = true 分支、`targets[2]` = false 分支。这是一个稳定的排序规则，但如果你试图根据索引判断"哪个是 true 路径"，结果会出错。覆盖率分析不需要知道语义方向，只需要知道"两条路径是否都被执行过"。

### 共享目标 PC 的语义

多条分支指令可能共享同一个目标 PC。`if a or b or c then do_something() end` 中，3 条 `TEST` 的 true 目标都指向 `do_something()` 的第一条指令。当 `a` 为真时，该目标 PC 被执行，但只有第一条 `TEST` 的 true 路径真正被"走过"。然而 per-PC 数据只能说明"该 PC 是否被执行过"（指令覆盖率），不能说明"是从哪条分支到达的"（边覆盖率）。这是指令级方案的一个已知近似——在绝大多数实际场景中，这个近似足够准确。

### `get_hits` 要求同一函数对象

`pchook.get_hits(func)` 中的 `func` 必须是在 `pchook.start()` 活跃期间**实际执行过**的那个函数对象。钩子通过 `Proto*` 指针标识函数。如果你用 `loadfile` 重新加载同一个文件，得到的是一个新的 Proto 对象，与钩子记录的不匹配，`get_hits` 会返回空数据。

### Lua 5.4 的行号编码

Lua 5.4 对调试信息的行号编码做了重大改变：从 5.3 及之前版本的 `lineinfo[pc]` 直接映射，变成了 `abslineinfo` 基线索引表 + `lineinfo[pc]` 增量编码的两级结构。这是为了压缩大函数的调试信息体积（增量编码的每个条目只需 1 字节，而绝对行号需要 4 字节）。`deepbranches.c` 和 `pchook.c` 中都需要实现 `getbaseline` + 增量累加来还原行号：

```c
static int luaG_getfuncline(const Proto *f, int pc) {
    if (f->lineinfo == NULL) return -1;
    int basepc;
    int baseline = getbaseline(f, pc, &basepc);
    while (basepc++ < pc) {
        baseline += f->lineinfo[basepc];
    }
    return baseline;
}
```

### savedpc off-by-one：一个容易误修的陷阱

`pchook.c` 中 `collect_line_hits_recursive` 的行号映射代码包含一个 `pc - 1`：

```c
if (pc <= 0) continue;
line = get_pc_line(proto, pc - 1);
```

这个 `-1` 不是数组基数转换（0-based vs 1-based），而是 Lua 解释器惯例的校正——将 next-instruction PC 回退到实际执行的指令。这个区别曾被误读为"多余的偏移"并被移除（commit `fc9499f`），导致每个函数体的第一条可执行语句在 LCOV 报告中显示 `DA:<line>,0`（尽管该行实际被执行了多次），后续在 commit `5050dd0` 中修复。教训是：PC 值旁边的 `-1` 几乎从来不是基数转换，而是解释器惯例调整。Lua 自身的 `pcRel` 宏是权威参考。

### 为什么有些 `end` 行有命中次数，有些却留空

阅读 HTML 覆盖率报告时经常遇到的困惑：

```
   11 :   1 : end           ← 函数 end：    可执行，命中 1 次
   33 :     :    end        ← 简单 for end：不可执行（留空）
   42 :   1 :    end        ← 带 break 的 for end：可执行，命中 1 次
   25 :     :    end        ← if 块的 end：  不可执行（留空）
```

这**不是 cluacov 的 bug**。一行源码会被标记为"可执行"，当且仅当 Lua 编译器**确实为这一行发射了至少一条字节码指令**（该指令的 `lineinfo` 指回这一行）。`end` 关键字本身不是语句，它能否进入行表完全取决于编译器是否有控制流或清理指令需要锚定到该行：

| `end` 的位置 | 锚定的字节码 | 是否可执行 |
|-------------|------------|:---------:|
| 函数体的 `end` | `OP_RETURN0`（隐式 `return nil`） | 总是 |
| `if`/`elseif`/`else` 的 `end` | 无（控制流已由 `OP_JMP` 处理） | 永不 |
| `do ... end` 的 `end` | 无 | 永不 |
| `repeat` 的 `until` 行 | 条件测试 + 回跳 `OP_JMP` | 总是 |
| `for` 循环 `end`（简单，无闭包捕获） | 无（`OP_FORLOOP` 绑到 `for` 行） | 否 |
| `for` 循环 `end`（带 `break` + 需 close 的局部变量） | `OP_TFORLOOP`（5.5 把它绑到 `end` 行） | 是 |
| `for` 循环 `end`（循环体捕获循环变量的闭包） | `OP_CLOSE`（关闭 upvalue） | 是 |
| `while` 循环 `end`（简单） | 无（回跳绑到循环体最后一行） | 否 |
| `while` 循环 `end`（需要关闭闭包） | `OP_CLOSE` | 是 |

直觉理解：函数 `end` 对应真实的运行时动作（RETURN）；`if-end` 和 `do-end` 是纯语法标记；循环 `end` 是条件性的——只有当编译器在作用域退出时**确实有事可做**（关闭 upvalue），才会有指令绑到这一行。可以用 `luac -l -p file.lua` 反汇编验证。

## 内部实现机制

### deepbranches.c 的字节码遍历

![deepbranches.c 字节码分支发现流程](https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777718202180_04-deepbranches-scan.png)

`deepbranches.c` 的核心是一个线性扫描：遍历 `proto->code[0..sizecode-1]`，对每条指令检查操作码是否属于分支指令类型。

对于 `test` 类分支，识别模式在所有版本中保持一致："TEST 指令 + 紧跟的 JMP 指令"。TEST 本身不跳转，它设置跳转条件，紧随的 JMP 执行实际跳转。两个目标分别是 `pc+2`（不跳转，跳过 JMP）和 JMP 的目标地址。Lua 5.4 改变了 TEST 指令的参数编码方式（条件标志从 C 参数改为 k 参数），但 TEST+JMP 双指令模式不变。`deepbranches.c` 统一使用检查 `is_test_opcode` 后是否紧跟 `OP_JMP` 的方式来检测所有 test 类分支（包括 `OP_TEST`、`OP_TESTSET`、`OP_EQ`、`OP_LT` 等），适用于 Lua 5.1 到 5.5 全版本。

对于循环分支，各版本的处理差异较大：

- Lua 5.4+：`OP_FORPREP` 变成了条件指令（判断初始条件是否满足），产生 `loop-entry` 类型分支；`OP_FORLOOP` 使用 `Bx` 参数编码回跳偏移
- Lua 5.1-5.3：`OP_FORLOOP` 使用 `sBx` 参数编码回跳偏移
- Lua 5.1：`OP_TFORLOOP` 后跟 `OP_JMP`；Lua 5.2+：`OP_TFORLOOP` 自带 `sBx` 跳转

这些差异通过条件编译处理，这也是 `deepbranches.c` 需要 vendor 各版本 Lua 的 `lobject.h` 和 `lopcodes.h` 头文件的原因。

### pchook.c 的两阶段聚合

为了在高频回调场景下保持性能，`pchook.c` 采用了两阶段设计：

**Phase 1（l_stop 时）**：钩子停止后立即遍历 `PCHOOK_KEY` 的所有条目，预构建两种聚合表：`SNAPSHOT_ALL_HITS_KEY`（per-source 的 per-PC 命中数据，供 `branchcov.lua` 分支分析）和 `SNAPSHOT_LINE_HITS_KEY`（per-source 的 per-line 命中数据，供 runner 输出 `luacov.stats.out`）。这是一次 O(N) 的操作（N = 所有 Proto 的总指令数），但只执行一次。行级聚合中，每个 hits 表键（next-instruction PC）会通过 `pc - 1` 校正后映射到实际执行指令的源码行号。

**Phase 2（l_get_all_* 时）**：检查对应的 `SNAPSHOT_*_KEY` 是否已有缓存。有则直接返回（O(1)）；无则实时计算。缓存路径专为 GC finalizer 设计——此时钩子已停止，数据不会再变化，缓存是安全的。

聚合函数全程使用**绝对栈索引**（Lua C API 通过虚拟栈与 C 代码通信，栈索引可以是从栈底计数的正数"绝对索引"，或从栈顶计数的负数"相对索引"）：

```c
static void aggregate_all_hits(lua_State *L, int result_idx) {
    lua_rawgetp(L, LUA_REGISTRYINDEX, &PCHOOK_KEY);
    int pchook_idx = lua_gettop(L);     // 绝对索引

    int n = (int)lua_rawlen(L, pchook_idx);
    for (int i = 1; i <= n; i++) {
        lua_rawgeti(L, pchook_idx, i);  // 用绝对索引安全访问
        int entry_idx = lua_gettop(L);
        // ... 内部有多次 push/pop，但 pchook_idx 和 entry_idx 始终有效
    }
}
```

在涉及多层栈操作的 C/Lua 胶水代码中，相对索引（如 `-3`）在 push/pop 后会失效，而绝对索引不会。这是一个在实际开发中容易犯错的点——`pchook.c` 的第一版重写就因为相对索引导致了崩溃。

### 钩子快速路径的摊还代价

`push_hits_for_proto` 在首次遇到某个 Proto 时执行快照（O(sizecode)），后续访问只需通过 `PROTO_INDEX_KEY` 查找 entry_id 再读取 hits 表（O(1)）。由于每个 Proto 只快照一次，整个采集过程的快照总代价是 O(S)（S = 所有 Proto 的字节码总长度），而钩子本身的每次调用是 O(1)。在程序执行数百万条指令的典型场景中，快照代价被充分摊还。

## 性能与特性分析

### 性能代价

指令级钩子在**每条 VM 指令**上触发 C 回调，事件量是行级钩子的 3-7 倍。直觉上这应该更慢，但[实际基准测试](https://github.com/yeshan333/cluacov/blob/master/docs/benchmark.md)显示两者的性能差距取决于硬件和工作负载。在三台不同机器上的几何均值减速因子：

| 机器 | cluacov C 钩子 | pchook | 总体胜者 |
|------|---------------|--------|---------|
| [Xeon 8269CY（Linux CI）](https://github.com/yeshan333/cluacov/blob/master/docs/benchmark.md) | 28.1x | 36.1x | cluacov C 钩子（快 1.28 倍） |
| [Xeon 8369B（Linux）](https://github.com/yeshan333/cluacov/blob/master/docs/benchmark-linux-8369b.md) | 36.9x | 49.6x | cluacov C 钩子（快 1.34 倍） |
| [Apple M4 Pro（macOS）](https://github.com/yeshan333/cluacov/blob/master/docs/benchmark-macos.md) | 43.3x | 54.0x | cluacov C 钩子（快 1.25 倍） |

cluacov C 钩子在所有测试机器上总体胜出（几何均值快 1.25-1.34 倍），两者性能处于同一量级。纯 Lua 的 luacov 钩子开销最大（231-299x）。

关键在于 per-call 成本与事件量的权衡。cluacov C 行级钩子每次回调需要调用 `lua_getstack` + `lua_getinfo(L, "S", ...)` 来解析源文件名，单次成本约 **400 ns**。而 pchook 只调用轻量的 `lua_getinfo(L, "f", ar)` 获取函数值，然后直接从 `CallInfo.u.l.savedpc` 读取 next-instruction PC（一次指针减法），通过预建的整数索引查找元数据，跳过了昂贵的源文件解析，单次成本仅约 **100-130 ns**。但 pchook 的事件量是行级钩子的 3-7 倍，在所有测试机器上（包括 Xeon 8269CY、Xeon 8369B 和 M4 Pro），pchook 更高的事件量在几何均值层面都抵消了其 per-call 优势。pchook 仅在紧密循环工作负载上胜出（指令/行比率低，约 3:1），而 cluacov C 钩子在递归和函数调用密集的代码上一致胜出（指令/行比率 3.5-7:1）。

### 内存开销

per-PC 模式需要为每个 Proto 的每条被执行指令维护一个 Lua 整数。对于一个 1000 行的 Lua 文件（假设编译为约 3000 条指令），额外的内存开销大约在几十 KB 量级。快照后的元数据（source 字符串、lines 表）也会占用额外空间，但因为是 Lua GC 管理的，不需要手动释放。

### 准确性的 trade-off

行级方案的准确性受限于过滤规则。过滤会丢弃同行的短路分支，导致报告中的分支总数少于实际分支数。对于 `if a or b or c then`，行级方案只报告 1 个分支（2 个目标），而指令级方案报告 3 个分支（6 个目标）。

指令级方案虽然更精确，但仍然是**指令覆盖率**而非**边覆盖率**——它知道某个 PC 是否被执行过，但不知道执行时是从哪条分支跳转过来的。在实际工程中，这个区别很少造成误判。

## 两套方案的对比

| 维度 | 行级方案（hook.c） | 指令级方案（pchook.c） |
|------|-------------------|----------------------|
| Lua 版本 | 5.1-5.5, LuaJIT | 仅 5.4+ |
| 钩子类型 | `LUA_MASKLINE` | `LUA_MASKCOUNT`（count=1）；tick 模式下额外注册 `LUA_MASKLINE` |
| 数据粒度 | 行 | 字节码指令（PC）+ 行级聚合（双输出） |
| 复合条件 | 不可区分（`if a or b or c` = 1 个分支） | 独立计数（= 3 个分支） |
| 是否需要过滤 | 需要（branchfilter） | 不需要 |
| 性能开销 | 28-43x 几何均值（换行触发，~400 ns/call） | 36-54x 几何均值（每条指令触发，~100 ns/call）；总体较慢但功能更强 |
| GC 安全性 | 历史上有 use-after-free 问题 | 通过写时快照设计解决 |
| 输出格式 | 需手动生成 LCOV | runner 自动生成 |
| 代码量 | ~540 行 C（hook.c + deepbranches.c） | ~940 行 C + Lua（pchook.c 868 行 + branchcov.lua 68 行；deepbranches.c 共用） |

行级方案适合 Lua 5.1-5.3 或 LuaJIT 环境，或只需粗粒度覆盖率的场景。指令级方案适合 Lua 5.4+ 环境且需要精确分支覆盖率的场景，如安全关键系统的测试验证或 CI/CD 流水线中的覆盖率质量门禁。多平台基准测试表明 cluacov C 钩子在所有测试机器上的几何均值都快于 pchook（1.25-1.34 倍），但两者仍处于同一量级，因此方案选择应以功能需求为主导。

## 与相关技术的对比

### 与 LuaCov 原生方案的区别

LuaCov 本身只做行覆盖率。它没有分支分析能力，也不会输出 `BRDA` 记录。cluacov 的 `deepbranches` 和 `pchook` 是在 LuaCov 的行命中数据之上的增量能力。`cluacov.runner` 在输出 `luacov.stats.out`（LuaCov 兼容）的同时，额外输出 `lcov.info`（包含分支记录）。

### 与 C/gcov 的分支覆盖率对比

gcov 的分支覆盖率是编译器级别的精确实现：GCC 在编译期为每条分支指令插入弧计数器，运行时直接递增硬件级计数器，开销极低。gcov 提供的是真正的**边覆盖率**（edge coverage）——不仅知道某个基本块是否被执行，还知道从哪个前驱块到达。

cluacov 在 Lua 层面没有这个条件。Lua 是解释执行的，没有编译期插桩的机会。指令级钩子是运行时拦截，每次触发都有函数调用和表操作的代价。即便如此，cluacov 在 Lua 生态中已经是分支覆盖率能力最强的方案。

## 使用建议

适合使用 `cluacov.runner`（指令级方案）的场景：

- Lua 5.4+ 项目的 CI/CD 覆盖率采集
- 需要发现复合条件（`and`/`or`）中未覆盖的子条件
- 需要生成带分支标注的 HTML 报告

适合使用行级方案的场景：

- 必须兼容 Lua 5.1-5.3 或 LuaJIT
- 只需粗粒度覆盖率，行级足够

不适合使用指令级钩子的场景：

- 生产环境的性能监控（两种 C 钩子的开销在 28-54x 量级，不适合生产环境）
- 需要边覆盖率语义的严格验证

常见错误用法：

- 在 `pchook.stop()` 后用 `loadfile` 重新加载文件，然后传给 `get_hits`——得到的是新 Proto 对象，无法匹配钩子数据
- 在 Lua 5.3 环境调用 `pchook.start()`——会直接报错
- 忘记在 `.luacov` 中配置 `exclude` 规则，导致 cluacov 自身的模块也被采集

## 总结

cluacov 的分支覆盖率实现本质上是在 Lua 调试接口的能力边界内做到了最大化利用：行级钩子只能做到近似，通过过滤规则剔除不可区分的分支来保证报告的可信度；指令级钩子利用 `LUA_MASKCOUNT` 的每指令触发特性，配合 Proto 元数据写时快照解决了 GC 安全性问题，实现了无需过滤的精确分支覆盖率。两套方案是递进关系而非替代关系——前者保证了广泛兼容性，后者在 Lua 5.4+ 上提供了更高的精度。

## 附录：如何解读 LCOV 覆盖率报告

`cluacov.runner` 在程序退出时自动生成 `lcov.info`，这是标准的 LCOV 格式文件，可以直接被 `genhtml` 等工具消费。下图以真实输出片段为例，逐行解读每个字段的含义：

![附录：如何解读 LCOV 覆盖率报告](https://blog-cloudflare-imgbed.pages.dev/file/img/cluacov-branch-coverage/1777718042478_05-lcov-report-guide.png)

### LCOV 文件结构

每个被测源文件对应一段记录，由 `TN`（Test Name，测试名称）和 `SF`（Source File，源文件路径）开头、`end_of_record` 结尾。记录内包含四类覆盖率数据：

**函数覆盖率**：`FN`（Function Name，函数声明）格式为 `FN:行号,函数名`，声明函数位置；`FNDA`（Function Data，函数命中数据）格式为 `FNDA:命中次数,函数名`，记录调用次数。`FNF`（Functions Found，函数总数）/ `FNH`（Functions Hit，已调用函数数）是汇总。

**分支覆盖率**（cluacov 独有）：`BRDA`（Branch Data，分支命中数据）格式为 `BRDA:行号,站点ID,路径ID,命中次数`，是核心记录。每个分支站点（`if`、`for`、`and`/`or` 等）有两条路径（路径 0 和路径 1），命中次数为 `-` 表示该路径从未执行。`BRF`（Branches Found，路径总数）/ `BRH`（Branches Hit，已命中路径数）是汇总。

**行覆盖率**：`DA`（Data line，行命中数据）格式为 `DA:行号,命中次数`，记录每行执行次数。`0` 表示该行可执行但未被覆盖。`LF`（Lines Found，可执行行总数）/ `LH`（Lines Hit，已命中行数）是汇总。

### 分支覆盖状态判定

对于同一个站点 ID 的两条 `BRDA` 记录：

- **covered**（完全覆盖）：两条路径都有命中次数（如 `BRDA:4,0,0,1` + `BRDA:4,0,1,1`）
- **partial**（部分覆盖）：只有一条路径命中（如 `BRDA:6,1,0,1` + `BRDA:6,1,1,-`）
- **uncovered**（未覆盖）：两条路径都是 `-`（对应从未进入的代码块）

### 生成 HTML 报告

```sh
genhtml lcov.info --output-directory html --branch-coverage
```

生成的 HTML 报告会用颜色标注每行的覆盖状态，分支用 `[+ +]`（covered）、`[+ -]`（partial）、`[- -]`（uncovered）标记。这是 CI/CD 中最常用的覆盖率可视化方式。
