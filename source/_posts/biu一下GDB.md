---
title: Biu一下GDB
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2018-12-03 23:51:52
tags: GDB
categories: CPP
declare:
toc: true
password: false
updated:
---

# gcc常见编译选项

- ** -c **:只激活预处理、编译和汇编，也就是生成obj文件
- ** -S **:只激活处理和编译，把文件编译成汇编代码
- ** -o **:定制目标名称，缺省的时候编译出来的可执行程序名为a.exe(windows)或a.out(linux)
- ** -Wall **:打开一些很有用的编译警告
- ** -std **:指定C标准，如-std=99，使用C99标准
- ** -g **:指示编译器，编译的时候添加调试信息
- ** -O0 -O1 -O2 -O3 **：编译器的优化选项的4个级别，-O0表示没有优化,-O1为缺省值，-O3优化级别最高

<!-- more -->

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/%E5%BD%95%E5%88%B6_2018_12_03_20_11_09_554.gif)

```c
/*
file_name: swap.c
*/ 

#include<stdio.h>
void swap(int a, int b)
{
	int t;
	t = a;
	a = b;
	b = t;
}

int main()
{
    int a=3, b=4;
	swap(a,b);
	printf("%d %d",a,b);
	return 0;	
}
```

# GDB的使用

>[什么是GDBhttps://www.bing.com/knows/search?q=gdb&mkt=zh-cn&FORM=BKACAI](https://www.bing.com/knows/search?q=gdb&mkt=zh-cn&FORM=BKACAI)
>[http://www.gnu.org/software/gdb/](http://www.gnu.org/software/gdb/)

>一般来说，GDB主要帮助你完成以下四个方面的内容
>1、启动你的程序，可以按照你的自定义的要求随心所欲的运行程序
>2、可以让被调试的程序在你所指定的调置的断点处停住。(断点可以是条件表达式)
>3、当程序被停住时，可以检查此时你的程序中所发生的事
>4、你可以改变你的程序，将一个BUG产生的影响修正，从而测试其他BUG


## GDB常见命令

|简称|全称|备注|
|:--:|:--:|:--|
|l|list|显示指定行号或者指定函数附近的源代码|
|b|break|在指定行号或指定函数开头设置断点|
|r|run|运行程序，直到程序结束或遇到断点|
|c|continue|在程序中断后继续执行程序，直到程序结束或遇到断点停下。注意在程序开始执行前只能用r，而不能用c|
|n|next|执行一条语句。如果有函数调用，则把它当做一个整体|
|s|step|执行一条语句。如果有函数调用，则进入函数内部|
|u|until|执行到指定行号或指定函数的开头|
|p|print|显示变量或表达式的值|
|disp|display|把一个表达式设置为display，当程序每次停下来时都会显示其值|
|cl|clear|取消断点，和b格式相同，如果该位置有多个断点，将同时取消|
|i|info|显示各种信息，如i b显示所有断点，i disp显示display，而i lo显示所有局部变量|
|bt|backtrace|打印所有栈帧信息|


## 调用栈（Call Stack）

调用栈描述的是函数之间的调用关系。调用栈由栈帧（Stack Frame）组成，每个栈帧对应着一个未运行完的函数。在GDB中可以用backtrace（简称bt）命令打印所有栈帧信息。若要用p命令打印一个非当前栈帧的局部变量，可以用frame命令选择另一个栈帧

### 拿个程序来玩玩,***swap.c***文件

```c
#include<stdio.h>
void swap(int a, int b){
	int t;t = a;a = b;b = t;
}

int main(){
    int a=3, b=4;
	swap(a,b);
	printf("%d %d",a,b);
	return 0;	
}
```

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/001.png)

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/002.png)

*** 程序的目的是交换a和b的值，然而并没有交换交换成功 ***

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/003.png)

原因：

- 函数的形参和在函数内部声明的变量都是该函数的局部变量。无法访问其他函数的局部变量。
- 局部变量的存储空间是临时分配的，函数执行完毕时，局部变量的空间将被释放，其中的值无法保留到下次使用。
- 如果要实现真正的交换，我们应该传入的是存储变量的地址，此时函数swap的形参类型应该为指针类型

>PS:
>C语言的变量都是放在内存中的，而内存中间的每一个字节都有一个称为地址(address)的编号。
>每一个变量都占有一定数目的字节（可以用sizeof运算符获得），其中第一个字节的地址称为变量的地址。

### o(*≧▽≦)ツ┏━┓拿个递归程序来玩玩

```c
#include<stdio.h>
int f(int n)
{
	return n == 0 ? 1 : f(n-1)*n;
}
int main()
{
	printf("%d\n",f(3));
	return 0;
}

```

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/004.png)

![](https://raw.githubusercontent.com/yeshan333/blog_images/master/005.png)

>在C语言的函数中，调用自己和调用其他函数没有任何本质区别，都是建立新栈帧，传递参数并修改当前代码行。在函数执行体完毕后删除栈帧，处理返回值，并修改当前代码行数。

>以上调用栈的一个比喻
>>皇帝（拥有main函数的栈帧）：大臣，你给我算下f(3)
>>大臣（拥有f(3)的栈帧）：知府，你给我算下f(2)
>>知府（拥有f(2)的栈帧）：县令，你给我算下f(1)
>>县令（拥有f(1)的栈帧）：师爷，你给我算下f(0)
>>师爷（拥有f(0)的栈帧）：回老爷，f(0)=1
>>县令（心算f(1)=f(0)*1=1）：回知府大人，f(1)=1
>>知府（心算f(2)=f(1)*2=2）：回大人，f(2)=2
>>大臣（心算f(3)=f(2)*3=6）：回皇上，f(3)=6
>>皇上满意了

emmmmmm。。。。。。。。。。。。

