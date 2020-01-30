---
title: Latex基本语法简记
toc: true
comments: true
popular_posts: true
mathjax: true
top: false
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
password: false
date: 2019-06-18 15:05:57
tags: Latex
categories: math
---

# 公式插入方式

1. 行内公式可用`\(...\)`或`$...$`
- 例如`$ f(x)=x^2 $`,显示为$ f(x)=x^2 $

2. 独立公式（单独另起一行,公式会居中），使用`$$...$$`或`\[...\]`
- 例如：`$$ \limit{f(x)dx} $$`或
$$ \int_a^b{f(x)dx} $$

```md
1. 行内公式可用`\(...\)`或`$...$`
- 例如`$ f(x)=x^2 $`,显示为$ f(x)=x^2 $

2. 独立公式（单独另起一行,公式会居中），使用`$$...$$`或`\[...\]`
- 例如：`$$ \limit{f(x)dx} $$`或
$$ \int_a^b{f(x)dx} $$
```

<!-- more -->

# 大括号的使用

```latex
方法一：
$$ f(x)=\left\{
\begin{aligned}
x & = & \cos(t) \\
y & = & \sin(t) \\
z & = & \frac xy
\end{aligned}
\right.
$$
方法二：
$$ F^{HLLC}=\left\{
\begin{array}{rcl}
F_L       &      & {0      <      S_L}\\
F^*_L     &      & {S_L \leq 0 < S_M}\\
F^*_R     &      & {S_M \leq 0 < S_R}\\
F_R       &      & {S_R \leq 0}
\end{array} \right. $$
方法三:
$$f(x)=
\begin{cases}
0& \text{x=0}\\
1& \text{x!=0}
\end{cases}$$
```

