---
title: 精度(precision)控制
date: 2018-11-06 23:50:56
tags: CPP
categories: CPP
declare:
toc:
updated:
keywords: "c++, precision control, print format"
---
# C++输出精度（precision）控制,格式化输出

## 使用cout对象的成员

- setprecision()
- setf()
- width()
- fill()
- flags(ios::fixed)

<!-- more -->

```c++
#include<iostream>
using namespace std;

int main()
{
	double a=3.1415926;
	double c=66.666666;

	cout.precision(3);        //控制输出流显示的有效数字个数
	cout<<a<<endl;
	cout<<c<<endl;

	cout<<endl;

	cout.width(8);           //控制输出宽度
	cout.setf(ios::right);   //设置对齐方式
	cout<<a<<endl;

	cout<<endl;

	cout.setf(ios::right);
	cout.fill('#');          //设置填充字符
	cout.width(8);
	cout<<a<<endl;

	cout<<endl;

	cout.flags(ios::fixed); //flags(ios::fixed)和precision()配合使用控制精度
	cout.precision(4);
	cout<<a<<endl;

	return 0;
}
```
![](https://i.imgur.com/PHoahko.png)

## 使用头文件iomanip中的setprecision()和setiosflags(ios::fixed)进行精度控制

```c++
#include<iostream>
#include<iomanip>
using namespace std;

int main()
{
	double e = 2.7182818;

	cout<<setprecision(3)<<e<<endl;

	cout<<setiosflags(ios::fixed)<<endl;
    cout<<setprecision(3)<<e<<endl;
    return 0;
}
```

![](https://i.imgur.com/5IDLZTl.png)


参考自：
[https://blog.csdn.net/yanglingwell/article/details/49507463](https://blog.csdn.net/yanglingwell/article/details/49507463)



---