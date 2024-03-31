---
title: (译) Understanding Elixir Macros, Part 5 - Reshaping the AST
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-06-19 16:56:29
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

上次我介绍了一个基本版本的可追溯宏 `deftraceable`, 它允许我们编写可跟踪的函数. 这个宏的最终版本还有一些遗留的问题, 今天我们将解决其中一个 — 参数模式匹配.

从今天的练习应该认识到, 我们必须仔细考虑关于宏可能接收到的输入的所有假设情况.

## 问题所在

正如我上次所暗示的那样, 当前版本的 `deftraceable` 不能使用模式匹配的参数. 让我们来演示一下这个问题:

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          deftraceable div(_, 0), do: :error
        end
** (CompileError) iex:5: unbound variable _
```

发生了什么? `deftraceable` 宏盲目地假设输入参数是普通变量或常量. 因此, 当你调用 `deftracable div(a, b)` 时, `deftracable div(a, b), do: ...` 生成的代码将包含:

```elixir
passed_args = [a, b] |> Enum.map(&inspect/1) |> Enum.join(",")
```

上面这段会按预期工作, 但如果一个参数是匿名变量（`_`）, 那么我们将生成以下代码:

```elixir
passed_args = [_, 0] |> Enum.map(&inspect/1) |> Enum.join(",")
```

这显然是不正确的, 因此我们得到了未绑定变量错误.

那么解决方案是什么呢? 我们不应该对输入参数做任何假设. 相反, 我们应该将每个参数放入宏生成的专用变量中. 或者用代码来表达, 如果宏被调用:

```elixir
deftraceable fun(pattern1, pattern2, ...)
```

我们会生成这样的函数头:

```elixir
def fun(pattern1 = arg1, pattern2 = arg2, ...)
```

这将允许我们将参数值代入内部临时变量, 并打印这些变量的内容.

## 解决方案

让我们来实现它. 首先, 我将向你展示解决方案的顶层示意版:

```elixir
defmacro deftraceable(head, body) do
  {fun_name, args_ast} = name_and_args(head)

  # 通过给每个参数添加 "= argX"来装饰输入参数.
  # 返回参数名称列表 (arg1, arg2, ...)
  {arg_names, decorated_args} = decorate_args(args_ast)

  head = ??   # Replace original args with decorated ones

  quote do
    def unquote(head) do
      ... # 不变

      # 使用临时变量构造追踪信息
      passed_args = unquote(arg_names) |> Enum.map(&inspect/1) |> Enum.join(",")

      ... # 不变
    end
  end
end
```

首先, 我们从函数头（head）提取函数名称和 args （我们在前一篇文章中解决了这个问题）.  然后, 我们必须将 `= argX` 注入到 `args_ast` 中, 并收回修改后的参数（我们将将其放入 `decorated_args`中）.

我们还需要生成的变量的纯名称（或者更确切地说是它们的 AST）, 因为我们将使用这些名称来收集参数值. 变量 `arg_names` 实际上包含 `quote do [arg_1, arg_2, ....] end`, 可以很容易地注入到 AST 树中.

我们来实现剩下的部分. 首先, 让我们看看如何修饰参数:

```elixir
defp decorate_args(args_ast) do
  for {arg_ast, index} <- Enum.with_index(args_ast) do
    # 动态生成 quoted 标识符
    arg_name = Macro.var(:"arg#{index}", __MODULE__)

    # 为 patternX = argX 生成 AST
    full_arg = quote do
      unquote(arg_ast) = unquote(arg_name)
    end

    {arg_name, full_arg}
  end
  |> Enum.unzip
