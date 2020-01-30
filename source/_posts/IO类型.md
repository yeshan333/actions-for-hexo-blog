---
title: IO类型
date: 2018-11-22 00:13:54
tags: CPP
categories: CPP
declare: true
toc: true
updated:
---
# IO库

** IO库设施: **
- `istream`类型:提供输入操作
- `ostream`类型:提供输出操作
- `cin`:一个istream对象，从标准输入读取数据
- `cout`:一个ostream对象，从标准输出写入数据
- `cerr`:一个ostream对象，通常用于输出程序错误信息，写入到标准错误
- `>>`运算符:用来从一个istream对象读取输入数据
- `<<`运算符:用来向一个ostream对象写入数据
- `getline`函数:从一个给定的istream读取一行数据，存入一个给定的string对象中

<!-- more -->

## IO类

|头文件|IO库类型|
|:--:|:--:|
|iostream|istream,wistream从流读取数据<br>ostream,wostream向流写入数据<br>iostream,wiostream读写流|
|fstream|ifstream,wistream从文件读取数据<br>ofstream,wofstream向文件写入数据<br>fstream,wfstream读写文件|
|sstream|istringstream,wistringstream从string读取数据<br>ostringstream,wostringstream向string写入数据<br>stringstream,wstringstream读写string|


- <font color="green">IO对象没有拷贝或赋值</font>
- <font color="green">定义函数时不能将形参设置为流类型</font>
- <font color="green">进行IO操作的函数通常使用引用方式传递和返回流</font>

因为读写一个IO对象会改变其状态，因此传递和返回的引用不能是const类型的

一个流一旦发生错误，其后续的IO操作都会失败

```c
#include<iostream>
using namespace std;

istream& read_print(istream &s)
{
	int score;
	while(s>>score)
	{
		cout<<score<<endl;
	} 
    s.clear();//流复位，清楚所有错误标志位 
    return s;
}

int main()
{
	read_print(cin);
	cout<<"shansan";
	return 0;
}
```

### 输出缓冲管理

    cout<<"shansan"

文本串可能立即打印出来，但也有可能被操作系统保存在操作系统的缓冲区中，随后再打印。
缓冲机制的存在可以让操作系统将程序的多个输出操作组合成单一的系统级写操作
由于设备写操作可能很耗时间，允许操作系统将多个输出操作组合为单一的设备写操作可以带来很大的便利

** 使用操纵符刷新缓冲区 **

- endl:完成换行机制并且刷新缓冲区
- ends:仅刷新缓冲区
- flush:仅刷新缓冲区

程序崩溃，输出缓冲区不会刷新

## 文件IO

[https://shansan.top/2018/10/22/%E5%9D%91%E4%BA%BA%E7%9A%84C++-2/#%E5%86%99%E5%85%A5%E6%96%87%E4%BB%B6-amp-amp-%E8%AF%BB%E5%8F%96%E6%96%87%E4%BB%B6](https://shansan.top/2018/10/22/%E5%9D%91%E4%BA%BA%E7%9A%84C++-2/#%E5%86%99%E5%85%A5%E6%96%87%E4%BB%B6-amp-amp-%E8%AF%BB%E5%8F%96%E6%96%87%E4%BB%B6)
头文件定义了三个文件类型来支持文件IO

- ifstream:从文件读取数据
- ofstream:向文件写入数据
- fstream:读和写操作都能进行

每一个文件流对象都定义了一个名为open的成员函数，它完成了一些系统相关的操作，来定位给定的文件，并视情况打开为读或写模式
一旦一个文件流已经打开，它就保持与对应文件的关联。对一个已经打开的文件流调用open会失败，并会导致failbit被置位，随后试图使用文件流的操作都会失败

** ifstream、ofstream、fstream对象上的操作，以下操作都适用

|操作|说明|
|:--:|:--:|
|fstream file|创建一个未绑定的文件流|
|fstream file(file_name)|创建一个fstream对象，并打开名字为file_name的文件。file_name可以是一个指向C风格的字符串，也可以是一个string类型|
|fstream file(file_name,mode)|mode为指定的打开模式|
|fstream.close()|关闭与fstream绑定的文件|
|fstream.is_open()|返回一个bool值，指出与fstream关联的文件是否成功被打开且尚未被关闭|

```c
#include<iostream>
#include<fstream>
#include<vector> 
using namespace std;

void write()
{
	ofstream file;
	file.open("shansan.txt");
    //等价于fstream file("shanshan.txt");
	
	//像文件写入数据	
	file<<"shansan"<<endl;
	file<<"shansan.top"<<endl;
	file<<"yeshan333.github.io"<<endl;
	file.close();
}

void read_print()
{
	string buffer;
    ifstream read_file("shansan.txt");
	vector<string> v;
	while(getline(read_file,buffer))//每次从read_file读取一行给buffer 
	    v.push_back(buffer);//将buffer存到vector对象v中 
	
	for(auto temp:v)
	    cout<<temp<<endl;	
} 

int main()
{
	write(); 
	read_print();
	return 0;
}
```

![](https://i.imgur.com/Rtdn8Ax.gif)

## 文件模式

每一个流都有一个关联的文件模式，用来指出如何使用文件。
每一个文件流都定义了一个默认的文件模式
- 与ifstream关联的文件默认以in模式打开
- 与ofstream关联的文件默认以out模式打开
- 与fstream关联的文件默认以in和out模式打开

|文件模式|说明|
|:--:|:--:|
|in|以读方式打开文件|
|out|以写方式打开文件|
|app|每次写操作前均定位到文件末尾|
|ate|打开文件后立即定位到文件末尾|
|trunc|截断文件|
|binary|以二进制方式进行IO|


---