---
title: (译) Understanding Elixir Macros, Part 3 - Getting into the AST
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-06-19 10:53:07
tags: Elixir-Macros
categories: Elixir
keywords: "Elixir Macros"
---

是时候继续探索 Elixir 的宏了. 上次我介绍了一些关于宏的基本原理, 今天, 我将进入一个较少谈及的领域, 并讨论Elixir AST 的一些细节.

## 跟踪函数调用

到目前为止, 你只看到了接受输入 AST 片段并将它们组合在一起的基础宏, 并在输入片段周围或之间添加了一些额外的样板代码. 由于我们不分析或解析输入的 AST, 这可能是最干净(或最不 hackiest)的宏编写风格, 这样的宏相当简单且容易理解.

然而, 有时候我们需要解析输入的 AST 片段以获取某些特殊信息. 一个简单的例子是 `ExUnit` 的断言. 例如, 表达式`assert 1+1 == 2+2` 会出现这个错误:

```elixir
Assertion with == failed
code: 1+1 == 2+2
lhs:  1
rhs:  2
```

这个宏 `assert` 接收了整个表达式 `1+1 == 2+2`, 然后从中分出独立的表达式用来比较, 如果整个表达式返回 `false`, 则打印它们对应的结果. 所以, 宏的代码必须想办法将输入的 AST 分解为几个部分并分别计算子表达式.

更多时候, 我们调用了更复杂的 AST 变换. 例如,  你可以借助 `ExActor` 这样做:

```elixir
defcast inc(x), state: state, do: new_state(state + x)
```

它会被转换为大致如下的形

```elixir
def inc(pid, x) do
  :gen_server.cast(pid, {:inc, x})
end

def handle_cast({:inc, x}, state) do
  {:noreply, state+x}
end
```

和 `assert` 一样, 宏 `defcast` 需要深入输入的 AST 片段, 并找出每个子片段（例如, 函数名, 每个参数）. 然后, `ExActor` 执行一个精巧的变换, 将各个部分重组成一个更加复杂的代码.

今天, 我将想你展示构建这类宏的基础技术, 我也会在之后的文章中将变换做得更复杂. 但在此之前, 我要请你认真考虑一下你的代码是否有有必要基于宏. 尽管宏十分强大, 但也有缺点.

首先, 就像之前我们看到的那样, 比起那些普通的运行时抽象, 宏的代码会很快地变得非常多. 你可以依赖没有文档格式的AST 来快速完成许多嵌套的 quote/unquoted 调用, 以及奇怪的模式匹配.

此外, 宏的滥用可能使你的客户端代码极其难懂, 因为它将依赖于自定义的非标准习惯用法（例如 `ExActor` 的 `defcast`）. 这使得理解代码和了解底层究竟发生了什么变得更加困难.

从好的方面来看, 宏在删除样板代码时非常有用(正如 `ExActor` 示例所展示的那样), 并且具有访问运行时不可用的信息的能力(正如您应该从 `assert` 示例中看到的那样).  最后, 由于宏在编译期间运行, 因此可以通过将计算转移到编译时来优化一些代码.

因此, 肯定会有适合宏的情况, 您不应该害怕使用它们.  但是, 您不应该仅仅为了获得一些可爱的 dsl 式语法而选择宏.  在使用宏之前, 应该考虑是否可以依靠“标准”语言抽象（如函数、模块和协议）在运行时有效地解决问题.

## 探索 AST 结构

目前, 关于 AST 结构的文档不多. 然而, 在 shell 会话中可以很简单地探索和使用 AST, 我通常就是这样探索 AST 结构的.

例如, 这里有一个关于变量的 quoted

```elixir
iex(1)> quote do my_var end
{:my_var, [if_undefined: :apply], Elixir}
```

在这里, 第一个元素代表变量的名称；第二个元素是上下文关键字列表, 它包含了该 AST 片段的元数据（例如 imports 和 aliases）. 通常你不会对上下文数据感兴趣；第三个元素通常代表 quoted 发生的模块, 同时也用于确保 quoted 变量的 hygienic. 如果该元素为 `nil`, 则该标识符是不 hygienic 的.

一个简单的表达式看起来包含了许多东西:

```elixir
iex(2)> quote do a+b end
{:+, [context: Elixir, import: Kernel],
 [{:a, [if_undefined: :apply], Elixir}, {:b, [if_undefined: :apply], Elixir}]}
```

看起来可能很复杂, 但是如果我向你展示更高层次的模式, 就很容易理解:

```elixir
{:+, context, [ast_for_a, ast_for_b]}
```

在我们的例子中, `ast_for_a` 和 `ast_fot_b` 遵循着你之前所看到的变量的形状（如 `{:a, [if_undefined: :apply], Elixir}`）. 一般, quoted 的参数可以是任意复杂的, 因为它们描述了每个参数的表达式. 事实上, AST 是一个简单 quoted expression 的深层结构, 就像我给你展示的那样.

让我们看一个关于函数的调用例子:

```elixir
iex(3)> quote do div(5,4) end
{:div, [context: Elixir, import: Kernel], [5, 4]}
```