end
```

大多数操作发生在 `for` 语句中. 本质上, 我们处理了每个变量输入的 AST 片段, 然后使用 `Macro.var/2` 函数计算临时名称（quoted 的 `argX`）, 它能将一个原子变换成一个名称与其相同的 quoted 的变量. `Macro.var/2` 的第二个参数确保变量是hygienic 的. 尽管我们将 `arg1, arg2, ...` 变量注入到调用者上下文中, 但调用者不会看到这些变量. 事实上, `deftraceable` 的用户可以自由地使用这些名称作为一些局部变量, 不会干扰我们的宏引入的临时变量.

最后, 在推导式的末尾, 我们返回一个元组, 该元组由临时的名称和 quoted 的完整模式组成 - (例如 `_ = arg1`, 或 `0 = arg2`). 使用 `unzip` 和 `to_tuple` 进行推导之后确保 `decorate_args`以 `{arg_names, decorated_args}` 的形式返回结果.

`decorate_args` 辅助变量就绪后, 我们就可以传递输入参数, 并获得修饰参数, 以及临时变量的名称. 现在我们需要将这些修饰过的参数注入到函数的头部, 以取代原始参数. 要注意, 我们需要做到以下几点:

- 递归遍历输入函数头的 AST
- 找到指定函数名和参数的位置
- 用修饰过的参数的 AST 替换原始（输入）参数

如果我们使用宏, `Macro.postwalk/2` 这个处理可以被合理地简化掉:

```elixir
defmacro deftraceable(head, body) do
  {fun_name, args_ast} = name_and_args(head)

  {arg_names, decorated_args} = decorate_args(args_ast)

  # 1. 递归地遍历 AST
  head = Macro.postwalk(
    head,

    # lambda 函数处理输入 AST 中的元素, 返回修改过的 AST
    fn
      # 2. 模式匹配函数名和参数所在的位置
      ({fun_ast, context, old_args}) when (
        fun_ast == fun_name and old_args == args_ast
      ) ->
        # 3. 将输入参数替换为修饰参数的 AST
        {fun_ast, context, decorated_args}

      # 头部 AST 中的其它元素（可能是 guards）
      #   -> 我们让它保留不变
      (other) -> other
    end
  )

  ... # 不变
end
```

`Macro.postwalk/2` 递归地遍历 AST, 并且在所有节点的后代被访问之后, 为每个节点调用提供的 lambda 函数. lambda 函数接收元素的 AST, 这样我们有机会返回一些除了指定节点之外的东西.

我们在这个 lambda 里做的实际上是一个模式匹配, 我们在寻找 `{fun_name, context, args}`. 如第三篇文章中所述那样, 这是表达式 `some_fun(arg1, arg2, ...)` 的 quoted 表现形式. 一旦我们遇到匹配此模式的节点, 我们只需要用新的（修饰过的）输入参数替换掉旧的. 在所有其它情况下, 我们简单地返回输入的 AST, 使得树的其余部分不变.

这看着有点复杂了, 但它解决了我们的问题. 以下是 deftraceable 宏的最终版本:

```elixir
defmodule Tracer do
  defmacro deftraceable(head, body) do
    {fun_name, args_ast} = name_and_args(head)

    {arg_names, decorated_args} = decorate_args(args_ast)

    head = Macro.postwalk(head,
      fn
        ({fun_ast, context, old_args}) when (
          fun_ast == fun_name and old_args == args_ast
        ) ->
          {fun_ast, context, decorated_args}
        (other) -> other
      end)

    quote do
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

  defp name_and_args({:when, _, [short_head | _]}) do
    name_and_args(short_head)
  end

  defp name_and_args(short_head) do
    Macro.decompose_call(short_head)
  end

  defp decorate_args([]), do: {[],[]}
  defp decorate_args(args_ast) do
    for {arg_ast, index} <- Enum.with_index(args_ast) do
      # 动态生成 quoted 标识符（identifier）
      arg_name = Macro.var(:"arg#{index}", __MODULE__)

      # 为 patternX = argX 构建 AST
      full_arg = quote do
        unquote(arg_ast) = unquote(arg_name)
      end

      {arg_name, full_arg}
    end
    |> Enum.unzip
  end
end
```

让我们来试试:

```elixir
iex(1)> defmodule Tracer do ... end

iex(2)> defmodule Test do
          import Tracer

          deftraceable div(_, 0), do: :error
          deftraceable div(a, b), do: a/b
        end

iex(3)> Test.div(5, 2)
iex(line 6) Elixir.Test.div(5,2) = 2.5

iex(4)> Test.div(5, 0)
iex(line 5) Elixir.Test.div(5,0) = :error
```

正如你所看到的那样, 可以进入 AST, 分解它, 并在其中散布一些自定义的注入代码, 这并不算很复杂. 缺点是, 编写的宏的代码会变得越来越复杂, 并且更难分析.

今天的话题到此结束. 下一次, 我将讨论原地代码生成技术 [《(译) Understanding Elixir Macros, Part 6 - In-place Code Generation》](https://shan333.cn/2022/06/19/understanding-elixir-macros-part-6-in-place-code-generation/).

> 原文: https://www.theerlangelist.com/article/macros_5

