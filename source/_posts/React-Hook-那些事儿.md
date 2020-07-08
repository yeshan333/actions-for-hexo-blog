---
title: React Hook 那些事儿
toc: true
comments: true
popular_posts: false
mathjax: true
top: false
date: 2020-07-08 14:33:31
tags: React
categories: React
---

翻了波之前写的文章还有笔记，发现关于前端的文章并不多。巧了，最近没什么好话题可写，做下 React Hook 学习笔记吧（持续更新~~~✨🦚）。

## Effect Hook

### Effect Hook 死循环请求问题

不得不说 Hook 的出现降低了我们在 React 中处理副作用（side effect）的心智负担，通过 useEffect 就可以很好的完成之前需要使用几个生命周期函数配合才能完成的事。由于 Effect Hook 不熟「官方文档没读透」，最近使用 useEffect 出现了异步请求发送了无限次的问题，翻🚗了。我有个组件大概是这么写的：

<!-- more -->

```javascript
import React, { useState, useEffect } from 'react';

import request from 'umi-request';

import logo from './logo.svg';
import './App.css';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    request('https://jsonplaceholder.typicode.com/todos/', {
     method: 'get',
    })
    .then(response => {
      console.log('fetch data');
      setData(response);
    })
    .catch(error => {
      console.log("report error: ", error);
    })
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <ul>
          {data.map(item => {
            return (
            <li key={item.id}>{item.title}</li>
            );
          })}
        </ul>
      </header>
    </div>
  );
}

export default App;
```

效果如下：

{% iframe https://codesandbox.io/embed/nice-sea-zo2c2?fontsize=14&hidenavigation=1&theme=dark 100% 500 %}

{% fancybox %}
![效果](https://s1.ax1x.com/2020/07/08/UZXngK.gif)
{% endfancybox %}

[https://zo2c2.csb.app/](https://zo2c2.csb.app/)，可以很方便的从调试控制台看到，异步请求一直在发，陷入了死循环之中。这是为什么？因为 useEffect 会在组件 Mounting 和 Updating 阶段执行。每次 request 请求成功，我们都会设置一次组件的 state -> data，所以组件会更新，useEffect 会再次执行，循环往复，造成了无限重复请求问题。那么，如何解决这个问题？之前我忽略了 useEffect 第二个参数的存在，使用 useEffect 的第二个参数可以解决这个问题。一般情况下，我们希望组件只在 mounting 阶段异步获取数据，所以，我们可以这么设置 useEffect 的第二个参数，让它具有和 componentDidMount 生命周期函数类似的行为（组件第一次 mount 后执行）：

{% folding red open, React 组件生命周期 %}

![lifecycle](https://s1.ax1x.com/2020/07/08/UZ5T6s.png)

来源：https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/

{% endfolding %}

{% codeblock lang:javascript line_number:true mark:7,12 %}
  useEffect(() => {
    request('https://jsonplaceholder.typicode.com/todos/', {
     method: 'get',
    })
    .then(response => {
      console.log('fetch data');
      setData(response);
    })
    .catch(error => {
      console.log("report error: ", error);
    })
  }, []);
{% endcodeblock %}

我们传递了一个空数组作为 useEffect 的第二个参数，这样就能避免在组件 Updating 阶段执行 useEffect。这个数组成为**依赖数组**。依赖数组为空，表明 useEffect 不会因为某个变量的变化而再次执行。在组件需要根据某个变量变化进行渲染的时候，可以将此变量放到依赖数组中，一旦这个依赖的变量变动，useEffect 就会重新执行。

## 参考

- [精读 useEffect 完全指南](https://juejin.im/post/5c9827745188250ff85afe50)
- [useEffect 完整指南](https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/)
- [useEffect 使用指南](https://zhuanlan.zhihu.com/p/65773322)
- [How to fetch data with React Hooks?](https://www.robinwieruch.de/react-hooks-fetch-data)