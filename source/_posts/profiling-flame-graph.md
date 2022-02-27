---
title: profiling & Flame Graphs
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
headimg: https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/824280flame.png
date: 2022-02-26 22:54:38
tags: [Elixir, Go, React, Profiling, Flame Graphs]
categories:
  - Performance
  - Profiling
keywords: "Elixir, Go, React, Profiling, Flame Graph"
---

忽然想起来还没怎么用过 profiling tools，这可是性能分析“杀器”啊，小水一波，兴许以后就用上了🙃。

## profiling

> profiling，分析。有很多时候，我们都会相对处于 runtime 的程序进行指标 & 特征分析，比如 CPU 使用情况、内存使用情况，race 检测等。

## Flame Graphs（火焰图）

> Flame Graph，火焰图。火焰图是一种常用的可视化分析性能数据的方式。不同类型火焰图适合不同的性能分析优化场景。

![https://github.com/brendangregg/FlameGraph](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/flame.png)

上图为 **CPU 使用情况**的 Flame Graph，来自 -> [(https://github.com/brendangregg/FlameGraph](https://github.com/brendangregg/FlameGraph)。通过该图，我们可以找到 CPU 占用最多的函数，分析代码热路径。特征如下：

- 纵轴：表函数调用栈，上层函数时下层函数的子函数；
- 横轴：表示 CPU 占用时间，越长表示占用时间越多；

值得注意的是：横轴先后顺序是为了聚合，跟函数间依赖或调用关系无关；一般情况下，火焰图各种颜色是为方便区分，本身不具有特殊含义。

## 小试一下

### Elixir Phoenix Framework & Flame On

根据这篇 Toturial -> [Profiling Elixir Applications with Flame Graphs and Flame On](https://dockyard.com/blog/2022/02/22/profiling-elixir-applications-with-flame-graphs-and-flame-on)，我们在 Phoenix App Telemetry Dashboard 中集成 [Flame On](https://github.com/DockYard/flame_on)，GET 到如下 Flame Graph：

![Flame Graph](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/elixir-flame-graphs.png)

### Go && pprof

Go 内置了 profiling 工具 [pprof][https://github.com/google/pprof] 方便我们对程序进行分析，通过 [runtime/pprof](https://pkg.go.dev/runtime/pprof) 包，我们可以在程序中指定位置埋下采集点。

```go
package main

import (
	"math/rand"
	"os"
	"runtime/pprof"
	"time"
)

func generate(n int) []int {
	rand.Seed(time.Now().UnixNano())
	nums := make([]int, 0)
	for i := 0; i < n; i++ {
		nums = append(nums, rand.Int())
	}
	return nums
}

func insertionSort(nums []int) {
	var n = len(nums)
	for i := 1; i < n; i++ {
		j := i
		for j > 0 {
			if nums[j-1] > nums[j] {
				nums[j-1], nums[j] = nums[j], nums[j-1]
			}
			j = j - 1
		}
	}
}

func main() {
	profileFile, _ := os.OpenFile("cpu.pprof", os.O_CREATE, 0644)
	defer profileFile.Close()

	pprof.StartCPUProfile(profileFile)
	defer pprof.StopCPUProfile()

	var n int = 10
	for i := 0; i < 5; i++ {
		nums := generate(n)
		insertionSort(nums)
		n *= 100
	}
}
```

```shell
go run main.go # 生成 cpu.pprof profiling 文件
# 启动 http server 查看分析数据
go tool pprof -http=:8080 cpu.pprof
```

然后可以 GET 到类似如下得 Flame Graphs，就挺不 Simplex 的，2333：

![go-flame-graphs](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/go-flame-graphs.png)

### React

React App 的 profiling 我们可以借助浏览器扩展 [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) 进行，也可以在使用官方提供的 [Profiler API](https://reactjs.org/docs/profiler.html).

我们起个 Ant-Design Pro 来看看：[https://github.com/ant-design/ant-design-pro](https://github.com/ant-design/ant-design-pro)

```shell
yarn create umi
```

![antdesign-pro profiling](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/react-devtools.png)

## 参考

- [Flame Graphs](https://www.brendangregg.com/flamegraphs.html)
- [Profiling Elixir Applications with Flame Graphs and Flame On](https://dockyard.com/blog/2022/02/22/profiling-elixir-applications-with-flame-graphs-and-flame-on)
- [Go程序性能分析 pprof](http://bingerambo.com/posts/2021/04/go%E7%A8%8B%E5%BA%8F%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90pprof/#top)