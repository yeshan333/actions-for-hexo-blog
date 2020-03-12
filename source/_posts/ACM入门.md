---
title: ACM入门（占个位）
date: 2018-10-02 22:48:28
tags: [CPP, Algorithm]
categories: Algorithm
declare: true
toc: true
updated:
---
# A+B for Input-Output Practice(using C++)

## 1.
|Problem Description|
|:--|
|Your task is to Calculate a + b. Too easy?! Of course! I specially designed the problem for acm beginners. You must have found that some problems have the same titles with this one, yes, all these problems were designed for the same aim|
|Input|
|The input will consist of a series of pairs of integers a and b, separated by a space, one pair of integers per line.|
|Output|
|For each pair of input integers a and b you should output the sum of a and b in one line, and with one line of output for each line in input.|
|Sample Input|
|1 6<br>1 20|
|Sample Output|
|7<br>21|
<!-- more -->
```c++
#include<iostream>
using namespace std;
int main()
{
	int x,y;
	while(cin>>x>>y)
	{
		cout<<x+y<<endl;
	}
	return 0;
}
```
## 2.
|Problem Description|
|:--|
|The first line integer means the number of input integer a and b. Your task is to Calculate a + b.|
|Input|
|Your task is to Calculate a + b. The first line integer means the numbers of pairs of input integers.|
|Output|
|For each pair of input integers a and b you should output the sum of a and b in one line, and with one line of output for each line in input.|
|Sample Input|
|2<br>10 20<br>22 36|
|Sample Output|
|30<br>58|
```c++
#include<iostream>
using namespace std;
int main()
{
	int n,i;
	int a,b;
	cin>>n;
	for(i=0;i<n;i++)
	{
		cin>>a>>b;
		cout<<a+b<<endl;
	}
	return 0;
}
```
## 3.
|Problem Description|
|:--|
|Your task is to Calculate a + b.|
|Input|
|Input contains multiple test cases. Each test case contains a pair of integers a and b, one pair of integers per line. A test case containing 0 0 terminates the input and this test case is not to be processed.|
|Output|
|For each pair of input integers a and b you should output the sum of a and b in one line, and with one line of output for each line in input.|
|Sample Input|
|1 5<br>10 20<br>0 0|
|Sample Output|
|6<br>30|
```c++
#include<iostream>
using namespace std;
int main()
{
	int a,b;
	while(cin>>a>>b)
	{
		if(a==0&&b==0)break;
		else
		    cout<<a+b<<endl;
	}
	return 0;
}
```
## 4.
|Problem Description|
|:--|
|Your task is to Calculate the sum of some integers.|
|Input|
|Input contains multiple test cases. Each test case contains a integer N, and then N integers follow in the same line. A test case starting with 0 terminates the input and this test case is not to be processed.|
|Output|
|For each group of input integers you should output their sum in one line, and with one line of output for each line in input.|
|Sample Input|
|4 1 2 3 4<br>5 1 2 3 4 5<br>0|
|Sample Output|
|10<br>15|
```c++
#include<iostream>
using namespace std;
int main()
{
	int n;
	while(cin>>n)
	{
		if(n==0)return 0;
		int x,sum=0;
		while(n--)
		{
			cin>>x;
			sum+=x;
		}
		cout<<sum<<endl;
	}
	return 0;
}
```
## 5.
|Problem Description|
|:--|
|Your task is to calculate the sum of some integers.|
|Input|
|Input contains an integer N in the first line, and then N lines follow. Each line starts with a integer M, and then M integers follow in the same line.|
|Output|
|For each group of input integers you should output their sum in one line, and with one line of output for each line in input.|
|Sample Input|
|2<br>4 1 2 3 4<br>5 1 2 3 4 5|
|Sample Output|
|10<br>15|
```c++
#include<iostream>
using namespace std;
int main()
{
	int N;
	int i;
	int n,x;
	cin>>N;
	for(i=0;i<N;i++)
	{
		int n;
		int x,sum=0;
		cin>>n;
		while(n--)
		{
			cin>>x;
			sum += x;
		}
		cout<<sum<<endl;
	}
	return 0;
}
```
## 6.
|Problem Description|
|:--|
|Your task is to calculate the sum of some integers.|
|Input|
|Input contains multiple test cases, and one case one line. Each case starts with an integer N, and then N integers follow in the same line.|
|Output|
|For each test case you should output the sum of N integers in one line, and with one line of output for each line in input.|
|Sample Input|
|4 1 2 3 4 5<br>5 1 2 3 4 5|
|Sample Output|
|10<br>15|
```c++
#include<iostream>
using namespace std;
int main()
{
	int n;
	int x,sum=0;
	while(cin>>n)
	{
		while(n--)
		{
			cin>>x;
			sum +=x;
		}
		cout<<sum<<endl;
		sum=0;
	}
	return 0;
}
```
## 7.
|Problem Description|
|:--|
|Your task is to Calculate a + b.|
|Input|
|The input will consist of a series of pairs of integers a and b, separated by a space, one pair of integers per line.|
|Output|
|For each pair of input integers a and b you should output the sum of a and b, and followed by a blank line.|
|Sample Input|
|1 5<br>10 20|
|Sample Output|
|6<br><br>30|
```c++
#include<iostream>
using namespace std;
int main()
{
	int x,y;
	while(cin>>x>>y)
	{
		cout<<x+y<<endl;
		cout<<endl;
	}
	return 0;
}
```
## 8.
|Problem Description|
|:--|
|Your task is to calculate the sum of some integers|
|Input|
|Input contains an integer N in the first line, and then N lines follow. Each line starts with a integer M, and then M integers follow in the same line|
|Output|
|For each group of input integers you should output their sum in one line, and you must note that there is a blank line between outputs.|
|Sample Input|
|3<br>4 1 2 3 4<br>5 1 2 3 4 5<br>6 1 2 3 4 5 6|
|Sample Output|
|10<br><br>15<br><br>21|
```c++
#include<iostream>
using namespace std;
int main()
{
	int N;
	int n,x;
	int sum=0;
	cin>>N;
	while(N--)
	{
		cin>>n;
		while(n--)
		{
			cin>>x;
			sum +=x;
		}
		cout<<sum<<endl;
		cout<<endl;
		sum=0;
	}
	return 0;
}
```

---