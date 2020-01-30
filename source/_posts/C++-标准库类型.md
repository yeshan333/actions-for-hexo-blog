---
title: C++标准库类型
date: 2018-11-05 23:24:19
tags: CPP
categories: CPP
declare: true
toc: true
updated:
---
# 标准库类型string

- 标准库类型string表示可变长的字符序列
- 使用string类型必须包含string头文件，string定义在命名空间std中

## 定义和初始化string对象

初始化string对象的方式

|初始化方式|说明|
|:--|:--|
|string s1|默认初始化，s1是一个空字符串|
|string s2(s1)|s2是s1的副本|
|string s2=s1|等价于s2(s1)，s2是s1的副本|
|string s3("shansan")|s3是字面值"shansan"的副本，除了字面值最后的那个空字符串外|
|string s3="shansan"|等价于s3("shansan")|
|string s4(n,'c')|把s4初始化为由连续n个字符c组成的串|

<!-- more -->

```c++
#include<iostream>
using namespace std;

int main()
{
	string s1;
	cout<<s1<<endl;
	cout<<"1"<<endl;
	
	string s2 = "shansan";
	cout<<s2<<endl;
	
	string s3(s2);
	cout<<s3<<endl;
	
	string s4(6,'s');
	cout<<s4<<endl;
	
	return 0;
}
```

![](https://i.imgur.com/KacK6Mf.png)

## string对象上的操作

- getline(is,s):从is中读取一行赋给s，返回is
- s.empty():s为空返回true
- s.size():返回s中字符的个数

```c++
#include<iostream>
using namespace std;
//empty(),getline(),size()
int main()
{
	string s;
	
	cin>>s;
	//* 读取时string对象会默认忽略掉开头的空白（即空格符、换行符、制表符等）
	//* 从第一个真正的字符开始读起，直到遇见下一处空白为止 
	cout<<s<<endl;
	cout<<s.size()<<endl;
	
	if(!s.empty())//如果string对象非空
	{
		cout<<"the string is not empty !"<<endl; 
	}
	
	string line;
	//每次读取一整行，遇到换行符结束
	while(getline(cin,line))
	    cout<<line<<endl;
	
	return 0;
}
```

![](https://i.imgur.com/d0rQ9vw.gif)


# 标准库类型vector

** #include<vector> **
- 标准库类型表示对象的集合，其中所有的对象类型都相同
- 集合中的每一个对象都有一个与之对应的索引，索引用于访问对象

## 定义和初始化vector对象

|定义和初始化vector对象的方法|说明|
|:--|:--|
|vector<T> v1|v1是一个空vector，它潜在的元素是T类型的，执行默认初始化|
|vector<T> v2(v1)|v2中包含有v1所有元素的副本|
|vector<T> v2=v1|等价于v2(v1)|
|vector<T> v3(n,value)|v3包含了n个重复的元素，每个元素的值都是value|
|vector<T> v4(n)|v4包含了n个重复地执行了值初始化的对象|
|vector<T> v5{a,b,c,...}|v5包含了初始值的个数的元素，每元素被赋予相应的初始值|
|vector<T> v5={a,b,c,...}|等价于v5|

## vector对象上的操作

- v.empty():如果v不含有任何元素，返回真，否者返回假
- v.size():返回v中元素的个数
- v.push_back(t):向v的尾端添加一个值为t的元素

```c++
#include<iostream>
#include<vector>
using namespace std;

int main()
{
	vector<int> s={1,2,3,4,5};;//列表初始化vector对象s
	//- 可使用下标访问vector对象  
	cout<<s[0]<<endl;
	
	vector<int> a(8,1);
	for(auto i:a)
	{
		cout<<i<<" ";
	}
	cout<<endl;
	
	string word;
	vector<string> text;
	while(cin>>word)  
	{
		text.push_back(word);//push_back()
	}
	for(auto str:text)
	{
	    cout<<str<<" ";	
	}
	return 0; 
} 
```

![](https://i.imgur.com/GWogUU7.gif)

### 使用范围for语句处理vector对象

```c++
#include<iostream>
#include<vector>
using namespace std;

int main()
{
	int num;
    vector<int> v;
	
	while(cin>>num)//获取元素值 
	{
		v.push_back(num);
	}
	
	for(auto &i:v)//求元素值的平方 
	{
		i = i*i;
	}
	
	for(auto temp:v)//输出v中每一个元素 
	{
		cout<<temp<<" ";
	}
	return 0; 
} 
```

![](https://i.imgur.com/UGVxERa.png)


## 不可用下标形式为vector对象添加元素

```c++
#include<iostream>
#include<vector>
using namespace std;

int main()
{
	vector<int> v;//空的vector对象 
	for(decltype(v.size()) i =0;i!=6;i++) 
	{
		v[i] = i;
	}
	// -v是一个空的vector，不存在任何元素，不能通过下标去访问
	// -应该使用vector对象的成员函数push_back()为vector对象添加元素较为安全 
	cout<<v[0]<<endl; 
	return 0; 
} 
```
![](https://i.imgur.com/wnFCgYu.png)

<font color="red">vector对象(以及string对象)的下标运算符可用于访问已存在的元素，而不能用于添加元素</font>

# 使用标准库函数begin()和end()遍历数组

```c++
#include<iostream>
using namespace std;
//库函数begin和end，以数组名作为参数 
int main()
{
	int sums[]={1,2,3,4,5,6,7,8,9,10};
	int *beg = begin(sums);        //指向sums首元素的指针 
	int *last = end(sums);         //指向sums尾元素的下一位置的指针 
	int *temp;
	for(temp = beg;temp != last;temp++)
	{
	    cout<<*temp<<" ";	
	}
	return 0;
}
```
![](https://i.imgur.com/mQfE3Y9.png)
- begin()函数返回指向数组sums首元素的指针
- end()函数返回指向数组sums尾元素下一位置的指针

# 使用可迭代对象（容器||string对象）的成员begin()和end()进行遍历

- end成员返回指向容器(string对象)“尾元素下一位置（one past the end）”的迭代器（尾后迭代器）
- begin成员负责返回指向第一个元素（或者第一个字符的迭代器）

```c++
#include<iostream>
#include<vector>
#include<string.h>
using namespace std;
int main()
{
	string s="shan san";//s("shan san");
	cout<<s<<endl;
	//首字母改成大写形式 
	if(s.begin() != s.end())
	{
		auto it = s.begin();//令it指向s的第一个元素 
		*it = toupper(*it);
	}
	cout<<s<<endl;
	
	//全部字母改成大写形式,&& !isspace(*temp)
	//temp是个迭代器，通过 * 运算符解引用迭代器获得迭代器所指的对象 
	for(auto temp=s.begin();temp != s.end() ; temp++)
	{
		*temp = toupper(*temp);
	}
	cout<<s<<endl;
	
	const int a=8;
	//a=0;
	cout<<a<<endl;
	
	char c[10]="123456789";
	char b[10];
	strcpy(b,c);
	cout<<b[1]<<endl;
	
	
	return 0;
}
```

![](https://i.imgur.com/6FIwWel.png)


---