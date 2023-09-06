---
title: Elixir 依赖 (deps) 调试的小技巧
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
thumbnail: https://s1.ax1x.com/2023/08/12/pPu1lLR.png
date: 2023-08-12 16:15:40
tags: [Elixir, Deps, Mix]
categories: Elixir
keywords: "Elixir, Mix Deps, Debug"
description: "Elixir 依赖 (deps) 调试的小技巧"
---

许久未更博客，“微有所感”，小更一篇。

最近使用 Elixir 有点多, 经常需要观察一些依赖 (Deps) 的实现, 比如想加个日志打印点 `IO.inspect` 啥的观察下某个变量，才能更好的理解某个 Elixir 的依赖。这里介绍下一些调试的方式:

这里以 [yeshan333/ex_integration_coveralls](https://github.com/yeshan333/ex_integration_coveralls) 为例子.

我们先 clone 项目到本地:

```shell
git clone git@github.com:yeshan333/ex_integration_coveralls.git
cd ex_integration_coveralls
# 拉一下依赖
mix deps.get
```

比如, 我们想看一下代码扫描的依赖 `credo` 这个扫描规则 `Credo.Check.Design.TagTODO` 的实现大概是怎么样的.

## 1、mix deps.compile

找到它的实现 `deps/credo/lib/credo/check/design/tag_todo.ex`, 我们想要观察下变量 issue_meta 实际是怎么样的, `IO.inspect` 一下.

```elixir
  @doc false
  @impl true
  def run(%SourceFile{} = source_file, params) do
    issue_meta = IssueMeta.for(source_file, params)
    include_doc? = Params.get(params, :include_doc, __MODULE__)

    IO.inspect(issue_meta, label: "观察下 issue_meta 放的什么")

    source_file
    |> TagHelper.tags(@tag_name, include_doc?)
    |> Enum.map(&issue_for(issue_meta, &1))
  end
```

![加入观察点](https://s1.ax1x.com/2023/08/12/pPuQUAK.png)

好了，接下来我们重编译一下 credo 模块即可:

```shell
❯ mix deps.compile credo # 重编译下 credo
==> credo
Compiling 1 file (.ex)
```

调用下 credo 即可观察到我们埋下的变量打印点信息:

```shell
mix credo
```

![埋点效果](https://s1.ax1x.com/2023/08/12/pPuQv34.png)

这样每次添加依赖观察点之后, 我们只需要 recompile 下依赖即可.

```shell
# 如果想废弃掉我们对依赖的修改，只需要重新拉去依赖即可
mix deps.clean credo
mix deps.get
```

## 2、mix.exs 使用 :path 引用依赖

上面的方法经常需要手动重新编译指定的依赖, 这里还有个方式可以在我们使用任意 [Mix Tasks](https://hexdocs.pm/mix/1.15.0/api-reference.html#mix-tasks) 的时候，依赖都会**自动重新编译**, 我们只需要编译 `mix.exs` 将依赖指定为本地即可, 我们使用 path 指定依赖来源:

```elixir
      {:credo, "~> 1.6", only: [:dev, :test], runtime: false, path: "deps/credo"},
```

![依赖来源为本地](https://s1.ax1x.com/2023/08/12/pPul7xH.png)


