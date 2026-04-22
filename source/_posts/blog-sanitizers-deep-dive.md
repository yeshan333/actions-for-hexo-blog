---
title: Sanitizer 全景：从编译插桩到硬件标签的内存安全检测演进
toc: true
comments: true
popular_posts: false
mathjax: false
pin: false
date: 2026-04-22 16:10:00
tags:
  - C/C++
  - Sanitizer
  - 内存安全
categories: C/C++
keywords: "Sanitizer, ASan, TSan, MSan, HWASan, MTE, 内存安全"
cover: https://blog-cloudflare-imgbed.pages.dev/file/1776845490541_01-project-overview.png
---

# Sanitizer 全景：从编译插桩到硬件标签的内存安全检测演进

C 和 C++ 至今仍是操作系统内核、浏览器引擎、数据库等基础软件的主力语言。这些语言不提供自动内存管理，程序员直接操控指针和内存生命周期，由此产生的内存安全问题——越界访问、Use-After-Free、未初始化读取、数据竞争——是现实世界中最主要的安全漏洞来源。微软和 Google 的统计数据均表明，其产品中约 70% 的高危安全漏洞源自内存安全缺陷。

Sanitizer（消毒器）是 LLVM/GCC 工具链中一组动态检测工具的统称，通过编译时插桩和运行时检查，在程序执行过程中实时捕获内存错误。从 2012 年 AddressSanitizer 首次发布，到 ARM MTE 硬件原生标签检测，这一技术路线经历了从纯软件到软硬件协同的完整演进，形成了覆盖开发、测试、生产环境的多层防御体系。

> **范围说明**：本文聚焦用户态 C/C++ 常见 sanitizer 及相关硬件/生产化方案，不展开内核侧的 KASAN、KMSAN、KCSAN 等变体。

