---
title: (译)通过 Git 和 Angular 了解语义化提交信息
toc: true
comments: true
mathjax: true
date: 2020-06-04 22:06:59
tags: [Git, 工程化, 译文]
categories: Git
thumbnail: https://img.vim-cn.com/d1/2602cfd9aba0a8ae85261ff2af4f0fccb6efa1.jpg
---

受传统提交规范和 Angular 约定的启发，让我们来解释语义化提交术语，并演示提交信息的实际示例。

许多项目决定以某种约定方式来标准化它们的提交信息。这种做法并不是新出现的，但在最近几年中越来越多地得到了应用。而且很可能您已经在某些项目中遇到过这样的提交消息。

<!-- more -->

最早出现的规范之一来自与 AngularJS 项目。这个项目团队创建了一个详细的[文档](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#)，其中指定了他们应该提交的目标和方式。这些提交约定非常流行，有些您可能通过 [Karma](http://karma-runner.github.io/4.0/dev/git-commit-msg.html) 指南遇到过。但是，还有一些不同的约定，像 [jQuery](https://contribute.jquery.org/commits-and-pull-requests/#commit-guidelines), [JSHint](https://github.com/jshint/jshint/blob/master/CONTRIBUTING.md#commit-message-guidelines), [Ember](https://github.com/emberjs/ember.js/blob/master/CONTRIBUTING.md#commit-tagging), [Angular](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#-commit-message-guidelines)(一个受AngularJS 提交规范启发的增强版约定)，甚至[更多](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages):

![Commit convention variations](https://d33wubrfki0l68.cloudfront.net/eb16595d0c6862c0c013a36c339317a4d82bdce7/9195b/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/conventions-diagram.png)

可以清楚地看到上面各种各样的提交约定，这无疑构成了一个标准化官方规范的正当理由。[约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0-beta.4/)就是这样一种规范，它在实践中简化了 Angular 约定，并简化指出了提交消息规范的要点。

在本文中，我们将介绍“语义化提交”背后的概念，并使用 Git 和 Angular 的提交约定来演示具体的例子。声明一下，我们使用它们只是为了澄清概念——意味着版本控制工具和规范的选择取决于您。

那我们就开始吧！👨🏻‍🏫

# 动机

让我们从定义开始:

> 语义化提交是**遵循着特定约定**并具有人类和机器可读含义的提交消息

这意味着，它只是提交消息的指导方针，因此:

* 提交消息是语义化的：因为它们被划分为有意义的类型，标识了提交(commit)的意图
* 提交消息是约定俗成的：对于开发者和工具，它们有着统一的结构和良好的类型标识

此外，当我们通常需要执行以下操作时，语义化提交可能会派上用场：

1. 允许维护人员和贡献者轻松地浏览项目历史并理解提交的意图，同时通过提交消息类型忽略不重要的更改
2. 强制提交信息的结构，鼓励有针对特定目的的小型提交
3. 直接提交信息的主体，不必话大段话去解说
4. 根据提交信息类型自动更新包版本号(Bump the package version)
5. 自动生成日志(CHANGELOGs)和 release 说明

最后，语义化提交致力于实现更好的可读性和自动化，以及速度的提高。

话虽如此，我们中的一些人可能不接受这些消息约定，认为它们是可读的或提供信息的，这显然是有意义的。所以如果我们也不需要这些附带的好处，那在项目中执行这样的规范显然是没有意义的。

好了，是时候了解我们如何实际遵循这些约定了。

免责声明：从这一刻起，我们将引用 Angular 提交信息约定及其好处。

## 提交信息的格式

Angular 规范要求根据以下结构来构造提交消息(Commit Message):

![The commit message format according to Angular conventions](https://d33wubrfki0l68.cloudfront.net/ab6c349cef44ee6b617234b4f2574b978ef2fa3e/42749/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/commit-message-format-by-angular.png)

上图向我们说明了提交消息由三个部分组成 —— header、body 和 footer 。

### Header

Header 是**强制**要求的一行，它简单地描述了更改的目的(最多100个字符)。
更好的是，它本身由三部分组成:

1. 类型(Type)：标识更改类型的短前缀
2. 范围(Scope)：可选项，表明 Commit 影响的范围
3. 主体(Subject)：表示对实际更改的简明描述

实际上，就 Git 而言，它就是提交消息的首行：

```shell
git commit -m "fix(core): remove deprecated and defunct wtf* apis"
```

我们插入单行消息，并用 `:` 分隔。当 `fix`和 `core`（受影响的包）分别是类型和范围时，我们将左分区假设称为“前缀”。另一方面，右分区显然构成了主体(Subject)。

简而言之，上述消息含义是：*“本次更改通过移除不推荐使用(deprecated)和不存在的 wtf * api 修复了来自Core软件包的错误”*。

### Body

主体(Body)是**可选**行，用于介绍本次更改背后的动机或仅描述一些更详细的信息。

让我们以上述的例子为例，并添加一个主体：

```shell
git commit -m "fix(core): remove deprecated and defunct wtf* apis" -m "These apis have been deprecated in v8, so they should stick around till v10, but since they are defunct we are removing them early so that they don't take up payload size."
```

现在，我们在消息上附加了几句话，详细说明了此提交(Commit)目的。

请注意以下几点：

* 我们使用了多个`-m`来连接段落而不是简单的行
* 头部和主体应该用空白行分隔（根据这些段落，这显然是正确的）

**注意**：尽管我们可以使用其他方式将消息分成几行，但为了简单起见，我们将在下一个示例中继续使用多个 `-m`（展示了一个与shell无关的解决方案）。

### Footer

尾部(Footer)是**可选**行，其中提到了由于更改而产生的影响，例如：宣布重大更改、链接关闭已解决的问题(issues)、提及贡献者等等。

这是上述带有尾部(footer)的提交消息：

```shell
git commit -m "fix(core): remove deprecated and defunct wtf* apis" -m "These apis have been deprecated in v8, so they should stick around till v10, but since they are defunct we are removing them early so that they don't take up payload size." -m "PR Close #33949"
```

在本例中，我们只是简单地添加了对相关拉请求(pull request)的引用，而没有添加其他内容。

最后，让我们查看完整的提交日志：

<img src="https://d33wubrfki0l68.cloudfront.net/f477a323548298d5e4d42bc7be6f8a62aad62250/27eec/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/final-commit-message.png" alt="Showing the commit log in one piece">

正如您可能会推断的，此[提交](https://github.com/angular/angular/commit/cf420194ed91076afb66d9179245b9dbaabc4fd4)实际上是 Angular 存储库中存在的。

## 常见类型

除了定义提交消息格式外，Angular 的提交消息约定还指定了一个有用的类型列表，其中包含了各种各样的更改。

在开始之前，我们应该区分如下两种类型：

* 开发(Development)：一种维护类型，它对变更进行分类，面向开发人员，这些变更实际上并不影响产品代码，而是影响内部的开发环境和工作流程(workflows)
* 生产(Production)：一种增强类型，用于对仅影响产品代码的最终用户(end users)进行更改分类

现在，让我们介绍和解释这些类型。

**注意**：以下示例直接取自Angular存储库的提交日志。

### 👷构建

构建类型 `build`(以前称为`chore`)用于识别与构建系统相关的**开发**更改(涉及脚本、配置或工具)和包依赖项(dependencies)。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/241c157655b2a391d15b49f46d5eca5e3568a6e4/402a5/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-build-type.png" alt="Examples of commit messages with `build` type">

### 💚ci

`ci `类型用于识别与持续集成和部署系统相关的开发更改——包括脚本、配置或工具。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/2d7b17c202f31f63a6eec7e46df2d18ea7868d6a/e8324/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-ci-type.png" alt="Examples of commit messages with `ci` type">

### 📝文档docs

文档类型用于识别与项目相关的文档更改——无论是针对最终用户的外部更改(对于库)还是针对开发人员的内部更改。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/bc74f1e6bd91dd88c6d622ce8804f77be4718836/1d37a/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-docs-type.png" alt="Examples of commit messages with `docs` type">

### ✨特性

该`feat`类型用于标识生产环境相关的新的向后兼容能力(backward-compatible)或功能的更改。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/942e86121f5c88e50462b05d80dd6e372dce96b3/c26af/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-feat-type.png" alt="Examples of commit messages with `feat` type">

### 🐛修复

`fix`类型用于标识生产环境相关向后兼容(backward-compatible)的 bug 修复(bug fixes)

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/69f22fa96e84fc5c1a09bf3055d8447224c9a9fc/ca58b/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-fix-type.png" alt="Examples of commit messages with `fix` type">

### ⚡️性能

`perf`类型用于标识生产环境相关向后兼容的**性能**(performance)改进相关的产品更改。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/661b70093cf0b94cae4129bc44257ea239caa3db/e060d/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-perf-type.png" alt="Examples of commit messages with `perf` type">

### ♻️重构

`refactor`类型用于识别与修改代码库相关的开发更改，这些更改既没有添加功能，也没有修复 bug —— 例如删除冗余代码、简化代码、重命名变量等等。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/b9d8ae7afa8a026445a2ac28b92a90595115e523/5b26d/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-refactor-type.png" alt="Examples of commit messages with `refactor` type">

### 🎨风格

`style`类型用于标识代码样式变动相关的开发更改，而不考虑其含义——例如缩进、分号、引号、结尾逗号等等。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/ad8400fbbbeb00a2809c4d0805adee32026254c2/8f851/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-style-type.png" alt="Examples of commit messages with `style` type">

### ✅测试

`test`类型用于标识与测试相关的开发更改——例如重构现有测试或添加新测试。

例子：

<img src="https://d33wubrfki0l68.cloudfront.net/db341477c4a017c37929c5fe80ffec77d37bcc10/cac60/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/examples-of-test-type.png" alt="Examples of commit messages with `test` type">

## 好处

现在我们已经熟悉了这些约定，让我们看看从中收获的两种好处。

### 浏览历史变更记录

Git 为我们提供了浏览存储库提交历史的能力，所以我们就可以知道实际发生了什么，谁做了贡献等等。

让我们看看这些约定是如何简化我们对这些记录的浏览:

```shell
git log --oneline --grep "^feat\|^fix\|^perf"
```

我们使用提交消息类型来过滤，因此只显示生产更改(所有以 `feat`、`fix` 或 `perf`开头的消息)。

另一个例子:

```shell
git log --oneline --grep "^feat" | wc -l
```

我们只打印 `feat` 更改的总数。

上述的关键是提交消息格式非常结构化，这使得我们在扫描或过滤提交历史记录时能够有效地依赖于此格式。

即，更加迅速!💪🏻

### 自动发布

提交消息格式对于自动化发布过程的步骤也很有用。

事实上，这可能是因为像[Standard Version](https://github.com/conventional-changelog/standard-version)和[Semantic Versioning](https://github.com/semantic-release/semantic-release)这样的工具严格遵循语义化的版本规范和特定的信息提交约定(分别是传统的提交约定和 Angular 约定)。它们之间的主要区别在于 [approach](https://github.com/conventional-changelog/standard-version#how-is-standard-version-different-from-semantic-release)，但是让我们关注语义化发布(Semantic Release)。

因此，基于提交信息(特别是类型)——语义化发布(Semantic Release)能够给我们提供以下能力:

* 转到下一个语义化包版本(发生重大变更时-补丁发布、监控到新特性和性能的优化)
* 创建一个包含生产环境相关发布信息的 CHANGELOG 文件
* 为新的发布版本创建一个 Git tag
* 将release artifact发布(Publish)到 npm 注册中心

酷吧?

例如，Ionic 的[angular-toolkit](https://github.com/ionic-team/angular-toolkit)项目，集成了语义化发布来自动化发布过程(在此遵循 Angular 的提交约定):

<img src="https://d33wubrfki0l68.cloudfront.net/ac174adb87bdd863ccd14b588b25d444504fefb8/d1d92/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/example-of-release-note.png" alt="An example of a generated release version">

正如我们所注意到的，发布的版本是基于 tag 和注释生成的——但重点是，这是**自动**完成的。🤖

## 其它

为了充分利用语义化提交(semantic commit)，让我们来看一些东西。

### 使用Emojis

将表情符号附加到提交消息可能会进一步提高可读性，这样我们就可以在浏览提交历史时非常快速和容易地识别它们。💯

请参阅以下链接:

* [gitmoji](https://gitmoji.carloscuesta.me/)
* [Commit Message Emoji 👋](https://github.com/dannyfritz/commit-message-emoji)

### CLI工具

[Commitizen](https://github.com/commitizen/cz-cli) 是一个通过命令行强制格式化提交信息的工具:

<img src="https://d33wubrfki0l68.cloudfront.net/de5e032567b4cccae05bafd47636c4b20f84868d/61d9f/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/commitizen-example.png" alt="Semantic commit message using the command line">

### 检查器(Linter)

[commitlint](https://github.com/conventional-changelog/commitlint) 是一个保证提交消息格式符合约定的工具:

<img src="https://d33wubrfki0l68.cloudfront.net/e71e415ceec4372fb6130d6f5501291362abb1be/1c7f0/images/posts/2019-11-01-understanding-semantic-commit-messages-using-git-and-angular/commitlint-example.png" alt="Linting the commit messages">

### VSCode扩展

如果你想使用一个可定制的[VScode扩展](https://github.com/nitayneeman/vscode-git-semantic-commit)，那么下面的内容可能会让你感兴趣:

<img src="https://github.com/nitayneeman/vscode-git-semantic-commit/blob/master/images/examples/preview.gif?raw=true" alt="Semantic commit message using the Command Palette">

***

## 总结

我们今天介绍了“语义化提交”这个术语，并通过遵循 Angular 提交消息约定的具体例子，解释了这种消息的结构。

概括要点:

* 语义化提交是对开发人员和工具都有重要意义的提交信息方式，它们遵循特定的约定
* 语义化提交(以及基于它的工具)有助于提高可读性、速度和自动化
* Conventional Commits 是一个详细描述语义提交的规范，遵循轻量级约定
* Angular 的指导原则详细描述了遵循项目约定的语义化提交，包括:
  * 包含 header、body 和 footer 的信息格式
  * 与开发和生产相关的提交更改的类型
* 我们可以利用信息约定轻松浏览提交历史
* 我们可以从这些规范收获自动化发布流程(release process)的好处

最后，不管您是否决定采用这些约定,您可能会偶尔遇到它们，所以请记住上面的几点。😉


> * 原文地址：[Understanding Semantic Commit Messages Using Git and Angular](https://nitayneeman.com/posts/understanding-semantic-commit-messages-using-git-and-angular/#motivation)
> * 原文作者：[Nitay Neeman](https://github.com/nitayneeman)
> * 译文首发于：[Seven innovation base/Git-IN-ACTION-docs](https://seven-innovation-base.github.io/Git-IN-ACTION-docs/)
> * 译者：[MrGo123](https://github.com/MrGo123)
> * 校对者：[yeshan333](https://github.com/yeshan333)
