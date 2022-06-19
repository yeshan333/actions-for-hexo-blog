---
title: (译) Understanding Elixir Macros, Part 2 - Micro Theory
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
date: 2022-06-19 00:36:03
tags: Elixir-Macros
categories: Elixir
keywords: "Elixir Macros"
---

这是 Elixir 中的宏系列的第二篇. 上一次我们讨论了编译过程和 Elixir AST, 最后讲了一个基本的宏的例子 trace. 今天, 我们会更详细地讲解宏的机制.

可能有一些内容会和上一篇重复, 但我认为这对于理解运作原理和 AST 的生成很有帮助. 掌握了这些以后, 你对于自己的宏代码就更有信心了. 基础很重要, 因为随着更多地用到宏, 代码可能会由许多的 `quote/unquote` 结构组成.

## 调用一个宏

我们最需要重视的是展开阶段. 编译器在这个阶段调用了各种宏（以及其它代码生成结构）来生成最终的 AST.

例如, 宏 `trace` 的典型用法是这样的:

```elixir
defmodule MyModule do
  require Tracer
  ...
  def some_fun(...) do
    Tracer.trace(...)
  end
end
```

像之前所提到的那样, 编译器从一个类似于这段代码的 AST 开始. 这个 AST 之后会被扩展, 然后生成最后的代码. 因此, 在这段代码的展开阶段, Tracer.trace/1会被调用.

我们的宏接受了输入的 AST, 然后必须生成输出的 AST. 之后编译器会简单地用输出的 AST 替换掉对宏的调用. 这个过程是渐进的 — 一个宏可以返回调用其他宏(甚至它本身)的 AST. 编译器会再次扩展, 直到不可以扩展为止.

调用宏使得我们有机会修改代码的含义. 一个典型的宏会获取输入的 AST 并修改它, 在它周围添加一些代码.

那就是我们使用宏 trace 所做的事情. 我们得到了一个 quoted expression（例如 `1+2`）, 然后返回了这个:

```elixir
result = 1 + 2
Tracer.print("1 + 2", result)
result
```

要在代码的任何地方调用宏（包括 shell 里）, 你都必须先调用 `require Tracer` 或 `import Tracer`. 为什么呢？因为宏有两个看似矛盾的性质:

- 宏也是 Elixir 代码
- 宏在在最终的字节码生成之前的展开阶段运行

Elixir 代码是如何在被生成之前运行的？它不能. 要调用一个宏, 其容器模块（宏的定义所在的模块）必须已经被编译.

因此, 要运行 `Tracer` 模块中所定义的宏, 我们必须确认它已经被编译了. 也就是说, 我们必须向编译器提供一个关于我们所需求的模块的顺序. 当我们 `require` 了一个模块, 我们会让 `Elixir` 暂停当前模块的编译, 直到我们 `require`
的模块编译好并载入到了编译器的运行时（编译器所在的 Erlang VM 实例）. 只有在 `Tracer` 模块完全编译好并对编译器可用的情况下, 我们才能调用 `trace` 宏.

使用 `import` 也有相同效果, 只不过它还在词法上引入了所有的公共函数和宏, 使得我们可以用 `trace` 替代 `Tracer.trace`.

由于宏也是函数, 而 Elixir 在调用函数时可以省略括号, 所以我们可以这样写:

```elixir
Tracer.trace 1+2
```

这很可能是 Elixir 之所以不在函数调用时要求括号的最主要原因. 记住, 大多数语言结构都是宏. 如果括号是必须的, 那么我们需要编写的代码将会更加嘈杂.

```elixir
defmodule(MyModule, do:
  def(function_1, do: ...)
  def(function_2, do: ...)
)
```

## Hygiene

在上一篇文章中我们提到, 宏默认是整洁（Hygiene）的. 意思就是宏引入的变量有其自己的私有作用域, 不会影响代码的其他部分. . 这就是我们能够在我们的 `trace` 宏中安全地引入 result 变量的原因:

```elixir
quote do
  result = unquote(expression_ast)  # result 是宏的私有变量
  ...
end
```

该变量不会干扰调用这个宏的代码. 在调用宏的地方, 可以随意的声明你自己的 `result` 变量, 它不会被 `tracer` 宏中的 `result` 变量隐藏.

大多数时候 `hygiene` 是我们想要的效果, 但是也有例外. 有时候, 可能需要创建在调用者作用域内可用的变量. 下面我们通过 `Plug` 库的一个用例来演示, 我们如何使用 `Plug` 来制定路由:

```elixir
get "/resource1" do
  send_resp(conn, 200, ...)
end

post "/resource2" do
  send_resp(conn, 200, ...)
end
```

注意, 上面这两个宏是如何使用并不存在的 `conn` 变量. 这是因为, `get` 宏在生成的代码中绑定了该变量. 可以想象一下, 产生的代码如下:

```elixir
defp do_match("GET", "/resource1", conn) do
    ...
end
defp do_match("POST", "/resource2", conn) do
    ...
end
```

