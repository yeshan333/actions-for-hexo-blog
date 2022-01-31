---
title: 状态机的一点儿事（fsm-smr-dfsm）
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
music:
  enable: false
  server: netease
  type: song
  id: 26664345
# headimg: 文章头图 url 824x280
# thumbnail: 标题右边缩略图 url
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2022-01-31 17:32:51
tags: [FSM, Compiler, Lexer]
categories: Compile
keywords: "FSM"
---


## 有限状态机（Finite State Machine）

> 有限状态机（英语：finite-state machine，缩写：FSM）又称有限状态自动机（英语：finite-state automaton，缩写：FSA），简称状态机，是表示有限个状态以及在这些状态之间的转移和动作等行为的数学计算模型。- [维基百科](https://zh.wikipedia.org/wiki/%E6%9C%89%E9%99%90%E7%8A%B6%E6%80%81%E6%9C%BA)

- 有限状态机的要素
  - 状态：状态是有限个的，任一时刻，只处于一种状态
  - 条件：用于触发状态转移动作的“事件”，条件被满足（输入）就会触发相应动作
  - 动作：条件满足后，执行状态转移的行为
  - 转换：从一个状态转换为另一个状态，转换一般由状态转换函数完成

让我们来看下有限状态机的经典例子：旋转闸机（这年代闸机基本不用硬币了😂）

![旋转闸机](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/R.jpg)

使用状态图表示的话就是下面这样子：

![状态转换图](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/fsm.png)

- 状态：旋转闸机只有两种状态：锁定和解锁
- 条件、动作、转换：闸机的**初始状态**是锁定（Locked）的，当游客放置硬币（Coin）到闸机中时，闸机就会转换为解锁（Un-locked）状态，当游客执行推动作通过闸机后，闸机状态又会被转换为锁定（Locked）。
  - 当闸机处于解锁（Un-locked）状态时，反复的放硬币是没有用的，状态不会变，同理，锁定态时，反复 Push 旋转门也是没用的，闸机状态不会变，游客通过不了。

用状态转换表表示如下图：

![状态转换表](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/fsm-table.png)

### Go 实现旋转门的 FSM

基于 Go 语言，可实现旋转门闸机的 FSM 如下，StateTransitionTable 即为状态转换表：

```go
package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"
)

const (
	Locked = iota
	Unlocked
)

const (
	InputCoin = "coin"
	InputPush = "push"
)

type State uint32

type StateTransitionTableDef struct {
	State State
	Input string
}

// Action
type TransitionFunc func(state *State)

var StateTransitionTable = map[StateTransitionTableDef]TransitionFunc{
	{Locked, InputCoin}: func(state *State) {
		fmt.Println("Unlocks the turnstile so that the customer can push through.")
		*state = Unlocked
	},
	{Locked, InputPush}: func(state *State) {
		fmt.Println("The turnstile has been locked.")
	},
	{Unlocked, InputCoin}: func(state *State) {
		fmt.Println("The turnstile has been unlocked.")
	},
	{Unlocked, InputPush}: func(state *State) {
		fmt.Println("When the customer has pushed through, locks the turnstile.")
		*state = Locked
	},
}

type TurnStile struct {
	State State
}

func (t *TurnStile) ExecuteAction(action string) {
	stateActionTupple := StateTransitionTableDef{
		t.State,
		strings.TrimSpace(action),
	}

	if transFunc := StateTransitionTable[stateActionTupple]; transFunc == nil {
		fmt.Println("Unknown action, please try again!")
	} else {
		transFunc(&t.State)
	}
}

func main() {
	turnstileFSM := &TurnStile{
		State: Locked, // Initial State
	}

	prompt(turnstileFSM.State)
	reader := bufio.NewReader(os.Stdin)

	for {
		action, err := reader.ReadString('\n')
		if err != nil {
			log.Fatalln(err)
		}

		turnstileFSM.ExecuteAction(action)
	}
}

func prompt(s State) {
	m := map[State]string{
		Locked:   "Locked",
		Unlocked: "Unlocked",
	}
	fmt.Printf("current state is: [%s], please input action: [coin | push]: \n", m[s])
}
```

### FSM 应用-词法分析

FSM 很典型的一个应用就是用于编译器前端->词法分析器（Lexer）的词法分析上（tokenize）。比如如下关系表达式语句的 tokenize 上：

- blogAge > 3

我们的 Lexer 扫描关系表达式时需要识别到 blogAge 为标识符（Identifier），> 为比较操作符（Greater），3 为数字字面量（NumericLiteral），对应的词法规则如下：
- 标识符（Identifier）：首字符需要为字母，其他字符可为数字或字母或下划线
- 比较操作符（Greater）：>
- 数字字面量（NumericLiteral）：全部由数字组成

对应的 FSM 简化版状态图如下：

![关系表达式词法分析状态图](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/fsm-expr.png)

## 复制状态机（Replicated State Machine）

在分布式系统领域，状态机被用于保证节点状态的一致性，分布式系统一致性算法是基于复制状态机（Replicated State Machine）提出来的。

![复制状态机架构](https://cdn.jsdelivr.net/gh/yeshan333/jsDelivrCDN@main/Figure-1-Replicated-state-machine-architecture.png)

每一个 Server 节点都会有一个状态机，这个状态机的输入来源为一份储存着命令序列的日志，对于相同的命令输入，每个节点状态机（确定有限自动机 DFA，Deterministic Finite Automata）的输出是确定的、相同的。

## 参考

- [复制状态机](https://knowledge-sharing.gitbooks.io/raft/content/chapter2.html)
- [Finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine)
- [使用 Golang 实现状态机](https://www.cnblogs.com/double12gzh/p/13621445.html)