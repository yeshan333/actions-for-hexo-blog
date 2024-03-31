---
title: (译) Understanding Elixir Macros, Part 6 - In-place Code Generation
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-06-19 17:47:21
tags: Elixir-Macros
categories: Elixir
keywords: "Elixir Macros"
---

> Elixir Macros 系列文章译文
> - [1] [(译) Understanding Elixir Macros, Part 1 Basics](https://shan333.cn/2022/06/18/understanding-elixir-macros-part-1-basics/)
> - [2] [(译) Understanding Elixir Macros, Part 2 - Micro Theory](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-2-macro-theory/)
> - [3] [(译) Understanding Elixir Macros, Part 3 - Getting into the AST](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-3-getting-into-the-ast/)
> - [4] [(译) Understanding Elixir Macros, Part 4 - Diving Deeper](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-4-diving-deeper/)
> - [5] [(译) Understanding Elixir Macros, Part 5 - Reshaping the AST](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-5-reshaping-the-ast/)
> - [6] [(译) Understanding Elixir Macros, Part 6 - In-place Code Generation](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-6-in-place-code-generation/)
> 原文 [GitHub](https://github.com/sasa1977/erlangelist/blob/master/site/articles/macros_1.md) 仓库, 作者: Saša Jurić.

这是宏系列文章的最后一篇. 在开始之前, 我想提一下 Björn Rochel, 他已经将他的 [Apex](https://github.com/BjRo/apex) 库中的 `deftraceable` 宏改进了. 因为他发现系列文章中 `deftraceable` 的版本不能正确处理默认参数`（arg \ def_value)`, 于是做了一个修复 [bugfix](https://github.com/BjRo/apex/blob/ca3cfbcf4473a4314d8dfa7f4bed610be652a03b/lib/apex/awesome_def.ex#L57-L59).

这次, 让我们结束这个宏的故事. 今天的文章知识点可能是整个系列中涉及最广的, 我们将讨论原地代码生成的相关技术, 以及它可能对宏的影响.

## 在模块 module 中生成代码

正如我在第 1 章中提到的那样, 宏并不是 Elixir 中唯一的元编程机制. 我们也可以在模块中直接生成代码. 为了唤起你的记忆, 我们来看看下面的例子:

```shell
defmodule Fsm do
  fsm = [
    running: {:pause, :paused},
    running: {:stop, :stopped},
    paused: {:resume, :running}
  ]

  # Dynamically generating functions directly in the module
  for {state, {action, next_state}} <- fsm do
    def unquote(action)(unquote(state)), do: unquote(next_state)
  end
  def initial, do: :running
end

Fsm.initial
# :running

Fsm.initial |> Fsm.pause
# :paused

Fsm.initial |> Fsm.pause |> Fsm.pause
# ** (FunctionClauseError) no function clause matching in Fsm.pause/1
```

在这里, 我们直接在模块中动态生成函数子句（clause）. 这允许我们针对某些输入（在本例中是关键字列表）进行元编程, 并生成代码, 而无需编写专门的宏.

注意, 在上面的代码中, 我们如何使用 `unquote` 将变量注入到函数子句定义中. 这与宏的工作方式完全一致. 请记住, `def` 也是一个宏, 并且宏接收的参数总是被 `quoted`. 因此, 如果您想要一个宏参数接收某个变量的值, 您必须在传递该变量时使用 `unquote`. 仅仅调用 `def action` 是不够的, 因为 `def` 宏接收到的是对 `action` 的 unquoted, 而不是变量 `action` 中的值.

当然, 您可以以这种动态的方式调用自己的宏, 原理是一样的. 然而, 有一个意想不到的情况 — 生成（evaluation） 的顺序与你的预期可能不符.

## 展开的顺序

正如你所预料的那般, 模块级代码（不是任何函数的一部分的代码）在 Elixir 编译过程的展开阶段被执行. 有些令人意外的是, 这将发生在所有宏（除了 `def`）展开之后. 很容易去证明这一点：

```elixir
iex(1)> defmodule MyMacro do
          defmacro my_macro do
            IO.puts "my_macro called"
            nil
          end
        end

iex(2)> defmodule Test do
          import MyMacro

          IO.puts "module-level expression"
          my_macro
        end

# Output:
my_macro called
module-level expression
```

从输出看出, 即使代码中相应的 `IO.puts` 调用在宏调用之前, 但 `mymacro` 还是在 `IO.puts` 之前被调用了. 这证明编译器首先解析所有标准宏. 然后开始生成模块, 也是在这个阶段, 模块级代码以及对 `def` 的调用被执行.

## 模块级友好宏

这对我们自己的宏有一些重要的影响. 例如, 我们的 `deftraceable` 宏也可以动态调用. 但是, 现在它还不能工作：

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          fsm = [
            running: {:pause, :paused},
            running: {:stop, :stopped},
            paused: {:resume, :running}
          ]

          for {state, {action, next_state}} <- fsm do
            # Using deftraceable dynamically
            deftraceable unquote(action)(unquote(state)), do: unquote(next_state)
          end
          deftraceable initial, do: :running
        end

** (MatchError) no match of right hand side value: :error
    expanding macro: Tracer.deftraceable/2
    iex:13: Test (module)
```

出现一个有点神秘, 而且不是非常有帮助的错误提示. 那么出了什么问题？如上一节所述, 在 in-place 本地模块执行开始之前, 将进行宏展开. 对我们来说, 这意味着 `deftraceable` 被调用之前, `for` 语境甚至还没有执行.

因此, 即使它是从当前语境中调用, `deftraceable` 实际上将只被调用一次. 此外, 由于未对当前语境进行求值, 因此当我们的宏被调用时, 内部变量 `state`, `action` 和 `next_state` 都不存在.

怎么可以让它工作？本质上, 我们的宏将靠 `unquote` 来调用 - head 和 body 将分别包含代表 `unquote(action)(unquote(state))` 和 `unquote(next_state)`的 AST.

现在, 回想一下当前版本的 `deftraceable`, 我们对宏中的输入做了一些假设. 这里是一段伪代码：

```elixir
defmacro deftraceable(head, body) do
  # 这里, 我们假设输入头部是什么样的, 并执行一些操作
  # AST 转换基于这些假设.

  quote do
    ...
  end
end
```

这就是我们的问题. 如果我们在原地生成代码的同时动态地调用 `deftraceable`, 那么这样的假设就不再成立.

## 延迟代码生成

当宏执行时, 区分宏上下文和调用者的上下文是很重要的:

```elixir
defmacro my_macro do
  # Macro context（宏上下文）: 这里的代码是宏的正常部分, 并在宏运行时被执行

  quote do
    # Caller's context（调用者上下文）: 生成的代码在宏所在的位置运行
  end
```

这就是让事情变得有点棘手的地方. 如果我们想支持对宏的模块级动态调用, 就不应该在宏上下文中做任何假定. 相反, 我们应该将代码生成推迟到调用方的上下文中.

用这段代码说明：

```elixir
defmacro deftraceable(head, body) do
  # Macro context: 我们不应该对输入 AST 做任何假设

  quote do
    # Caller's context: 我们应该在这里转换输入的 AST, 然后在这里做出我们的假设
  end
end
```

为什么我们可以在调用者的上下文（Caller's context）中进行假设? 因为这段代码将在所有宏展开后运行. 例如, 请记住, 即使我们的宏是从一个推导式中调用的, 它也只会被调用一次. 但是, 宏生成的代码将在推导式中运行 — 对每个元素运行一次.

因此, 这种方法相当于推迟了最终的代码生成. 我们生成的中间模块级语句将生成最终代码, 而不是立即生成目标代码. 这些中间语句将在扩展的最后时刻运行, 在所有其他宏都已处理之后:

```elixir
defmodule Test do
  ...

  for {state, {action, next_state}} <- fsm do
    # 在 deftraceable 扩展后, 这里我们将得到一个
    # 生成在目标函数的代码, 此代码会被推导式执行.
    # 即在每一次 for 循环中被调用一次.
    # 此时, 我们在调用者的上下文中,
    # 并且可以访问 state、action和 next_state 变量
    # 正确生成相应的函数.
  end

  ...
end
```

在实现解决方案之前, 必须注意到这不是一个通用的模式, 你应该考虑是否真的需要这个方法.

如果你的宏不打算用于模块级别, 那么你可能应该避免使用这种技术. 否则, 如果从函数定义内部调用宏, 并且将代码生成操作移动到调用者的上下文中, 那么实际上将代码执行从编译时（compile-time）移动到了运行时（run-time）, 这会影响到性能.

此外, 即使你的宏是在模块级别上运行的, 只要你对输入不做任何假定, 就没有必要使用这项技巧. 例如, 在第 2 章中, 我们模拟了 Plug 的 `get` 宏:

```elixir
defmacro get(route, body) do
  quote do
    defp do_match("GET", unquote(route), var!(conn)) do
      unquote(body[:do])
    end
  end
end
```

即使这个宏在模块级上工作, 它并没有假设 AST 的结构, 只是在调用者的上下文中注入输入片段, 并散布一些样板代码. 当然, 我们希望 body 会有一个 `:do` 选项, 但我们并没有对 `body[:do]` AST 的具体形状和结构作任何假定.

总结一下, 如果你的宏是在模块级别调用的, 这可能是通用的模式:

```elixir
defmacro ...
  # 宏上下文（Macro context）:
  # 可以在这里做任何准备工作,
  # 只要不对输入的 AST 作任何假设

  quote do
    # 调用者上下文（Caller's context）:
    # 如果你需要分析或转换输入的 AST, 你应该在这里进行.
  end
```

由于调用者上下文（Caller's context）是模块级的, 因此这种延迟转换仍将在编译时发生, 不会有运行时性能损失.

## 解决方案

鉴于这些讨论, 解决方案相对简单, 但解释它相当复杂. 所以我将从展示最终的结果开始（注意注释）:

```elixir
defmodule Tracer do
  defmacro deftraceable(head, body) do
    ＃ 这是最重要的更改, 让我们能正确传递
    ＃ 输入 AST 到调用者的上下文中. 我稍后会解释这是如何工作的.
    quote bind_quoted: [
      head: Macro.escape(head, unquote: true),
      body: Macro.escape(body, unquote: true)
    ] do
      # Caller's context: 我们将从这里生成代码

      ＃ 由于代码生成被推迟到调用者上下文,
      ＃ 我们现在可以对输入 AST 做出我们的假设.

      ＃ 此代码大部分与以前的版本相同
      ＃
      ＃ 注意, 这些变量现在在调用者的上下文中创建
      {fun_name, args_ast} = Tracer.name_and_args(head)
      {arg_names, decorated_args} = Tracer.decorate_args(args_ast)

      # 与以前的版本完全相同.
      head = Macro.postwalk(head,
        fn
          ({fun_ast, context, old_args}) when (
            fun_ast == fun_name and old_args == args_ast
          ) ->
            {fun_ast, context, decorated_args}
          (other) -> other
      end)

      # 此代码与以前的版本完全相同.
      # Note: 但是, 请注意, 代码像前面三个表达式那样
      # 在相同的上下文中执行.
      #
      # 因此,  unquote(head) 在这里引用了 head 变量
      # 在此上下文中计算, 而不是宏上下文.
      # 这同样适用于其它发生在函数体中的 unquote.
      #
      # 这就是延迟代码生成的意义所在. 我们的宏产生
      # 此代码, 然后依次生成最终代码.
      def unquote(head) do
        file = __ENV__.file
        line = __ENV__.line
        module = __ENV__.module

        function_name = unquote(fun_name)
        passed_args = unquote(arg_names) |> Enum.map(&inspect/1) |> Enum.join(",")

        result = unquote(body[:do])

        loc = "#{file}(line #{line})"
        call = "#{module}.#{function_name}(#{passed_args}) = #{inspect result}"
        IO.puts "#{loc} #{call}"

        result
      end
    end
  end

  # 与前一个版本相同, 但函数被导出, 因为它们
  # 必须从调用方的上下文中调用.
  def name_and_args({:when, _, [short_head | _]}) do
    name_and_args(short_head)
  end

  def name_and_args(short_head) do
    Macro.decompose_call(short_head)
  end

  def decorate_args([]), do: {[],[]}
  def decorate_args(args_ast) do
    for {arg_ast, index} <- Enum.with_index(args_ast) do
      arg_name = Macro.var(:"arg#{index}", __MODULE__)

      full_arg = quote do
        unquote(arg_ast) = unquote(arg_name)
      end

      {arg_name, full_arg}
    end
    |> Enum.unzip
  end
end
```

让我们试试这个宏:、

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          fsm = [
            running: {:pause, :paused},
            running: {:stop, :stopped},
            paused: {:resume, :running}
          ]

          for {state, {action, next_state}} <- fsm do
            deftraceable unquote(action)(unquote(state)), do: unquote(next_state)
          end
          deftraceable initial, do: :running
        end

iex(3)> Test.initial |> Test.pause |> Test.resume |> Test.stop

iex(line 15) Elixir.Test.initial() = :running
iex(line 13) Elixir.Test.pause(:running) = :paused
iex(line 13) Elixir.Test.resume(:paused) = :running
iex(line 13) Elixir.Test.stop(:running) = :stopped
```

正如你所看到的那样, 修改并不复杂. 我们设法保持我们的大部分代码完整, 虽然我们不得不用一些技巧：`bind_quoted：true` 和 `Macro.escape`:

```elixir
quote bind_quoted: [
  head: Macro.escape(head, unquote: true),
  body: Macro.escape(body, unquote: true)
] do
  ...
end
```

让我们仔细看看它们是什么意思.

## bind_quoted

记住, 我们的宏生成一个代码, 它将生成最终的代码. 在第一级生成的代码（由我们的宏返回的代码）的某处, 我们需要放置以下表达式：

```elixir
def unquote(head) do ... end
```

这个表达式将在调用者的上下文（客户端模块）中被调用, 它的任务是生成函数. 如在注释中提到的, 重要的是要理解 `unquote(head)` 在这里引用的是存在于调用者上下文中的 head 变量. 我们不是从宏上下文注入一个变量, 而是一个存在于调用者上下文中的变量.

但是, 我们不能使用简单的 `quote` 生成这样的表达式：

```elixir
quote do
  def unquote(head) do ... end
end
```

记住 `unquote` 如何工作. 它往 `unquote` 调用里的 `head` 变量中注入了 AST. 这不是我们想要的. 我们想要的是生成表示对 `unquote` 的调用的 AST, 然后在调用者的上下文中执行, 并引用调用者的 `head` 变量.

这可以通过提供 `unquote：false` 选项来实现：

```elixir
quote unquote: false do
  def unquote(head) do ... end
end
```

这里, 我们将生成代表 `unquote` 调用的代码. 如果这个代码被注入到正确的地方, 且其中变量 `head` 存在, 我们将最终调用 `def` 宏, 传递 `head` 变量中的任何值.

所以似乎使用 `unquote: false` 可以达到我们想要的效果, 但有一个缺点, 我们不能从宏上下文访问任何变量：

```elixir
foo = :bar
quote unquote: false do
  unquote(foo)    # <- 由于 unquote: false, 工作不正常
end
```

使用 `unquote: false` 有效地阻止立即注入 AST, 并将 `unquote` 当作任意其它函数调用. 因此, 我们不能将某些东西注入到目标 AST. 这里 `bind_quoted` 派上了用场. 通过提供 `bind_quoted: bindings`, 我们可以禁用立即 unquoting, 同时仍然绑定我们想要传递到调用者上下文的任何数据：

```elixir
quote bind_quoted: [
  foo: ...,
  bar: ...
] do
  unquote(whatever)  # <- 类似于 unquote: false 的作用

  foo  # <- 由于 bind_quoted 而可访问
  bar  # <- 由于 bind_quoted 而可访问
end
```

## 代码注入 vs 数据传输

我们要面临的另一个问题是: 从宏传递到调用者上下文的内容在默认情况下是注入的, 而不是传输的. 因此, 当你使用 `unquote(som_ast)` 时, 你正在将一个 AST 片段注入到用 `quote` expression 构建的另一个 AST 片段中.

有时候, 我们希望传输数据, 而不是注入数据.  我们来看一个例子.  假设我们有一些三元组, 我们想要传输到调用者的上下文中:

```elixir
iex(1)> data = {1, 2, 3}
{1, 2, 3}
```

现在, 让我们尝试使用典型的 `unquote` 进行传输：

```elixir
iex(2)> ast = quote do IO.inspect(unquote(data)) end
{{:., [], [{:__aliases__, [alias: false], [:IO]}, :inspect]}, [], [{1, 2, 3}]}
```

这似乎是有效的.  让我们用 eval_quoted 看下结果:

```elixir
iex(3)> Code.eval_quoted(ast)
** (CompileError) nofile: invalid quoted expression: {1, 2, 3}
```

那么这里发生了什么? 问题是我们并没有真正传输 `{1,2,3}` 三元组. 我们将其注入到目标 AST 中, 注入意味着 `{1,2,3}` 本身被视为一个 AST 片段, 这显然是错误的.

在这种情况下, 我们真正想要的是数据传输. 在代码生成上下文中, 我们有一些数据要传输到调用者的上下文中. 这就是`Macro.escape` 作用所处. 通过转义一个 term, 我们可以确保它是被传输的, 而不是被注入的. 当我们调用 `unquote(Macro.escape(term))` 时, 我们将注入一个 AST, 以 `term` 描述数据.

让我们试试:

```elixir
iex(3)> ast = quote do IO.inspect(unquote(Macro.escape(data))) end
{{:., [], [{:__aliases__, [alias: false], [:IO]}, :inspect]}, [],
 [{:{}, [], [1, 2, 3]}]}

iex(4)> Code.eval_quoted(ast)
{1, 2, 3}
```

如你所见, 我们成功传送了未受影响的数据.

再看我们的延迟代码生成, 这正是我们需要的. 与注入目标 AST 不同, 我们想要传输输入 AST, 完全保留它的形状:

```elixir
defmacro deftraceable(head, body) do
  # 这里我们有 head 和 body 的 AST
  quote do
    # 我们在这里需要相同的 head和 body 的AST, 以便生成
    # 最终代码.
  end
end
```

通过使用 `Macro.escape/1`, 我们可以确保输入 AST 被原原本本地传输回调用者的上下文, 在那里我们将生成最终的代码.

正如前一节所讨论的, 我们使用了 `bind_quoted`, 但原理相同:

```elixir
quote bind_quoted: [
  head: Macro.escape(head, unquote: true),
  body: Macro.escape(body, unquote: true)
] do
  # 这里我们有了从宏上下文中得到的
  # head 和 body 的精确副本.
end
```

## Escaping 和 unquote: true

注意我们传递给了 `Macro.escape` 一个欺骗性的 `unquote: true` 选项. 这是最难解释的. 为了能够理解它, 你必须清楚 AST 是如何传递给宏并返回到调用者的上下文中的.

首先, 记住我们如何调用我们的宏：

```elixir
deftraceable unquote(action)(unquote(state)) do ... end
```

现在, 由于宏实际上接收到的是 quoted 的参数, `head` 参数将等同于以下内容：

```elixir
# 这是宏上下文中的 head 参数实际包含的内容
quote unquote: false do
  unquote(action)(unquote(state))
end
```

请记住, `Macro.escape` 会保存数据, 因此当你在其他 AST 中传输变量时, 其内容将保持不变. 考虑下上面的 head 形状, 这是我们在宏展开后最终会出现的情况:

```elixir
# 调用者的上下文
for {state, {action, next_state}} <- fsm do
  # 这里是我们生成函数的代码. 由于 bind_quoted, 这里
  # 我们可以使用 head 和 body 变量.

  # 变量 head 等效于
  #   quote unquote: false do
  #     unquote(action)(unquote(state))
  #   end

  # 我们真正需要的是:
  #   quote do
  #     unquote(action)(unquote(state))
  #   end
end
```

为什么我们需要 quoted head 的第二种形式? 因为这个 AST 现在是在调用者的上下文中形成的, 在这个上下文中我们有可用的 `action` 和 `state` 变量. 第二个表达式会用到这些变量的内容.

这就是所谓的 `unquoted: true` 的作用. 当我们调用 `Macro.escape(input_ast, unquote: true)` 时, 我们仍然(大部分)保留传输数据的形状, 但输入 AST 中的 `unquote` 片段(例如, `unquote(action)` )将在调用方的上下文中解析.

总的来说, 输入 AST 到调用者上下文的正确传输方式如下所示:

```elixir
defmacro deftraceable(head, body) do
  quote bind_quoted: [
    head: Macro.escape(head, unquote: true),
    body: Macro.escape(body, unquote: true)
  ] do
    # Generate the code here
  end
  ...
end
```

这并不算难, 但需要一些时间来理解这里到底发生了什么. 试着确保你不是盲目地做 escapes（和/或 `unquote: true`）, 而不理解这是你真正想要的. 毕竟, 这不是默认的行为是有原因的.

在编写宏时, 要考虑你是否要注入一些 AST, 或者不加更改地传输数据. 在后一种情况, 你需要使用 `Macro.escape`. 如果传输的数据是一个 AST 且可能包含 `unquote` 片段, 那么您可能需要以 `unquote: true` 的方式使用 `Macro.escape` .

## 回顾

关于 Elixir 宏的系列文章到此结束了. 我希望你觉得这些文章有趣且有学习意义, 并且对宏的工作机制有了更多的了解和使用信心.

一定要记住 — 在展开阶段, 宏相当于 AST 片段的普通组合. 如果你理解调用者的上下文和宏输入, 那么直接执行转换或在必要时通过延迟执行转换并不算难.

本系列绝不可能涵盖方方面面和所有的细节. 如果你想了解更多, [quote/2 special form](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#quote/2) 的文档是一个不错的地方. 您还可以在 [Macro](https://hexdocs.pm/elixir/Macro.html) 和 [Code](https://hexdocs.pm/elixir/Code.html) 模块中找到一些有用的帮助程序.

Happy meta-programming!

> 原文: https://www.theerlangelist.com/article/macros_6