---
title: C++入坑记
date: 2018-10-02 00:40:03
tags: CPP
categories: CPP
declare: true
toc: true
updated:
---
# C++关键字
[https://www.runoob.com/w3cnote/cpp-keyword-intro.html](https://www.runoob.com/w3cnote/cpp-keyword-intro.html)

|asm|else|new|this|
|:--:|:--:|:--:|:--:|
|auto|enum|operator|throw|
|bool|explicit|private|true|
|break|export|protected|try|
|case|extern|public|typedef|
|catch|false|register|typeid|
|char|for|return|union|
|const|friend|short|unsigned|
|const_cast|goto|signed|using|
|continue|if|sizeof|virtual|
|default|inline|static|void|
|delete|int|static_cast|volatile|
|do|long|struct|wchar_t|
|double|mutable|switch|while|
|dynamic_cast|namespace|template|...|
<!-- more -->
# 入坑C++

```c++
#include<iostream>         //文件包含，包含iostream标准库 
using namespace std;       //声明一个叫std的命名空间 
int main()
{
	string my_name;
	int age;
	cin>>my_name>>age;
	cout<<my_name<<' '<<age;
	cout<<"\nHello C++ !"<<endl<<"Nice"<<"\n\n";
	cout<<"Nice to meet you !";
}
```
流提取运算符`>>`
流插入运算符`<<`
## 什么是命名空间

>命名空间(namespace)为防止名字冲突提供了更加可控的机制。

>一个命名空间的定义包含两部分：首先是关键字namespace，随后是命名空间的名字。在命名空间名字后面是一系列由花括号括起来的声明和定义。只要能出现在全局作用域中的声明就能置于命名空间内，主要包括：类、变量(及其初始化操作)、函数(及其定义)、模板和其它命名空间。命名空间结束后无须分号，这一点与块类似。和其它名字一样，命名空间的名字也必须在定义它的作用域内保持唯一。命名空间既可以定义在全局作用域内，也可以定义在其它命名空间中，但是不能定义在函数或类的内部。命名空间作用域后面无须分号。

[https://blog.csdn.net/fengbingchun/article/details/78575978?utm_source=copy](https://blog.csdn.net/fengbingchun/article/details/78575978?utm_source=copy) 
只是新标准中使用不带.h的头文件包含时，必须要声明命名空间，并且包含头文件在前，声明使用的名字空间在后。

例如标准C++库提供的对象都存在std这个标准名字中，比如cin，cout，endl。

### 写法--1
```c++
#include<iostream>
using namespace std;
int main()
{
	int a;
	cin>>a;
	cout<<a<<endl;
	cout<<"**************************\n";
	cout<<"Hello World!"<<endl;
	cout<<"**************************\n";
	return 0;
}
```
### 写法--2
使用域限定符`::`来逐个制定,cout和endl前面分别用std::指明，表示来自std
```c++
#include<iostream>
int main()
{
    int a;
	std::cin>>a;
	std::cout<<a<<std::endl;
	std::cout<<"**************************\n";
	std::cout<<"Hello World!"<<std::endl;
	std::cout<<"**************************\n";
	return 0;
}
```
### 写法--3
用using和域限定符一起制定用哪些名字
```c++
#include<iostream>
using std::cin;
using std::cout; 
using std::endl;
int main()
{
	int a;
	cin>>a;
	cout<<a<<endl;
	cout<<"**************************\n";
	cout<<"Hello World!"<<endl;
	cout<<"**************************\n";
	return 0;
}
```
在用cin和cout输入和输出数据时，不需要手动控制数据类型就可以使用

![](https://i.imgur.com/lS3R8LI.jpg)

---
更新于2018/10/4 23:15:56 
---
**I/O库头文件**	
`<iostream>、<iomanip>、<fstream>`

|头文件|函数和描述|
|:--:|:--:|
|iostream|该文件定义了cin、cout、cerr和clog对象，分别对应于标准输入流、标准输出流、非缓冲标准错误和缓冲标准错误流||
|iomanip|该文件通过所谓的参数化的流操纵器（比如setw和setprecision），来声明对执行标准化I/O有用的服务|
|fstream|该文件为用户控制的文件处理声明服务|
---