---
title: (译) Understanding Elixir Macros, Part 4 - Diving Deeper
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-06-19 12:02:19
tags: Elixir-Macros
categories: Elixir
keywords: "Elixir Macros"
---

在前一篇文章中, 我向你展示了分析输入 AST 并对其进行处理的一些基本方法. 今天我们将研究一些更复杂的 AST 转换. 这将重提已经解释过的技术. 这样做的目的是为了表明深入研究 AST 并不是很难的, 尽管最终的结果代码很容易变得相当复杂, 而且有点黑科技（hacky).

## 追踪函数调用

在本文中, 我们将创建一个宏 `deftraceable`, 它允许我们定义可跟踪的函数. 可跟踪函数的工作方式与普通函数一样, 但每当我们调用它时, 都会打印出调试信息. 大致思路是这样的:

```elixir
defmodule Test do
  import Tracer

  deftraceable my_fun(a,b) do
    a/b
  end
end

Test.my_fun(6,2)

# => test.ex(line 4) Test.my_fun(6,2) = 3
```

这个例子当然是虚构的. 你不需要设计这样的宏, 因为 Erlang 已经有非常强大的[跟踪功能](https://www.erlang.org/doc/man/dbg.html), 而且有一个 [Elixir 包](https://github.com/fishcakez/dbg)可用. 然而, 这个例子很有趣, 因为它需要一些更深层次的 AST 转换技巧.

在开始之前, 我要再提一次, 你应该仔细考虑你是否真的需要这样的结构. 例如 `deftraceable` 这样的宏引入了一个每个代码维护者都需要了解的东西. 看着代码, 它背后发生的事不是显而易见的. 如果每个人都设计这样的结构, 每个 Elixir 项目都会很快地变成自定义语言的大锅汤. 当代码主要依赖于复杂的宏时, 即使对于有经验的开发人员, 即使是有经验的开发人员也很难理解严重依赖于复杂宏的底层代码的流程.

但是在适合使用宏的情况下, 你不应该仅仅因为有人声称宏是不好的, 就不使用它. 例如, 如果在 Erlang 中没有跟踪功能, 我们就需要设计一些宏来帮助我们（实际上不需要类似上述的例子, 但那是另外一个话题）, 否则我们的代码就会有大量重复的模板代码.

在我看来, 模板代码太多是不好的, 因为代码中有了太多形式化的噪音, 因此更难阅读和理解. 宏有助于减少这些噪声, 但在使用宏之前, 请先考虑是否可以使用运行时结构（函数, 模块, 协议）来解决重复.

看完这个长长的免责声明, 让我们开始实现 `deftraceable`吧. 首先, 手动生成对应的代码.

让我们回顾下用法:

```elixir
deftraceable my_fun(a,b) do
  a/b
end
```

生成的代码类似于这样:

```elixir
def my_fun(a, b) do
  file = __ENV__.file
  line = __ENV__.line
  module = __ENV__.module
  function_name = "my_fun"
  passed_args = [a,b] |> Enum.map(&inspect/1) |> Enum.join(",")

  result = a/b

  loc = "#{file}(line #{line})"
  call = "#{module}.#{function_name}(#{passed_args}) = #{inspect result}"
  IO.puts "#{loc} #{call}"

  result
end
```

这个想法很简单. 我们从编译器环境中获取各种数据, 然后计算结果, 最后将所有内容打印到屏幕上.

该代码依赖于 `__ENV__` 特殊形式, 可用于在最终 AST 中注入各种编译时信息(例如行号和文件). `__ENV__` 是一个结构体, 每当你在代码中使用它时, 它将在编译时扩展为适当的值.  因此, 只要在代码中写入 `__ENV__.file`.  文件生成的字节码将包含包含文件名的(二进制)字符串常量.

现在我们需要动态构建这个代码. 让我们来看看大概的样子（outline）：

```elixir
defmacro deftraceable(??) do
  quote do
    def unquote(head) do
      file = __ENV__.file
      line = __ENV__.line
      module = __ENV__.module
      function_name = ??
      passed_args = ?? |> Enum.map(&inspect/1) |> Enum.join(",")

      result = ??

      loc = "#{file}(line #{line})"
      call = "#{module}.#{function_name}(#{passed_args}) = #{inspect result}"
      IO.puts "#{loc} #{call}"

      result
    end
  end
end
```

这里我们在需要基于输入参数动态注入 AST 片段的地方放置问号（??）. 特别地, 我们必须从传递的参数中推导出函数名、参数名和函数体.

现在, 当我们调用宏 `deftraceable my_fun(...) do ... end`, 宏接收两个参数 — 函数头（函数名和参数列表）和包含函数体的关键字列表. 这些都是被 quoted 的.

我是如何知道的？其实我不知道. 我一般通过不断试错来获得的这些信息. 基本上, 我从定义一个宏开始：

```elixir
defmacro deftraceable(arg1) do
  IO.inspect arg1
  nil
end
```

然后我尝试从一些测试模块或 shell 中调用宏. 我将通过向宏定义中添加另一个参数来测试. 一旦我得到结果, 我会试图找出参数表示什么, 然后开始构建宏.

宏结束处的 `nil` 确保我们不生成任何东西（我们生成的 `nil` 通常与调用者代码无关）. 这允许我进一步构建片段而不注入代码. 我通常依靠 `IO.inspect`和 `Macro.to_string/1` 来验证中间结果, 一旦我满意了, 我会删除 `nil` 部分, 看看是否能工作.

此时 `deftraceable` 接收函数头和身体. 函数头将是一个我们之前描述的结构的 AST 片段：

```elixir
{function_name, context, [arg1, arg2, ...]
```

所以接下来我们需要：

- 从 quoted 的头中提取函数名和参数
- 将这些值注入我们的宏返回的 AST 中
- 将函数体注入同一个 AST
- 打印跟踪信息

我们可以使用模式匹配从这个 AST 片段中提取函数名和参数, 有一个 `Macro.decompose_call/1` 的辅助功能函数可以帮我们做到. 做完这些步骤, 宏的最终版本实现如下所示：

```elixir
defmodule Tracer do
  defmacro deftraceable(head, body) do
    # 提取函数名和参数
    {fun_name, args_ast} = Macro.decompose_call(head)

    quote do
      def unquote(head) do
        file = __ENV__.file
        line = __ENV__.line
        module = __ENV__.module

        # 注入函数名和参数到 AST 中
        function_name = unquote(fun_name)
        passed_args = unquote(args_ast) |> Enum.map(&inspect/1) |> Enum.join(",")

        # 将函数体注入到 AST
        result = unquote(body[:do])

        # 打印 trace 跟踪信息
        loc = "#{file}(line #{line})"
        call = "#{module}.#{function_name}(#{passed_args}) = #{inspect result}"
        IO.puts "#{loc} #{call}"

        result
      end
    end
  end
end
```

让我们试一下：

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          deftraceable my_fun(a,b) do
            a/b
          end
        end

iex(3)> Test.my_fun(10,5)
iex(line 4) Test.my_fun(10,5) = 2.0   # trace output
2.0
```

这似乎起作用了. 然而, 我应该立即指出, 这种实现存在一些问题:

- 宏不能很好地处理守卫（guards）
- 模式匹配参数并不总是有效的（例如, 当使用 _ 来匹配任何 term 时）
- 在模块中直接动态生成代码时, 宏不起作用.

我将逐一解释这些问题, 首先从守卫（guards）开始, 其余问题留待以后的文章再讨论.

## 处理 guards （守卫）

所有具有可追溯性的问题都源于我们对输入 AST 做了一些事实假设. 这是一个危险的领域, 我们必须小心地涵盖所有情况.

例如, 宏假设 head 只包含函数名称和参数列表. 因此, 如果我们想定义一个带守卫的可跟踪函数, `deftraceable` 将不起作用:

```elixir
deftraceable my_fun(a,b) when a < b do
  a/b
end
```

在这种情况下, 我们的头部（宏的第一个参数）也将包含守卫（guards）的信息, 并且不能被 `macro .decompose_call/1` 解析. 解决方案是检测这种情况, 并以一种特殊的方式处理它.

首先, 让我们来看看这个 head 是如何被 quoted 的:

```elixir
iex(16)> quote do my_fun(a,b) when a < b end
{:when, [],
 [
   {:my_fun, [],
    [{:a, [if_undefined: :apply], Elixir}, {:b, [if_undefined: :apply], Elixir}]},
   {:<, [context: Elixir, import: Kernel],
    [{:a, [if_undefined: :apply], Elixir}, {:b, [if_undefined: :apply], Elixir}]}
 ]}
```

所以实际上我们的 guard head 实际上是这样的: `{:when, _, [name_and_args, ...]}`, 我们可以依靠它来使用模式匹配提取函数名称和参数:

```elixir
defmodule Tracer do
  ...
  defp name_and_args({:when, _, [short_head | _]}) do
    name_and_args(short_head)
  end

  defp name_and_args(short_head) do
    Macro.decompose_call(short_head)
  end
  ...
```

当然, 我们需要从宏中调用这个函数:

```elixir
defmodule Tracer do
  ...
  defmacro deftraceable(head, body) do
    {fun_name, args_ast} = name_and_args(head)

    ... # 不变
  end
  ...
end
```

如您所见, 可以定义额外的私有函数并从宏调用它们. 毕竟, 宏只是一个函数, 当调用它时, 包含的模块已经编译并加载到编译器的 VM 中(否则, 宏无法运行).

以下是宏 `deftraceable` 的完整版本:

```elixir
defmodule Tracer do
  defmacro deftraceable(head, body) do
    {fun_name, args_ast} = name_and_args(head)

    quote do
      def unquote(head) do
        file = __ENV__.file
        line = __ENV__.line
        module = __ENV__.module

        function_name = unquote(fun_name)
        passed_args = unquote(args_ast) |> Enum.map(&inspect/1) |> Enum.join(",")

        result = unquote(body[:do])

        loc = "#{file}(line #{line})"
        call = "#{module}.#{function_name}(#{passed_args}) = #{inspect result}"
        IO.puts "#{loc} #{call}"

        result
      end
    end
  end

  defp name_and_args({:when, _, [short_head | _]}) do
    name_and_args(short_head)
  end

  defp name_and_args(short_head) do
    Macro.decompose_call(short_head)
  end
end
```

让我们来试验一下:

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          deftraceable my_fun(a,b) when a<b do
            a/b
          end

          deftraceable my_fun(a,b) do
            a/b
          end
        end

iex(3)> Test.my_fun(5,10)
iex(line 4) Test.my_fun(5,10) = 0.5
0.5

iex(4)> Test.my_fun(10, 5)
iex(line 7) Test.my_fun(10,5) = 2.0
```

这个练习的主要目的是说明可以从输入 AST 中推断出一些东西. 在这个例子中, 我们设法检测和处理函数 guards. 显然, 因为它依赖于 AST 的内部结构, 代码变得更加复杂了. 在这种情况下, 代码依旧比较简单, 但你将在后面的文章中看到我是如何解决 `deftraceable` 宏剩余的问题的, 事情可能很快变得杂乱起来了.

