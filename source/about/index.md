---
title: About
date: 2018-09-20 13:37:03
declare: true
comments: true
toc: false
music:
  enable: true      # true（文章内和文章列表都显示） internal（只在文章内显示）
  server: netease   # netease（网易云音乐）tencent（QQ音乐） xiami（虾米） kugou（酷狗）
  type: playlist    # song （单曲） album （专辑） playlist （歌单） search （搜索）
  id: 2506295921    # 歌曲/专辑/歌单 ID
---

- 小 target 🚩：一个月至少一篇文章📌
- 聊一聊我是谁
  - 在校 kubi 大四学生，专业：「信息与计算科学」
  - 业余前端开发、不怎么业余研究后端开发『啥也不是🤨』
  - 目前在关注研究 Cloud Native、DevOps
  - Pythonista、Rustacean、Gopher

## 关于博客

博客的搭建和维护学了许多花里胡哨的东西😂，主要用来写写自己想写的东西（虽然现在大多是技术文章），emmm。。。有些话想到再说。

{% timeline %}

{% timenode 2018-09-19 博客诞生 %}
- 1、其实具体日子我也不记得了，当初不熟悉 Git，Commit History 被我摧毁了很多次，难以追溯具体日期🤣🤦‍♂️
- 2、基于 [Hexo](https://hexo.io/zh-cn/docs/index.html) 搭建的静态博客，最初使用的博客主题为 [yilia](https://github.com/litten/hexo-theme-yilia)，使用 [Github Pages](https://help.github.com/cn#github-pages-basics) 托管
- 3、也曾玩过 [WordPress](https://wordpress.org/support/)、[Typecho](https://github.com/typecho/typecho)（曾剁手买了个主题-[handsome](https://www.ihewro.com/archives/489/)）
- 4、现在博客使用的 Hexo 博客主题是 [xaoxuxu](https://xaoxuu.com/blog/) 大佬写的 [volantis](https://github.com/volantis-x/hexo-theme-volantis/tree/4.3.1)，曾经叫 Material-x 就开始用了
{% endtimenode %}

{% timenode 2018-09-29 使用顶级域名 [shansan.top](https://shansan.top)，CNAME 解析到 GitHub Pages %}
{% endtimenode %}

{% timenode 2018-12-24 启用备用域名 [shan333.cn](https://shan333.cn) %}
将博客部署到腾讯云 CVM 服务器；Web 服务器使用到了 Nginx；使用宝塔面板进行 Ops；通过 Linux 定时任务同步博客到云服务器
{% endtimenode %}

{% timenode 2020-01-30 引入 GitHub Actions %}

使用 [GitHub Actions](https://github.com/features/actions) 持续集成/部署 Hexo 博客到 GitHub Pages [“workflow.yml🔗”](https://github.com/yeshan333/actions-for-hexo-blog/blob/main/.github/workflows/hexo-ci.yaml)，放弃云盘单独备份，使用 Git 做版本控制（回忆）

{% endtimenode %}

{% timenode 2020-03-11 Hexo 主题升级 %}
主题升级至[volantis@2.0.2](https://volantis.js.org/)(原material-x主题改名了)，紧跟dalao更新步伐
{% endtimenode %}

{% timenode 2020-04-29 volantis@2.0.2 -> volantis@2.6.5 %}
{% endtimenode %}

{% timenode 2021-01-18 云服务器博客同步引入 CI/CD %}
写了个基于 rsync 协议的 GitHub Action 用于 CD 博客到 CVM 服务器，博文👉[使用 rsync-deploy-action 同步 Hexo 博客到个人服务器](https://shan333.cn/2021/01/19/hexo-blog-synchronization-with-rsync/)
{% endtimenode %}

{% timenode 2021-03-10 volantis@2.6.5 -> volantis@4.3.1，hexo@4.0.0 -> hexo@5.4.0 %}
{% endtimenode %}

{% endtimeline %}

<!-- # 听歌可以戳下面，猛戳，别客气o(*≧▽≦)ツ┏━┓
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=450 src="//music.163.com/outchain/player?type=0&id=2506295921&auto=1&height=430">
</iframe>
-->

![在下真名](https://s2.ax1x.com/2019/07/02/ZJ7KAO.gif)

{% raw %}
<div class="github-card" data-github="yeshan333" data-width="100%" data-height="150" data-theme="default"></div>
<script src="//cdn.jsdelivr.net/github-cards/latest/widget.js"></script>
<!-- Hotjar Tracking Code for shansan.top -->
<script>
  (function(h,o,t,j,a,r){
      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
      h._hjSettings={hjid:2003338,hjsv:6};
      a=o.getElementsByTagName('head')[0];
      r=o.createElement('script');r.async=1;
      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
      a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
{% endraw %}



