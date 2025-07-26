---
title: '（译）Elixir Tip: Case vs. With'
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
cover: https://pic.imgdb.cn/item/63823c2216f2c2beb1828864.png
thumbnail: https://pic.imgdb.cn/item/63823c2216f2c2beb1828864.png
date: 2022-11-26 23:10:46
tags: Elixir
categories: Elixir
keywords: "Elixir with statement"
---

从 1.2 版本开始, `with` 运算符是需要点时间去理解的 ELixir 特性之一. 它经常在使用 `case` 的情形下使用, 反之亦然. 两者的不同在于如果没有可以匹配到的子句, `with` 将失败, 而 `case` 将抛出一个不匹配 (no-match) 的错误 (CaseClauseError). 

是不是有一点点疑惑, 让我们从最基本的使用开始看看.

使用 `case` 进行精准匹配, 你非常确定至少有一个是可以被匹配到的:

```elixir
case foo() do
  cond1 -> expression1
  cond2 -> expression2
  cond3 -> expression3
  _ -> default_expression
end
```

一个常见的 `case` 使用情景是对潜在的错误进行模式匹配:

```elixir
case foo() do
  {:ok, res} -> do_something_with_result(res)
  {:error, err} -> handle_error(err)
end
```

目前为止, 一切都看起来很好. 让我们来看一个常见的日常工作场景案例. 试想一下, 我们有一个这样的操作 (它可以是外部的 API 调用、IO 或者数据库操作), 我们想执行第二个这样的操作, 但只有当第一个操作成功的时候才执行. 这个行为我们怎么实现?

回想一下, Elixir 中的条件语句也是函数. 它们可以被插入或链接到其他条件的表达式部分. 这允许我们使用链式的条件语句来解决上面的问题:

```elixir
case foo() do
  {:ok, res} ->
    case bar(res) do
      {:ok, res2} -> do_something_with_result(res2)
      {:error, err} -> handle_error(err)
	end
  {:error, err} -> handle_error(err)
end
```

尽管只有两个类似的调用操作, 但代码的复杂度是急剧上升的. 如果再添加一个类似的调用操作, 代码将会变得不可读:

```elixir
case foo() do
  {:ok, res} ->
    case bar(res) do
	  {:ok, res2} ->
      case baz(res2) do
        {:ok, res3} -> do_something_with_result(res3)
        {:error, err} -> handle_error(err)
      end
	  {:error, err} -> handle_error(err)
	end
  {:error, err} -> handle_error(err)
end
```

## 使用 with 去拯救一下

这就是 `with` 运算符非常方便的地方. 它的基本形式类似于上面 `case` 的链式例子, 但在某种程度上, 它的功能也类似于管道操作符. 看看这个:

```elixir
with {:ok, res} <- foo(),
     {:ok, re2} <- bar(res)
     {:ok, re3} <- baz(re2) do
  do_something_with_result(res3)
end
```

这可以解释为, "按顺序执行所有以逗号分隔的操作, 如果前一个操作是匹配的, 则执行下一个操作. 最后, 运行 `do/end` 块中的代码". 这看起来比之前的版本更简洁和可读, 而且它还有另一个很大的优势. 它允许工程师优先关注正常的业务场景. 有些人可能想知道, 如果任何以逗号分隔的操作返回的是 `{:error, err}` 元组, 会发生什么情况. 答案是, 将返回第一个不匹配的操作表达式. 简单地说, 如果我们不关心非 ok 的结果, 那么我们也可以留下正常的路径, 把它留给调用者来处理最终结果. 

如果你使用过 `Phoenix`，你可能会想起，这正是它的 fallback actions 的工作方式. 

```elixir
defmodule MyController do
  use Phoenix.Controller

  action_fallback MyFallbackController

  def show(conn, %{"id" => id}, current_user) do
    with {:ok, post} <- Blog.fetch_post(id),
         :ok <- Authorizer.authorize(current_user, :view, post) do

      render(conn, "show.json", post: post)
    end
  end
end
```

这个 Fallback Controller 的例子来源于 [official Phoenix docs](https://hexdocs.pm/phoenix/Phoenix.Controller.html#action_fallback/1)

## with/else

如果我们想要自己关注这些副作用 (side effects), `with` 提供了一个扩展版本给我们使用:

```elixir
with {:ok, res} <- foo(),
     {:ok, res2} <- bar(res) do
  do_something_with_res(res2)
else
  {:error, {:some_error, err}} -> handle_some_error(err)
  {:error, {:some_other_error, err}} -> handle_some__other_error(err)
  default -> handle_something_completely_unexpected(default)
end
```

**NOTE**: 请记住，虽然基础的 `with` 形式在匹配失败时不会抛出错误，但在使用 `else` 时，你必须详尽地匹配所有的情况. 

## 什么使用不应该使用 with

### 用 else 处理单个模式匹配的场景

这将使代码比你需要的更难以阅读. 代码如下:

```elixir
with {:ok, res} <- foo() do
  do_something_with_res(res)
else
  {:error, {:some_error, err}} -> handle_some_error(err)
end
```

可以使用更具有可读性的 `case` 块处理:

```elixir
case foo() do
  {:ok, res} -> do_something_with_res(res)
  {:error, {:some_error, err}} -> handle_some_error(err)
end
```

## 相关文章

- [Elixir: Thoughts on the `with` Statement](https://relistan.com/elixir-thoughts-on-the-with-statement)