注意: `Plug` 产生的真实代码是不同的, 这里为了演示对其进行了简化.

这是一个例子, 宏引入了一个变量, 它必须不是 `hygienic` 的. 变量 `conn` 由 `get` 宏引入, 必须对调用者可见.

另一个例子是使用 ExActor 的. 看看下面的例子:

```elixir
defmodule MyServer do
  ...
  defcall my_request(...), do: reply(result)
  ...
end
```

如果你对 `GenServer` 很熟悉, 那么你知道一个 `call` 的结果必须是 `{:reply, response, state}` 的形式. 然而, 在上述代码中, 甚至没有提到 `state`. 那么我们是如何返回 `state` 的呢？这是因为 `defcall` 宏生成了一个隐藏的`state` 变量, 它之后将被 `reply` 宏明确使用.

在上面两种情况中, 宏都必须创建一个不 hygienic 的变量, 而且必须在宏所引用的代码之外可见. 为达到这个目的, 可以使用 `var!` 结构. 下面是 `Plug`的 `get` 宏的简化版本:

```elixir
defmacro get(route, body) do
  quote do
    defp do_match("GET", unquote(route), var!(conn)) do
      # put body AST here
    end
  end
end
```

注意我们如何使用 `var!(conn)` 的. 通过这样做, 我们指定 `conn` 是一个对调用者可见的变量.

上述代码没有解释 body 是如何注入的. 在这之前, 你需要理解宏所接受的参数.

## 宏参数

你要记住, 宏本质上是在扩展阶段被导入的 Elixir 函数, 然后生成最终的 AST. 宏的特别之处在于它所接受的参数都是quoted 的. 这就是我们之所以能够调用:

```elixir
def my_fun do
  ...
end
```

等同于:

```elixir
def(my_fun, do: (...))
```

注意我们如何调用 `def` 宏, 传递 `my_fun`, 即使这个变量不存在. 这完全没问题, 因为我们实际上传递的是 `quote(do: my_fun)` 的结果, 而引用（quote）不要求变量存在. 在内部, `def` 宏会接收到包含了 `:my_fun` 的引用形式. `def` 宏会使用这个信息来生成对应名称的函数.

这里再提一下 `do...end` 块. 任何时候发送一个 `do...end` 块给一个宏, 都相当于发送一个带有 `:do` 键的关键词列表（keywords list）.

所以如下调用:

```elixir
my_macro arg1, arg2 do ... end
```

等同于

```elixir
my_macro(arg1, arg2, do: ...)
```

这些只不过是 Elixir 中的语法糖. 解释器将 `do ... end` 转换成了 `{:do, ...}`.

现在, 我只提到了参数是被引用（quoted）的. 然而, 对于许多常量（原子, 数字, 字符串）, 引用（quoted）形式和输入值完全一样. 此外, 二元元组和列表会在被引用（quoted）时保持它们的结构. 这意味着 `quote(do: {a, b})` 将会返回一个二元元组, 它的两个值都是被引用（quoted）的.

```elixir
iex(1)> quote do :an_atom end
:an_atom

iex(2)> quote do "a string" end
"a string"

iex(3)> quote do 3.14 end
3.14

iex(4)> quote do {1,2} end
{1, 2}

iex(5)> quote do [1,2,3,4,5] end
[1, 2, 3, 4, 5]
```

对三元元组的引用（quoted）不会保留它的形状:

```elixir
iex(6)> quote do {1,2,3} end
{:{}, [], [1, 2, 3]}
```