方法一：
$$ f(x)=\left\{
\begin{aligned}
x & = & \cos(t) \\
y & = & \sin(t) \\
z & = & \frac xy
\end{aligned}
\right.
$$
方法二：
$$ F^{HLLC}=\left\{
\begin{array}{rcl}
F_L       &      & {0      <      S_L}\\
F^*_L     &      & {S_L \leq 0 < S_M}\\
F^*_R     &      & {S_M \leq 0 < S_R}\\
F_R       &      & {S_R \leq 0}
\end{array} \right. $$
方法三:
$$f(x)=
\begin{cases}
0& \text{x=0}\\
1& \text{x!=0}
\end{cases}$$

# 符号表

要输出字符　空格　#　$　%　&　_　{　}　，用命令：`\空格　#　\$　\%　\&　_　{　}`

## 运算符表

### 关系运算符

|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|
|\pm|$\pm$|\times|$\times$|
|\div|$\div$|\mid|$\mid$|
|\nmid|$\nmid$|\cdot|$\cdot$|
|\circ|$\circ$|\ast|$\ast$|
|\bigodot|$\bigodot$|\bigotimes|$\bigotimes$|
|\bigoplus|$\bigoplus$|\leq|$\leq$|
|\geq|$\geq$|\neq|$\neq$|
|\approx|$\approx$|\equiv|$\equiv$|
|\sum|$\sum$|\prod|$\prod$|

### 集合运算符

|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|
|\emptyset|$\emptyset$|\in|$\in$|
|\notin|$\notin$|\subset|$\subset$|
|\supset|$\supset$|\subseteq|$\subseteq$|
|\supseteq|$\supseteq$|\bigcap|$\bigcap$|
|\bigcup|$\bigcup$|\bigvee|$\bigvee$|
|\bigwedge|$\bigwedge$|\biguplus|$\biguplus$|
|\bigsqcup|$\bigsqcup$|&ensp;|&ensp;|

### 对数运算符

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\log|$\log$|\lg|$\lg$|\ln|$\ln$|

### 三角运算符

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\bot|$\bot$|\angle|$\angle$|30^\circ|$30^\circ$|
|\sin|$\sin$|\cos|$\cos$|\tan|$\tan$|
|\cot|$\cot$|\sec|$\sec$|\csc|$\csc$|

### 微积分运算符

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\prime|$\prime$|\int|$\int$|\iint|$\iint$|
|\iiint|$\iiint$|\oint|$\oint$|\lim|$\lim$|
|\infty|$\infty$|\nabla|$\nabla$|&ensp;|&ensp;|

### 逻辑运算符

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\because|$\because$|\therefore|$\therefore$|\forall|$\forall$|
|\exists|$\exists$|\not=|$\not=$|\not>|$\not>$|
|\not<|$\not<$|\not\subset|$\not\subset$|&ensp;|&ensp;|

## 其它符号

### 戴帽和连线符号

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\hat{y}|$\hat{y}$|\check{y}|$\check{y}$|\breve|$\breve{y}$|
|\overline{a+b+c+d}|$\overline{a+b+c+d}$|\underline{a+b+c+d}|$\underline{a+b+c+d}$|\overbrace{a+\underbrace{b+c}_{1.0}+d}^{2.0}|$\overbrace{a+\underbrace{b+c}_{1.0}+d}^{2.0}$|

### 箭头符号

|命令|显示|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|:--:|:--:|
|\uparrow|$\uparrow$|\downarrow|$\downarrow$|\Uparrow|$\Uparrow$|
|\Downarrow|$\Downarrow$|\rightarrow|$\rightarrow$|\leftarrow|$\leftarrow$|
|\Rightarrow|$\Rightarrow$|\Leftarrow|$\Leftarrow$|\longrightarrow|$\longrightarrow$|
|\Longrightarrow|$\Longrightarrow$|\longleftarrow|$\longleftarrow$|\Longleftarrow|$\Longleftarrow$|

# 矩阵

## 基本语法

- 起始标记`\begin{matrix}`,结束标记`\end{matrix}`
- 每一行末标记`\\`进行换行，行间元素以`&`分隔用于对齐。

```latex
$$\begin{matrix}
1&0&0\\
0&1&0\\
0&0&1\\
\end{matrix}$$
```

$$\begin{matrix}
1&0&0\\
0&1&0\\
0&0&1\\
\end{matrix}$$

## 进阶

- 可用下列词替换`matrix`设置矩阵边框
  - pmatrix、bmatrix、Bmatrix：小括号、中括号、大括号边框
  - vmatrix、Vmatrix：单竖线、双竖线边框
- 省略元素
  - 横省略号：`\cdots`
  - 竖省略号：`\vdots`
  - 斜省略号：`\ddots`

```latex
$$\begin{Bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{Bmatrix}$$
```

$$\begin{Bmatrix}
{a_{11}}&{a_{12}}&{\cdots}&{a_{1n}}\\
{a_{21}}&{a_{22}}&{\cdots}&{a_{2n}}\\
{\vdots}&{\vdots}&{\ddots}&{\vdots}\\
{a_{m1}}&{a_{m2}}&{\cdots}&{a_{mn}}\\
\end{Bmatrix}$$

# 希腊字母表

|命令|显示|命令|显示|
|:--:|:--:|:--:|:--:|
|\alpha|$\alpha$|\beta|$\beta$|
|\gamma|$\gamma$|\delta|$\delta$|
|\epsilon|$\epsilon$|\zeta|$\zeta$|
|\eta|$\eta$|\theta|$\theta$|
|\iota|$\iota$|\kappa|$\kappa$|
|\lambda|$\lambda$|\mu|$\mu$|
|\nu|$\nu$|\xi|$\xi$|
|\pi|$\pi$|\rho|$\rho$|
|\sigma|$\sigma$|\tau|$\tau$|
|\upsilon|$\upsilon$|\phi|$\phi$|
|\chi|$\chi$|\psi|$\psi$|
|\omega|$\omega$|&ensp;|&ensp;|

- 如果需要大写的希腊字母，将命令首字母大写即可
  - 例如：`\Gamma`,显示$ \Gamma $
- 如果要将字母斜体显示，使用`\var`前缀即可
  - 例如：`\varGamma`，显示$ \varGamma $


# 杂项

- 分组：
  - 使用`{}`将具有相同等级的内容扩入其中，成组处理。
  - 比如：`\10^10`呈现为$10^10$，`10^{10}`呈现为$10^{10}$。
- 空格：
  - 单个空格：`a\ b`，$a\ b$
  - 四个空格：`a\quad b`,$a\quad b$
- 上标`^`，下标`_`
- 尖括号`\langle\rangle`：$\langle\rangle$
- 使用`\left`或`\right`使符号大小与临近的公式符号相适应，对比如下：
  - `(\frac{x}{y})`：$(\frac{x}{y})$
  - `\left(\frac{x}{y}\right)`：$\left(\frac{x}{y}\right)$
- 分式：
  - `\frac{1}{3}`：$\frac{1}{3}$
  - `1 \over 3`：$1 \over 3$
- 开根`\sqrt[n]{3}`：$\sqrt[n]{3}$
- 省略号：
  - `\ldots`：与文本底线对齐的省略号
  - `\cdots`：与文本中线对齐的省略号
  - `$f(x_1,x_2,\ldots,x_n) = x_1^2 + x_2^2 + \cdots + x_n^2$`：$f(x_1,x_2,\ldots,x_n) = x_1^2 + x_2^2 + \cdots + x_n^2$

## 综合运用示范

```latex
% 极限运算
$$\lim\limits_{n \rightarrow +\infty} \frac{1}{n(n+1)}$$ 
$$\lim_{n \rightarrow +\infty} \frac{1}{n(n+1)}$$ 
```

$$\lim\limits_{n \rightarrow +\infty} \frac{1}{n(n+1)}$$ 

$$\lim_{n \rightarrow +\infty} \frac{1}{n(n+1)}$$ 

```latex
$$ \left[J_\alpha(x) = \sum_{m=0}^\infty \frac{(-1)^m}{m! \Gamma (m + \alpha + 1)} {\left({ \frac{x}{2} }\right)}^{2m + \alpha}\right] $$
```

$$ \left[J_\alpha(x) = \sum_{m=0}^\infty \frac{(-1)^m}{m! \Gamma (m + \alpha + 1)} {\left({ \frac{x}{2} }\right)}^{2m + \alpha}\right] $$

# 参考

- [MathJax使用LaTeX语法编写数学公式教程](https://www.zybuluo.com/knight/note/96093)
- [MathJax 语法参考](https://qianwenma.cn/2018/05/17/mathjax-yu-fa-can-kao/#)
- [基本数学公式语法(of MathJax)](https://blog.csdn.net/ethmery/article/details/50670297)
- [MathJax basic tutorial and quick reference](https://math.meta.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference)