这类似于 quoted `+` 的操作, 我们知道 `+` 实际上是[一个函数](https://github.com/elixir-lang/elixir/blob/7e4fbe657dbf9c3e19e3d2bd6c17cc6d724b4710/lib/elixir/lib/kernel.ex#L1309). 事实上, 所有二进制运算符都会像函数调用一样被 quoted.

最后, 让我们来看一个被 quoted 的函数定义:

```elixir
iex(4)> quote do def my_fun(arg1, arg2), do: :ok end
{:def, [context: Elixir, import: Kernel],
 [
   {:my_fun, [context: Elixir],
    [
      {:arg1, [if_undefined: :apply], Elixir},
      {:arg2, [if_undefined: :apply], Elixir}
    ]},
   [do: :ok]
 ]}
```

看起来有点吓人, 但可以只看重要的部分来简化它. 事实上, 这种深层结构相当于:

```elixir
{:def, context, [fun_call, [do: body]]}
```

`fun_call` 是一个函数调用的结构（正如之前你看过的那样）.

如你所见, AST 背后通常有一些逻辑和意义. 我不会在这里写出所有 AST 的形状, 但会在 iex 中尝试你感兴趣的简单的结构来探索 AST. 这是一个逆向工程, 但不是火箭科学.

## 写一个 assert 宏

为了快速演示, 让我们编写一个简化版的 `assert` 宏. 这是一个有趣的宏, 因为它重新解释了比较操作符的含义. 通常, 当你写下 `a == b`时, 你会得到一个布尔结果. 但是, 当将此表达式给 `assert` 宏时, 如果表达式的计算结果为 `false`, 则会打印详细的输出.

我将从简单的部分开始, 首先在宏里只支持 `==` 运算符. 可以知道, 我们调用 `assert expected == required` 时, 等同于调用 `assert(expect == required)`, 这意味着我们的宏接收到一个表示比较的引用片段. 让我们来探索这个比较的 AST 结果:

```elixir
iex(1)> quote do 1 == 2 end
{:==, [context: Elixir, import: Kernel], [1, 2]}

iex(2)> quote do a == b end
{:==, [context: Elixir, import: Kernel],
 [{:a, [if_undefined: :apply], Elixir}, {:b, [if_undefined: :apply], Elixir}]}
```

所以我们的结构本质上是 `{:==, context, [quoted_lhs, quoted_rhs]}`. 如果你记住了前面章节中所演示的例子, 那么就不会感到意外, 因为我提到过二进制运算符是作为二个参数的函数被 quoted.

知道了 AST 的形状, 实现这个宏就很简单:

```elixir
defmodule Assertions do
  defmacro assert({:==, _, [lhs, rhs]} = expr) do
    quote do
      left = unquote(lhs)
      right = unquote(rhs)

      result = (left == right)

      unless result do
        IO.puts "Assertion with == failed"
        IO.puts "code: #{unquote(Macro.to_string(expr))}"
        IO.puts "lhs: #{left}"
        IO.puts "rhs: #{right}"
      end

      result
    end
  end
end
```

第一个有趣的事情发生在第 2 行. 注意我们是如何对输入表达式进行模式匹配的, 希望它符合某种结构. 这完全没问题, 因为宏是函数, 这意味着您可以依赖于模式匹配、guards（守卫）, 甚至有多子句宏. 在我们的例子中, 我们依靠模式匹配将比较表达式的每一边（被 quoted 的）带入相应的变量.

然后, 在 quoted 的代码中, 我们通过分别计算左边和右边重新解释 `==` 操作（第 4 行和第 5 行）, 然后是整个结果（第 7 行）. 最后, 如果结果为假, 我们打印详细信息（第 9-14 行）.

来试一下:

```elixir
iex(1)> defmodule Assertions do ... end
iex(2)> import Assertions

iex(3)> assert 1+1 == 2+2
Assertion with == failed
code: 1 + 1 == 2 + 2
lhs: 2
rhs: 4
false
```

## 将代码通用化

将之前的代码用到其他的运算操作符并不困难:

```elixir
defmodule Assertions do
  defmacro assert({operator, _, [lhs, rhs]} = expr)
    when operator in [:==, :<, :>, :<=, :>=, :===, :=~, :!==, :!=, :in] do
      quote do
        left = unquote(lhs)
        right = unquote(rhs)

        result = unquote(operator)(left, right)

        unless result do
          IO.puts("Assertion with #{unquote(operator)} failed")
          IO.puts("code: #{unquote(Macro.to_string(expr))}")
          IO.puts("lhs: #{left}")
          IO.puts("rhs: #{right}")
        end

      result
    end
  end
end
```

这里只有一点点变化. 首先, 在模式匹配中, 硬编码（hard code） `:==` 被变量 `operator` 取代了（第 2 行）.

我还引入（实际上, 是从 Elixir 源代码中复制粘贴了）guard 语句指定了宏能处理的运算符集（第 3 行）. 这个检查有一个特殊原因. 还记得我之前提到的, quoted `a + b`（或任何其它的二进制操作）的形状等同于引用 `fun(a, b)`. 因此, 没有这些 `guard` 语句, 任何双参数的函数调用都会在我们的宏中结束, 这可能是我们不想要的. 使用这个 guard 语句能将输入限制在已知的二进制运算符中.

有趣的事情发生在第 9 行. 在这里我使用了 `unquote(operator)(left, right)` 来对操作符进行简单的泛型分派. 你可能认为我可以使用 `left unquote(operator) right` 来替代, 但它并不能运算. 原因是 `operator` 变量保存的是一个原子（如`:==`）. 因此, 这个天真的 quoted 会产生 `left :== right`, 这甚至不符合 Elixir 的语法规定.

记住, 在 quoted 时, 我们不组装字符串, 而是组装 AST 片段. 所以, 当我们想生成一个二进制操作代码时, 我们需要注入一个正确的 AST, 它（如前所述）与双参数的函数调用相同. 因此, 我们可以简单地使用函数调用的方式 `unquote(operator)(left, right)`.

这一点讲完了, 今天的这一章也该结束了. 它有点短, 但略微复杂些. 下一章, 我将深入 AST 解析的话题.