由于列表和二元元组在被引用时能保留结构, 所以关键词列表（[keywords list](https://hexdocs.pm/elixir/1.12/Keyword.html)）也可以:

```elixir
iex(7)> quote do [a: 1, b: 2] end
[a: 1, b: 2]

iex(8)> quote do [a: x, b: y] end
[a: {:x, [], Elixir}, b: {:y, [], Elixir}]
```

在第一个例子中, 你可以看到输入的关键词列表完全没变. 第二个例子证明了复杂的部分（例如调用 `x`和 `y`）会是 quoted 形式. 但是列表还保持着它的形状. 这仍然是一个键为 `:a` 和 `:b` 的关键词列表.

## 将它们放在一起

为什么这些都很重要? 因为在宏代码中, 您可以很容易地从关键字列表中获取所需要的选项, 而不需要分析一些令人费解的AST. 之前, 我们留下了这个草图代码:

```elixir
defmacro get(route, body) do
  quote do
    defp do_match("GET", unquote(route), var!(conn)) do
      # put body AST here
    end
  end
end
```

记住, `do ... end` 和 `do: ...` 是一样的, 所以当我们调用 `get route do ... end` 时, 我们实际上是在调用 `get(route, do: ...)` 记住宏参数是 quoted 的, 但也要知道 quoted 的关键字列表保持它们的形状, 可以使用 `body[:do]`获取宏中引用的主体:

```elixir
defmacro get(route, body) do
  quote do
    defp do_match("GET", unquote(route), var!(conn)) do
      unquote(body[:do])
    end
  end
end
```

因此, 我们只需将 quoted 的输入主体注入到正在生成的 `do_match` 子句（clause）主体中.

如之前所述, 这就是宏的用途. 它接收一些 AST 片段, 并将它们与样板代码组合在一起, 以生成最终结果. 理想情况下, 当我们这样做时, 我们不需要关心输入 AST 的内容, 在我们的例子中, 我们只需要在生成的函数中注入函数体, 而不需要关心函数体中实际有什么.

测试这个宏很简单. 以下是所需代码的最小化:

```elixir
defmodule Plug.Router do
  # 宏 get 从客户端删除样板代码
  # 确保生成的代码符合泛型逻辑所需的一些标准
  defmacro get(route, body) do
    quote do
      defp do_match("GET", unquote(route), var!(conn)) do
        unquote(body[:do])
      end
    end
  end
end
```

现在, 我们可以实现一个客户端模块:

```elixir
defmodule MyRouter do
  import Plug.Router

  # 多子句 dispatch 的通用代码
  def match(type, route) do
    do_match(type, route, :dummy_connection)
  end

  # 使用宏最小化样板代码量
  get "/hello", do: {conn, "Hi!"}
  get "/goodbye", do: {conn, "Bye!"}
end
```

测试一下:

```elixir
MyRouter.match("GET", "/hello") |> IO.inspect
# {:dummy_connection, "Hi!"}

MyRouter.match("GET", "/goodbye") |> IO.inspect
# {:dummy_connection, "Bye!"}
```

注意 `match/2` 的代码. 它是通用的代码, 依赖于 `do_match/3` 的实现.

## 使用模块

观察上述代码, 你可以看到 `match/2` 的胶水代码存在于客户端模块中. 这肯定算不上完美, 因为每个客户端都必须提供对这个函数的正确实现, 而且必须调用 `do_match` 函数.

更好的选择是, `Plug.Router` 能够将这个实现抽象提供给我们. 我们可以使用 `use` 宏, 大概就是其它语言中的 mixin.

总体思路如下:

```elixir
defmodule ClientCode do
  # 调用 mixin
  use GenericCode, option_1: value_1, option_2: value_2, ...
end

defmodule GenericCode do
  # 在模块被使用的时候调用
  defmacro __using__(options) do
    # 生成一个AST, 该 AST 将被插入到 use 的地方
    quote do
      ...
    end
  end
end
```

因此, 使用 `use` 机制允许我们向调用者的上下文中注入一些代码. 就像是替代了这些:

```elixir
defmodule ClientCode do
  require GenericCode
  GenericCode.__using__(...)
end
```

这可以通过查看 Elixir 的[源代码](https://github.com/elixir-lang/elixir/blob/v0.14.0/lib/elixir/lib/kernel.ex#L3531-L3532)来证明. 这证明了另一点 — 不断展开. `use` 宏生成调用另一个宏的代码. 或者更巧妙地说, 用生成代码来生成代码. 正如前面提到的, 编译器会递归地展开它所发现的所有宏定义, 直到没有可展开的宏为止..

有了这些知识, 我们可以将 `match` 函数的实现转移到通用的 `Plug.Router` 模块:

```elixir
defmodule Plug.Router do
  defmacro __using__(_options) do
    quote do
      import Plug.Router

      def match(type, route) do
        do_match(type, route, :dummy_connection)
      end
    end
  end

  defmacro get(route, body) do
    ... # 这段代码保持不变
  end
end
```

这使得客户端代码非常精简:

```elixir
defmodule MyRouter do
  use Plug.Router

  get "/hello", do: {conn, "Hi!"}
  get "/goodbye", do: {conn, "Bye!"}
end
```

`__using__` 宏生成的 AST 会简单地被注入到调用 `use Plug.Router` 的地方. 特别注意我们是如何从 `__using__` 宏里使用 `import Plug.Router` 的, 这不是必要的. 但这让你可以使用 `get` 替代使用 `Plug.Router.get`.

那么我们得到了什么？各种样板代码汇集到了一个地方（`Plug.Router`). 不仅仅简化了客户端代码, 也让这个抽象正确闭合. 模块 `Plug.Router`确保了 `get` 宏所生成的任何东西都能适合使用 `match` 的通用代码. 在客户端中, 我们只要 `use`那个模块, 然后用它提供的宏来组合我们的 router.

总结一下本章的内容. 许多细节没有提到, 但希望你对于宏是如何与 Elixir 编译器相结合的有了更好的理解. 在下一部分, 我们会更深入, 并开始探索如何分解输入的 AST.
## 附注

- mixin: Mixin 即 Mix-in, 常被译为 “混入”, 是一种编程模式, 在 Python 等面向对象语言中, 通常它是实现了某种功能单元的类, 用于被其他子类继承, 将功能组合到子类中.