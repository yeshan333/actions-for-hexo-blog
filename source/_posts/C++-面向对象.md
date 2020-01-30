---
title: C++面向对象
date: 2018-10-05 23:15:07
tags: CPP
categories: CPP
declare: true
toc: true
updated:
---
# 类 & 对象
><font color="red">类是对象的抽象和概括，而对象是类的具体和实例</font>

<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=86 src="//music.163.com/outchain/player?type=2&id=1308818967&auto=1&height=66"></iframe>

<!-- more -->

* 类用于指定对象的形式，它包含了数据表示法和用于处理数据的方法。
* 类中的数据和方法称为类的成员。(成员有变量也有函数，分别成为类的属性和方法)

```c++
#include<iostream>
#include<Cstring>
using namespace std;

/*class Student
{
	public:
		int num;
		char name[100];
		int score;
		int print()
		{
			cout<<num<<" "<<name<<" "<<score;
			return 0;
		} 
};*/

class Student
{
	public: 
	    int num;
		char name[100];
		int score;
		int print(); 
}; 

int Student::print()
{
	cout<<num<<" "<<name<<" "<<score;
	return 0; 
}
  
int main()
{
	Student A;
	A.num=1700710135;
	strcpy(A.name,"ye shan");
	A.score=100;
	//A.print();
	
	//Student *Ap;
	//Ap=&A;
	//Ap->print();
	
	Student& A_reference=A;  //引用定义时就要初始化 
	//A_reference=A;  错误 
	A_reference.print(); 
	
	return 0;
} 
```
![](https://i.imgur.com/f8XiWyi.png)
## 类的定义
>定义一个类，本质上是定义一个数据类型的蓝图。它定义类的对象包括了什么，以及可以在这个对象上执行哪些操作。

类的定义以关键字`class`开头，后面跟类的名称。类的主体包含在一对花括号中。类定义后必须跟着`一个分号或一个声明列表`。
### 写法1
成员函数定义在在类里
```c++
class Student
{
	public:       //声明公有成员，可被类的任何对象访问
		int num;
		char name[100];
		int score;
		int print()
		{
			cout<<num<<" "<<name<<" "<<score;
			return 0;
		} 
};
```
### 写法2
成员函数定义在类外，使用范围解析运算符(作用域限定符)`::`
	在::限定符前必须使用类名
```c++
class Student
{
	public:
	    int num;
		char name[100];
		int score;
		int print(); 
}; 

int Student::print()
{
	cout<<num<<" "<<name<<" "<<score;
	return 0; 
}
```
## 对象的建立和使用
>类就是包含函数的结构体，是一种自定义数据类型，用它定义出来变量，就是对象，这就是所谓的“对象是类的具体和实例”，定义了一个这个类的对象，也可以说实例化了一个对象，就是这个意思！

1. 声明类的对象，就像声明基本的变量类型一样
2. 访问公共数据成员可以使用直接成员访问运算符`.`来访问

	
	Student A;    //声明A，类型为Student
	A.num=1700710135;
	strcpy(name,"ye shan");
	A.score=100;
	A.print();
### 类的访问修饰符
* private
* protected
* public

1. 成员和类的默认访问修饰符是`private`
&ensp; 私有成员变量或函数在类的外部是不可访问的，甚至是不可查看的。只有类和友元函数可以访问私有成员。
2. 保护成员修饰符`protected`，保护成员变量或函数与私有成员十分相似，但有一点不同，保护成员变量在派生类（即子类）中是可以访问的。
3. 公有成员在程序中类的外部是可以访问的。可以在不适用任何成员函数来设置和获取公有变量的值

```c++
#include<iostream>
#include<Cstring>
using namespace std;
class Student
{
	private:
		int num;
	protected:
		int score;
	public:
		char name[100];
		int GetNum(int n);
		int GetScore(int s);
};

int Student::GetNum(int n)
{
	num=n;
	return num;
} 

int Student::GetScore(int s)
{
	score=s;
	return score;
}

int main()
{
	Student A;
	
	strcpy(A.name,"yeshan");
	cout<<"the name is"<<" "<<A.name<<endl;
	
	//A.num=1700710135，成员num是稀有的，不可这样用 
	cout<<"the num is"<<" "<<A.GetNum(1700710135)<<endl;
	
	cout<<"the score is"<<" "<<A.GetScore(100)<<endl;
	
	return 0; 
}
```
![](https://i.imgur.com/l9YSrb0.png)

派生类中使用protected成员变量
```c++
#include<iostream>
#include<Cstring>
using namespace std;
class Student
{
	private:
		int num;
	protected:
		int score;
	public:
		char name[100];
		int GetNum(int n);
		int GetScore(int s);
};

class Small_Student:Student//Small_Student是派生类 
{
	public:
	    int Get_Score_1(int temp); 
}; 
int Small_Student::Get_Score_1(int temp)   //子类成员函数 
{
	score=temp;
	return score;
} 

int Student::GetNum(int n)
{
	num=n;
	return num;
} 

int Student::GetScore(int s)
{
	score=s;
	return score;
}

int main()
{
	Student A;
	
	strcpy(A.name,"yeshan");
	cout<<"the name is"<<" "<<A.name<<endl;
	
	//A.num=1700710135，成员num是稀有的，不可这样用 
	cout<<"the num is"<<" "<<A.GetNum(1700710135)<<endl;
	
	cout<<"the score is"<<" "<<A.GetScore(100)<<endl;
	
	Small_Student B;
	cout<<"the score is"<<" "<<B.Get_Score_1(520)<<endl; 
	
	return 0; 
}
```
![](https://i.imgur.com/ycHrArS.png)

## 类的静态成员
使用`static`关键字把类成员定义为静态的

## 静态成员数据

* 静态成员在类的所有对象中是共享的。如果不存在其它初始化语句，在创建第一个对象时，所有的静态数据都会被初始化为零。
* 不能把静态成员放置在类的定义中，但是可以在类的外部通过使用范围解析运算符`::`来重新声明静态变量，从而对它进行初始化。

```c++
#include<iostream>
using namespace std;

class Area
{
	private:
	    double length;
		double width;
	public:
		static int object_count;
	    Area(double x,double y)
		{
			length = x;
			width = y;
			object_count++;//每次创建对象时加一 
		}
		double Print_Area()
		{
			return length*width;
		}
};

int Area::object_count=0;//初始化类Area的静态成员
 
int main()
{
	Area number_1(3,4);
	Area number_2(5,6);
	
	cout<<"creat "<<Area::object_count<<" object"<<endl;  //使用    类名+范围解析运算符::+静态成员变量    访问静态成员数据 
	cout<<"the area of number_1 is "<<number_1.Print_Area();	
}
```
![](https://i.imgur.com/c1JTCaS.png)

## 静态成员函数
* 静态成员函数即使在类对象不存在的情况下也能被调用。
* 静态成员函数只能访问静态数据成员，不能访问其他静态成员函数和类外部的函数
* 静态成员函数有一个类范围，他们不能访问类的this指针。可以用静态成员函数来判断某些对象是否已被创建。
* 调用时使用 类名+范围解析运算符+静态成员函数名
  
```c++
#include<iostream>
using namespace std;

class Area
{
	private:
	    double length;
		double width;
	public:
		static int object_count;       //静态成员数据 
		static int get_count()        //静态成员函数 
		{
			return object_count;
		} 
	    Area(double x,double y)
		{
			cout<<"Constructor"<<endl; 
			length = x;
			width = y;
			object_count++;//每次创建对象时加一 
		}
		double Print_Area()
		{
			return length*width;
		}
};

int Area::object_count=0;//初始化类Area的静态成员
 
int main()
{
	cout<<"number of objects:"<<Area::get_count()<<endl;
	Area number_1(3,4);
	Area number_2(5,6);
	
	cout<<"after creat object ,number of objects:"<<Area::get_count()<<endl;
	return 0;
}
```

---