![项目整体架构](https://blog-cloudflare-imgbed.pages.dev/file/1776845490541_01-project-overview.png)

## 核心工具与基本用法

Sanitizer 家族包含多个针对不同缺陷类型的独立工具。大多数工具通过编译器标志（`-fsanitize=...`）启用，无需修改源代码；也有部分工具（如 GWP-ASan、MTE）通过运行时配置或系统级参数启用，无需重新编译。

### AddressSanitizer (ASan)

ASan 检测堆/栈/全局缓冲区越界访问和 Use-After-Free。启用方式是在编译和链接时传入 `-fsanitize=address`：

```c
// heap_overflow.c
#include <stdlib.h>

int main() {
    int *buf = (int *)malloc(10 * sizeof(int));
    buf[10] = 42;  // 堆缓冲区越界写入
    free(buf);
    return buf[0]; // Use-After-Free 读取
}
```

```bash
clang -fsanitize=address -g -o heap_overflow heap_overflow.c
./heap_overflow
```

ASan 会在第一个错误处终止程序，并输出详细的错误报告，包括错误类型、访问地址、分配/释放的调用栈。报告中的 shadow byte 信息直接反映了该地址在 Shadow Memory 中的状态编码。

ASan 内置了 LeakSanitizer (LSan) 的功能，但 LSan 也可以作为独立工具使用，下文单独展开。

### LeakSanitizer (LSan)

LSan 检测堆内存泄漏——已分配但在程序退出时不再被任何指针可达的内存。LSan 有两种使用方式：一是作为 ASan 的附属功能自动启用，二是作为独立工具单独编译。

独立模式无需 ASan 的 shadow memory 开销，适用于只关心泄漏而不需要越界/UAF 检测的场景：

```c
// leak.c
#include <stdlib.h>

void create_leak() {
    int *p = (int *)malloc(1024 * sizeof(int));
    p[0] = 42;
    // 函数返回后 p 失去作用域，1024*4 字节泄漏
}

int main() {
    for (int i = 0; i < 10; i++)
        create_leak();
    return 0;
}
```

```bash
# 独立模式（Linux、部分 BSDs）：仅链接 LSan 运行时，不引入 ASan 开销
# 注意：Apple Clang 不支持 -fsanitize=leak，需使用 LLVM 官方工具链
clang -fsanitize=leak -g -o leak leak.c
./leak

# macOS / 其他平台：Apple Clang 的 ASan 不支持 detect_leaks，
# 需安装 LLVM 官方工具链（如 brew install llvm），使用其 clang 编译：
/opt/homebrew/opt/llvm/bin/clang -fsanitize=address -g -o leak leak.c
ASAN_OPTIONS=detect_leaks=1 ./leak
```

程序退出时 LSan 输出如下格式的报告：

```
ERROR: LeakSanitizer: detected memory leaks

Direct leak of 40960 byte(s) in 10 object(s) allocated from:
    #0 0x... in malloc
    #1 0x... in create_leak leak.c:4
    #2 0x... in main leak.c:10
```

LSan 的检测发生在 `atexit` 阶段：它遍历所有全局变量、栈帧、寄存器中的指针值，标记从这些根节点可达的所有堆分配为"可达"，剩余未标记的分配即为泄漏。这本质上是一次保守的 GC mark 过程——任何看起来像指针的值都被视为潜在引用，因此 LSan 的误报率极低，但并非绝对为零：在极端场景下（如指针存储于未被扫描的内存映射区域、或跨语言运行时使用了 LSan 无法感知的内存管理策略），可能出现少量误报。更常见的情况是漏报——指针被编码、压缩或存储在非标准位置时，LSan 无法将其识别为引用，导致仍被引用的内存被误判为泄漏。

当与 ASan 组合使用时，LSan 默认启用，无需额外标志。在独立模式下通过 `-fsanitize=leak` 启用。两种模式的关键差异：ASan + LSan 模式下 ASan 的 quarantine 会延迟内存归还，可能影响泄漏判定的准确性（quarantine 中的内存虽已 free 但尚未归还分配器）；独立 LSan 模式没有这一干扰。

LSan 可以通过 suppression 文件忽略已知的泄漏：

```bash
LSAN_OPTIONS=suppressions=lsan.supp ./leak
```

```
# lsan.supp
leak:create_leak
```

这在逐步修复大型代码库泄漏时非常实用——先 suppress 已知泄漏，防止新增泄漏被淹没。

### MemorySanitizer (MSan)

MSan 检测对未初始化内存的读取。这类错误不会导致崩溃，但会引入不确定行为，是极难排查的隐蔽 Bug：

```c
// uninit.c
#include <stdio.h>

int main() {
    int x;
    if (x)  // 读取未初始化变量
        printf("true\n");
    return 0;
}
```

```bash
clang -fsanitize=memory -g -o uninit uninit.c
./uninit
```

MSan 要求被检测程序及其所有依赖库均使用 `-fsanitize=memory` 编译。如果链接了未插桩的库，MSan 会产生大量误报——这是实际使用中最常见的障碍。MSan 目前支持 Linux、NetBSD 和 FreeBSD（仅 Clang/LLVM，GCC 不提供 MSan 实现）。

### ThreadSanitizer (TSan)

TSan 检测数据竞争（data race），即两个线程并发访问同一内存位置且至少一个是写操作，且没有通过同步原语建立 happens-before 关系。此外，TSan 还具备死锁检测（deadlock detection）和锁顺序反转（lock-order-inversion）检测能力——当程序中多个锁的获取顺序不一致时，TSan 会报告潜在的死锁风险：

```c
// race.c
#include <pthread.h>

int counter = 0;

void *increment(void *arg) {
    for (int i = 0; i < 100000; i++)
        counter++;  // 无锁并发写入
    return NULL;
}

int main() {
    pthread_t t1, t2;
    pthread_create(&t1, NULL, increment, NULL);
    pthread_create(&t2, NULL, increment, NULL);
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    return 0;
}
```

```bash
clang -fsanitize=thread -g -o race race.c -lpthread
./race
```

TSan 基于 happens-before 语义而非简单的锁检测。它能正确处理 `atomic` 操作、`mutex`、`condition_variable`、`std::call_once` 等同步原语，只有在确认不存在 happens-before 关系时才报告竞争。

需要注意的关键约束：ASan、MSan、TSan 三者互斥，不能在同一次编译中同时启用。这是因为它们各自使用不同的 Shadow Memory 布局和运行时库，内存地址空间上存在冲突。UBSan 不受此约束，可以与任何一个 Sanitizer 组合使用。

### HWAddressSanitizer (HWASan)

HWASan 是 ASan 的硬件辅助版本，其成熟部署路径基于 AArch64 的 Top-Byte Ignore (TBI) 特性——将标签嵌入指针高字节，大幅降低内存开销。x86 平台上 Intel LAM 和 AMD UAI 提供了类似的高位忽略能力，但截至目前仍处于早期实验阶段，硬件和内核支持尚未普及，不应视为与 AArch64 TBI 同等成熟的部署基础：

```bash
clang -fsanitize=hwaddress -g -o target target.c
```

在 Android 系统上，HWASan 已深度集成。`google/sanitizers` 仓库中的 Android 测试应用通过 build flavor 和 manifest placeholder 来配置不同的检测模式：

```xml
<!-- AndroidManifest.xml 中使用 placeholder -->
<application
    android:memtagMode="${memtagMode}"
    android:gwpAsanMode="${gwpAsanMode}">
```

```groovy
// build.gradle 中通过 productFlavors 配置具体值
productFlavors {
    none        { /* 不启用任何 sanitizer */ }
    gwp_asan    { manifestPlaceholders = [ gwpAsanMode: 'always' ] }
    hwasan      { externalNativeBuild { cmake { arguments "-DHWASAN=1" } } }
    memtag_sync { manifestPlaceholders = [ memtagMode: 'sync' ] }
    memtag_async { manifestPlaceholders = [ memtagMode: 'async' ] }
}
```

HWASan 通过 CMake 参数 `-DHWASAN=1` 启用 NDK 层面的编译插桩；MTE 和 GWP-ASan 则通过 manifest 属性在运行时启用，无需重新编译 native 代码。

HWASan 的 Shadow Memory 映射比为 1:16（每 16 字节应用内存对应 1 字节 shadow），相比 ASan 的 1:8 映射减少了近一半的内存开销。但 HWASan 的标签仅有 8 bit（256 个可能值），存在约 1/256 的概率漏检——标签碰撞导致旧指针恰好匹配新分配的标签。

### GWP-ASan

GWP-ASan 采用完全不同的策略：它不对所有分配插桩，而是以极低概率对堆分配进行采样，将被采样的分配放置在由 guard page 保护的专用内存区域中。越界访问触发 guard page 的页面保护异常，Use-After-Free 通过延迟取消映射检测。

```bash
# Android 应用通过 manifest 启用
# 无需重新编译，运行时生效
```

GWP-ASan 的核心价值在于其生产环境可用性——性能开销不到 1%，可以在海量用户设备上长期运行。单个设备的检测概率很低，但覆盖数十亿设备时，统计上仍能高效发现内存错误。Google 在 Android 11 中默认为系统进程启用了 GWP-ASan。

### UndefinedBehaviorSanitizer (UBSan)

![UBSan 检测架构](https://blog-cloudflare-imgbed.pages.dev/file/1776845529528_07-ubsan-architecture.png)

UBSan 检测 C/C++ 标准中定义的未定义行为（Undefined Behavior），这些行为在不同编译器、优化级别、目标架构下可能产生完全不同的结果。常见的检测项包括：有符号整数溢出、空指针解引用、除零、数组越界（通过 `-fsanitize=bounds`）、非法的类型转换（`-fsanitize=undefined` 涵盖的子项）等。

```c
// ubsan_example.c
#include <limits.h>

int main() {
    int x = INT_MAX;
    x += 1;  // 有符号整数溢出：未定义行为
    return x;
}
```

```bash
clang -fsanitize=undefined -g -o ubsan_example ubsan_example.c
./ubsan_example
# 输出: ubsan_example.c:5:7: runtime error: signed integer overflow:
#       2147483647 + 1 cannot be represented in type 'int'
```

UBSan 的一个独特优势是它通常可以与 ASan、TSan 等其他 Sanitizer 同时启用，不存在 shadow memory 冲突（具体兼容性因工具链版本和子项组合而异）：

```bash
# ASan + UBSan 组合使用
clang -fsanitize=address,undefined -g -o target target.c
```

UBSan 的运行时开销通常很低（取决于启用的检测子项），因为大部分检查只在特定操作（如整数算术、指针运算、类型转换）时插入，不需要全局 shadow memory。部分子项（如 `-fsanitize=bounds`）的开销可以忽略不计。UBSan 同时支持 Clang 和 GCC，跨平台可用性好（Linux、macOS、Windows 均可使用）。

## 行为细节与常见误区

**误区一：ASan 能检测所有内存错误。** ASan 无法检测未初始化读取（需要 MSan）和数据竞争（需要 TSan）。ASan 的越界检测依赖 redzone，如果越界跨度恰好跳过 redzone 落在另一个合法分配上，也会漏检。

**误区二：TSan 报告的竞争一定会导致 Bug。** TSan 报告的是违反内存模型的行为，即使当前硬件上运行正确，在更弱的内存序架构（如 ARM）或编译器优化后可能产生实际问题。TSan 报告的竞争应当全部修复，而非通过实际运行结果判断是否"真的有问题"。

**误区三：HWASan 可以替代 ASan。** HWASan 的检测粒度是 16 字节（shadow 粒度），小于 16 字节的越界访问可能无法检测。ASan 的 redzone 粒度更细，可以检测到单字节越界。在开发环境中，ASan 仍然是更精确的选择。

**误区四：GWP-ASan 的"低概率"意味着无用。** GWP-ASan 设计目标不是单机检测，而是大规模统计检测。当部署到百万级设备时，即使单设备采样率为 1/1000，每天触发的检测量仍然可观。它的价值体现在分母足够大时。

**误区五：LSan 报告泄漏就意味着有 Bug。** 某些场景下程序故意不释放内存——例如进程退出前的全局缓存、单例对象。这些是"有意为之的泄漏"而非 Bug。LSan 提供 suppression 机制和 `__lsan_disable()` / `__lsan_enable()` API 来标记这些例外。但需要警惕的是，用 suppression 掩盖真实泄漏：每条 suppression 规则都应当有明确的注释说明为什么该泄漏是可接受的。

**误区六：Sanitizer 引入的性能开销是固定的。** 实际开销与程序行为高度相关。内存密集型程序（频繁 malloc/free、大量指针运算）的 ASan 开销远高于计算密集型程序。TSan 对锁争用激烈的场景开销可达 15x，但对无锁代码可能只有 5x。

## 内部原理

![Sanitizer 技术原理对比](https://blog-cloudflare-imgbed.pages.dev/file/1776845500252_02-sanitizer-comparison.png)

### ASan：Shadow Memory 与 Redzone

ASan 的核心机制是 Shadow Memory——一块与应用内存建立固定映射关系的元数据区域。每 8 字节应用内存对应 1 字节 shadow，编码方式如下：

- `0x00`：8 字节全部可访问
- `0x01` - `0x07`：前 N 字节可访问，其余不可访问
- `0xfa`：堆左 redzone（heap left redzone）
- `0xfd`：已释放的堆内存（quarantine 中）
- `0xf1` - `0xf4`：栈左/中/右/部分 redzone
- `0xf5`：栈使用后返回（stack use after return）

地址到 shadow 的映射公式是确定性的：

```
shadow_addr = (app_addr >> 3) + shadow_offset
```

编译器在每个内存访问指令前插入检查代码。以 8 字节对齐读取为例，伪代码如下：

```c
// 编译器在 *addr 前插入的检查
shadow_value = *(shadow_offset + (addr >> 3));
if (shadow_value != 0) {
    // 慢路径：检查部分可访问的情况
    if ((addr & 7) + access_size > shadow_value)
        report_error(addr, access_size);
}
// 原始内存访问
*addr;
```

对于堆分配，ASan 替换了 `malloc`/`free` 实现。`malloc` 在分配区域两侧插入 redzone（默认 16 字节，可配置），并在 shadow memory 中将 redzone 标记为不可访问。`free` 不立即归还内存，而是将其放入 quarantine 队列，quarantine 中的内存 shadow 被标记为 `0xfd`，任何访问都会触发报错。quarantine 满后，最早释放的内存才被真正归还。

这个设计决定了 ASan 的两个核心代价：shadow memory 带来约 1/8 额外内存占用（加上 redzone 和 quarantine，实际约 2-3 倍），插桩检查带来约 2 倍 CPU 开销。

### LSan：退出时保守 GC 扫描

![LSan 检测原理](https://blog-cloudflare-imgbed.pages.dev/file/1776845526749_06-lsan-architecture.png)

LSan 的检测算法在程序退出时执行一次，核心是保守式垃圾回收（conservative GC）的 mark-sweep 过程：

1. **Stop-the-world**：暂停所有线程，获取一致的内存快照。
2. **收集根集**：扫描所有线程的栈帧、寄存器、全局变量段（`.data` / `.bss`），提取所有看起来像指针的值——即落在堆分配地址范围内的机器字。这是"保守"的含义：整数值恰好与某个堆地址相同也会被视为引用。
3. **Mark 阶段**：从根集出发，递归标记所有可达的堆分配块。可达块内部的每个机器字同样作为潜在指针参与扫描。
4. **Sweep 阶段**：未被标记的堆分配即为泄漏。LSan 按"直接泄漏"（根集直接不可达）和"间接泄漏"（因直接泄漏块不可达而级联不可达）分类报告。

```
// 保守 GC 的伪代码
roots = scan_registers() + scan_stacks() + scan_globals()
worklist = {chunk | chunk in live_allocations, overlaps_any(roots, chunk)}
while worklist not empty:
    chunk = worklist.pop()
    for each machine_word in chunk:
        if machine_word points to some other_chunk in live_allocations:
            if other_chunk not yet marked:
                mark(other_chunk)
                worklist.push(other_chunk)
leaked = live_allocations - marked_allocations
```

独立 LSan 模式的开销极低——运行时不做任何额外工作，仅在退出时执行一次 mark-sweep。扫描时间与进程的内存映射数量和活跃堆分配数量成正比，大多数程序在毫秒级完成。

### HWASan：Top-Byte Ignore 与硬件标签

HWASan 利用了一个硬件特性：AArch64 处理器可以配置为忽略虚拟地址的高字节（bit 56-63）。这意味着指针 `0x0a001234_00005678` 和 `0x00001234_00005678` 指向相同的物理内存，但高字节 `0x0a` 可以被软件用作元数据——这就是指针标签。

![HWASan/MTE 内存标签架构](https://blog-cloudflare-imgbed.pages.dev/file/1776845504039_03-hwasan-mte-architecture.png)

HWASan 的工作流程：

1. **分配时**：为每个堆分配生成一个随机的 8-bit 标签 T，将 T 写入指针高字节，同时将 T 写入该分配对应的所有 shadow 字节。
2. **访问时**：编译器插入的检查代码提取指针高字节标签 Tp，查询目标地址的 shadow 字节标签 Ts，比较 `Tp == Ts`。不匹配则报错。
3. **释放时**：为该内存区域生成新的随机标签并写入 shadow。旧指针携带的标签不再匹配，后续 Use-After-Free 访问被捕获。

Shadow 映射比为 1:16（每 16 字节应用内存 1 字节 shadow），这也意味着检测粒度为 16 字节——相邻分配之间如果没有 16 字节对齐边界，小范围越界可能漏检。

在 x86 平台上，Intel LAM (Linear Address Masking) 和 AMD UAI (Upper Address Ignore) 提供了类似的高位忽略能力，但这些特性仍处于逐步落地阶段——需要较新的 CPU 微架构（如 Intel Meteor Lake 及之后）和内核支持（Linux 6.2+），目前远未达到 AArch64 TBI 的生态成熟度。`google/sanitizers` 仓库中的 `check_registers` 工具正是用于验证这些 x86 硬件特性在不同寄存器和指令组合下的行为——数据流指令（`mov`、`movaps`）应当正确忽略高位标签，而控制流指令（`call`、`jmp`、`ret`）应当拒绝带标签的指针，防止标签被误用于控制流劫持。

### MTE：硬件原生标签检测

ARM Memory Tagging Extension (MTE, ARMv8.5-A) 将标签检测从软件插桩推进到硬件原生支持。MTE 使用指针 bit 56-59 存储 4-bit 标签（16 个可能值），标签存储在物理 RAM 中独立的 Tag Storage 区域（非 ECC 存储），每 16 字节数据对应 4-bit 标签。

MTE 提供了专用指令：

- **IRG** (Insert Random Tag)：生成随机标签并写入指针
- **STG** (Store Tag)：将指针标签写入内存对应的 Tag Storage
- **LDG** (Load Tag)：从 Tag Storage 加载标签

关键区别在于：标签检查由 CPU 在每次 `LDR`/`STR` 指令执行时自动完成，无需编译器插入额外检查代码。这消除了 ASan/HWASan 的插桩开销。

MTE 支持两种运行模式：

- **同步模式 (SYNC)**：标签不匹配时 CPU 立即触发同步异常，提供精确的错误位置。适用于开发测试，开销约 5-10%。
- **异步模式 (ASYNC)**：标签不匹配被记录到系统寄存器 `TFSR_EL1`，不立即中断执行，在下次内核入口（如系统调用、中断）时才检查并报告。适用于生产环境，公开资料中常见的开销量级为几个百分点，具体取决于硬件实现、内核版本和工作负载特征。

4-bit 标签意味着约 1/16 的碰撞概率。对于安全加固场景，这个概率已经足以大幅提升漏洞利用的难度——攻击者需要在每次尝试中以 15/16 的概率触发异常。

### MTE Dynamic Tag Storage：灵活的物理内存管理

![MTE 动态 Tag Storage 架构](https://blog-cloudflare-imgbed.pages.dev/file/1776845515331_04-mte-dynamic-tag-storage.png)

MTE 的 Tag Storage 占用物理 RAM（每 16 字节数据 4-bit 标签，即 32 个数据页需要 1 个标签页）。`google/sanitizers` 仓库中的 MTE Dynamic Carveout 规范提出了一种灵活的物理内存管理方案，允许操作系统在运行时动态决定一个 Tag Block（32 Data Pages + 1 Tag Page）是用于存储带标签的数据还是普通数据。

操作系统维护三个空闲链表：

1. **Untagged 空闲页表**：普通内存页
2. **Tagged 空闲页表**：支持 MTE 标签的内存页
3. **Tag Block 空闲表**：启动时包含所有 Tag Block

页面分配流程：首先查对应类型的空闲页表；如果为空，从 Tag Block 空闲表取出一个 Block 并转换（tagged 模式产出 32 页，untagged 模式产出 33 页）；如果 Tag Block 也耗尽，则从另一类型的空闲页表中压缩回收。

这个设计的关键价值在于：不使用 MTE 的进程无需为 Tag Storage 付出任何内存代价——Tag Page 可以作为普通数据页使用。只有当系统中确实有进程启用 MTE 时，Tag Page 才被预留。规范还定义了 `Tag Storage Clean` 操作（`DC CIGVAC` + `DC CIVAC`）确保在模式切换时标签缓存和数据缓存的一致性。

### MarkUs GC + MTE：混合方案的潜力

`google/sanitizers` 仓库中对 MarkUs GC 论文的分析揭示了一个有趣的混合策略：将 MTE 标签与 GC 式 quarantine 结合，可以将 GC 扫描频率降低 16 倍。

原理：每个堆分配的初始标签为 0，每次 `free` 时标签递增。在标签溢出（第 16 次释放同一区域）之前，MTE 硬件自动阻止 Use-After-Free——旧指针的标签不匹配当前标签。只有当标签耗尽（回绕到 0）时，才需要将该内存放入 quarantine 并启动 GC 扫描检查是否仍有悬挂指针。

这意味着 MarkUs 的 GC 扫描成本被摊薄了 16 倍，使得原本在高分配速率场景下代价高昂的 GC 方案变得可行。

## 性能与特性分析

各 Sanitizer 的性能开销差异巨大，根本原因在于检测机制的不同。以下数字为社区广泛引用的典型范围（主要来源于 LLVM 官方文档、Google 发表的原始论文及 Android 安全团队的公开报告），实际开销因工作负载特征、目标架构、编译器版本而异，应以自身项目的基准测试为准：

**ASan** 的开销主要来自两部分：每次内存访问前的 shadow 检查（CPU 开销约 2x）和 shadow memory + redzone + quarantine 的额外内存（RAM 开销约 2-3x）。shadow 检查是一次内存读取加一次条件判断，在现代 CPU 上通常命中 L1 缓存，开销相对可控。

**LSan（独立模式）** 在运行阶段几乎零开销——它替换了 `malloc`/`free` 以追踪分配元数据，但不插入任何内存访问检查。代价集中在进程退出时的单次 mark-sweep 扫描，耗时与堆分配数量和内存映射规模成正比。对于分配数百万对象的大型进程，退出时的扫描可能需要数秒，但对程序运行期性能没有影响。与 ASan 组合使用时，LSan 的退出扫描开销被 ASan 本身的 2-3x 开销掩盖。

**MSan** 的开销略高于 ASan（CPU 约 3x），因为它需要跟踪每个字节的初始化状态，并在值传播时传递 shadow 状态——一次加法 `c = a + b` 不仅要计算 `c` 的值，还要计算 `c` 的 shadow（即 `c` 是否被初始化取决于 `a` 和 `b` 的 shadow 状态）。

**TSan** 的开销最高（CPU 5-15x，RAM 5-10x），因为它需要为每个内存访问维护 vector clock 状态来追踪 happens-before 关系。每个 8 字节内存对应的 shadow 区域需要存储最近多个线程的访问时间戳，shadow 比为 1:4（远高于 ASan 的 1:8）。

**HWASan** 在 AArch64 上的 CPU 开销约 15%，RAM 开销约 15%。相比 ASan 大幅改善的原因是 shadow 比为 1:16 且无需 redzone，但仍需要编译器插入标签比较指令。

**MTE (ASYNC)** 的 CPU 开销通常在几个百分点量级，是所有方案中最低的。硬件自动完成标签检查，无需插桩指令。Tag Storage 的 RAM 开销约为 1/32 的物理内存用于标签存储。具体数值取决于硬件实现（不同 SoC 的 MTE 实现效率不同）、内核版本和负载特征，应以目标平台的实测为准。

**GWP-ASan** 的开销不到 1%——绝大多数分配走正常路径，只有被采样的极少数分配有额外开销。代价是检测概率极低，无法保证单次运行一定能发现错误。

![Dashboard 与 CI/Buildbot 架构](https://blog-cloudflare-imgbed.pages.dev/file/1776845521918_05-dashboard-ci-architecture.png)

## 技术方案对比

![Sanitizer 技术原理对比](https://blog-cloudflare-imgbed.pages.dev/file/1776845500252_02-sanitizer-comparison.png)

从检测维度看，这些工具覆盖不同的缺陷类型，互为补充而非替代：

ASan 和 HWASan 针对空间安全（越界）和时间安全（UAF），区别在于实现机制：ASan 纯软件、更精确（字节粒度）、开销更高；HWASan 借助硬件 TBI、粒度较粗（16 字节）、开销更低。MTE 在 HWASan 的方向上更进一步，将检测完全交给硬件，代价是标签空间从 8-bit 缩减到 4-bit，碰撞概率从 1/256 上升到 1/16。

从部署阶段看，形成了清晰的分层策略：

- **开发/测试环境**：ASan + UBSan / MSan + UBSan / TSan（分别编译运行），追求最大检测精度
- **CI/预发布**：HWASan，在可接受的开销下持续检测
- **金丝雀/灰度**：HWASan 或 MTE SYNC，覆盖更接近真实的负载
- **全量生产**：GWP-ASan 或 MTE ASYNC，开销足够低以长期运行

与 Rust/Go 等内存安全语言相比，Sanitizer 的定位是为无法迁移的 C/C++ 代码库提供防御。Rust 的所有权系统在编译时消除大多数内存安全问题，但无法应用于现存的数十亿行 C/C++ 代码。Sanitizer 是在不改变语言的前提下最有效的动态检测手段。

与 Valgrind 相比，ASan 的优势在于性能：Valgrind 基于二进制翻译（dynamic binary instrumentation），CPU 开销通常在 10-50x，而 ASan 通过编译时插桩仅有约 2x。Valgrind 的优势是无需重新编译，但在大规模持续集成中，编译时插桩的方案更为实用。

## 实践建议

**适合启用 ASan 的场景**：所有 C/C++ 项目的 CI 流水线。将 ASan 编译作为 CI 的标准步骤，与普通编译并行运行。ASan 编译的测试套件可以同时覆盖功能正确性和内存安全性。ASan 默认包含 LSan，一次编译同时检测越界、UAF 和泄漏。

**适合独立使用 LSan 的场景**：对性能敏感的集成测试或端到端测试。独立 LSan（`-fsanitize=leak`）不引入运行时开销，适合在测试周期较长、无法承受 ASan 2x 开销的场景下仅检测泄漏。独立模式在 Linux 上支持最完善，部分 BSDs 也可用；macOS 上 Apple Clang 既不支持 `-fsanitize=leak`，其 ASan 运行时也不支持 `detect_leaks` 选项，需安装 LLVM 官方工具链（如 `brew install llvm`）并使用其 clang 进行编译。也适用于已经通过 ASan 排除了越界/UAF 后，需要在接近 Release 的编译配置下专门追踪泄漏的阶段。

**适合启用 TSan 的场景**：涉及多线程的代码库，尤其是使用了无锁数据结构或细粒度锁的模块。TSan 的误报率在正确插桩的情况下极低，报告的每一个竞争都值得认真对待。

**不适合使用 MSan 的场景**：依赖大量第三方闭源库的项目。MSan 要求所有链接的代码均已插桩，未插桩的函数返回值会被误判为未初始化。如果无法重新编译所有依赖，考虑使用 Valgrind 的 memcheck 替代。

**生产环境低开销检测方案**：对于 Android 应用和服务端长运行进程，GWP-ASan 是目前最广泛部署的低开销生产检测方案之一。如果目标设备支持 ARMv8.5-A，MTE ASYNC 模式是另一重要选择——检测概率从采样（极低概率）提升到确定性（仅有 1/16 碰撞率），开销仍然可控。两者的选择取决于目标平台的硬件支持和部署条件。

**常见错误用法**：

- 在 Release 编译中启用 ASan 并期望"顺便检测"——ASan 禁用了部分编译器优化，且增加的内存开销可能改变程序的时序行为，导致并发 Bug 被掩盖或触发。Sanitizer 应当有独立的 CI 构建配置。
- 忽略 ASan 报告中的 `alloc-dealloc-mismatch`——`new[]` 配 `delete`（而非 `delete[]`）在某些平台上"恰好能工作"，但属于未定义行为，在其他平台或优化级别下会崩溃。
- 将 ASan 和 TSan 放在同一个编译目标中——二者使用不同的 shadow 布局，同时启用会在链接阶段或运行时崩溃。

## 总结

Sanitizer 技术的本质是用可控的运行时代价换取内存安全和行为正确性的动态验证。从 ASan 的 shadow memory 编译插桩，到 LSan 的退出时保守 GC 扫描，到 UBSan 对未定义行为的细粒度检测，到 HWASan 利用指针高位存储标签，再到 MTE 将检测逻辑下沉到 CPU 微架构，每一步演进都在降低检测开销的同时保持有效的错误捕获率。没有单一工具能覆盖所有缺陷类型和部署阶段——正确的策略是在开发、测试、生产环节分别部署适合的工具，构建多层防御。对于仍在使用 C/C++ 的工程团队，在 CI 中启用 ASan（含 LSan）+ UBSan 和 TSan 是投入产出比最高的安全实践，没有之一。
