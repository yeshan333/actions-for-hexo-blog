---
title: 坑人的C++
date: 2018-10-22 23:38:58
tags: CPP
categories: CPP
declare: true
toc: true
updated:
---
# C++自定义命名空间
使用关键字namespace

	namespace namespace_name
	{
		//代码声明
	}
<!-- more -->

```c++
#include<iostream>
using namespace std;
using std::cout;
namespace print_myname{
    void func()
    {
    	cout<<"myname: shansan"<<endl;
	}
}

namespace print_font{
    void func_1()
    {
    	std::cout<<"什么鬼 ！"<<endl;
	}
}


using namespace print_myname;
using namespace print_font;
 
int main()
{
	//print_myname::func();
	func();
	
	//print_font::func_1();
	func_1();
	return 0;
}
```
![](https://i.imgur.com/IvaQsEx.png)

![](https://i.imgur.com/cmrUaSk.png)

## 不连续的命名空间
>命名空间可以定义在几个不同的部分中，因此命名空间是由几个单独定义的部分组成的。一个命名空间的组成部分可以分布在多个文件中
>所以，如果命名空间中某个组成部分需要请求定义在另一个文件中的名称，仍然需要声明该名称。
下面的命名空间可以定义一个新的命名空间，也可以是为已有的命名空间增加新的元素。

	namespace namespace_name
    {
        //代码生明
    }

## 嵌套的命名空间

可以在一个命名空间中定义另一个命名空间

```c++
#include<iostream>
using namespace std;

namespace my_firstname
{
	void print_firstname()
	{
		cout<<"shan ";
	}
	namespace my_lastname
	{
	    void print_lastname()
		{
			cout<<"san"<<endl; 
		}	
	}
}

//using namespace my_firstname;
using namespace my_firstname::my_lastname;

int main()
{
	//print_firstname();
	//my_lastname::print_lastname();
	
	print_lastname();
	return 0;
}
```

# C++异常处理

- 异常是在程序执行期间产生的问题。
- C++异常是指在程序运行时发生的特殊情况，比如尝试除以零的操作。
- 异常提供了一种转移程序控制权的方式。

<font color="red">C++异常处理关键字</font>
* `throw`:当问题出现时，程序会抛出一个异常。通过throw关键字来完成。
* `catch`:在想要处理问题的地方，通过异常处理程序捕获异常。catch关键字用于捕获异常。
* `try`:try块中的代码标识将被激活的特定异常。他后面通常跟着一个或者多个catch块
如果您想让 catch 块能够处理 try 块抛出的任何类型的异常，则必须在异常声明的括号内使用省略号`...`
    
```
try
	{
	    //被保护代码块
	}
	catch(...)
    {
        //能处理任何异常代码
    }
```

```c++
#include<iostream>
using namespace std;

double division(double a,double b)
{
	if(b == 0)
	{
		throw "Division by zero condition!";
	}
	return (a/b);
}

int main()
{
	int a,b;
	double temp;
	scanf("%d%d",&a,&b);
	try
	{
		temp = division(a,b);
		cout<<temp<<endl;
	}
	/*由于我们抛出了一个类型为 const char* 的异常，
	因此，当捕获该异常时，我们必须在 catch 块中使用 const char*。*/	
	catch(const char *msg)
	{
		cerr<<msg<<endl;
	}
	
	return 0;
}
```

![](https://i.imgur.com/9QFbzHU.gif)

---