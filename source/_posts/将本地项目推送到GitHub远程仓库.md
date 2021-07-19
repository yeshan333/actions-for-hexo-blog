---
title: 将本地项目推送到GitHub远程仓库
abstract: 'Welcome to my blog, enter password to read.'
message: 'Welcome to my blog, enter password to read.'
date: 2019-03-08 23:59:28
tags: Git
categories: Git
declare:
toc: true
password:
updated:
keywords: "github, git, remote operation"
---

# 如何将本地项目推送到Github

>Tip：在本地要安装好Git，官网：[https://git-scm.com/](https://git-scm.com/)

![kzni4K.png](https://s2.ax1x.com/2019/03/08/kzni4K.png)


>一个学习Git的好地方：[https://try.github.io/](https://try.github.io/)

>在线闯关实战，边练边学的好地方：[https://learngitbranching.js.org/](https://learngitbranching.js.org/)

## 方法一：使用https推送

```bash
# 步骤
# 1.创建一个目录
mkdir Test
# 2.将当前目录变为git管理仓库
git init
# 3.将文件添加到版本库，这里将目录下的所有文件都添加进去了
git add .
# 4.告诉git将文件提交到仓库
git commit -m "first-commit"
# 5.将当前仓库与远程仓库关联
git remote add origin 远程仓库的https地址 # eg: git remote add https://github.com/ssmath/Test.git
# 6.将仓库内master分支的所有内容推送到远程仓库,这里会使用到Github的账号密码
git push -u origin master
```
<!-- more -->

![kzusFP.png](https://s2.ax1x.com/2019/03/08/kzusFP.png)

![kzugSS.png](https://s2.ax1x.com/2019/03/08/kzugSS.png)

## 方法二：使用ssh推送

1. 生成ssh密钥

```bash
ssh-keygen -t rsa -C "your email address"
# eg: ssh-keygen -t rsa -C "1329441308@qq.com"
```

![kzKcA1.png](https://s2.ax1x.com/2019/03/08/kzKcA1.png)

2. 找到生成的文件，复制id_rsa.pub文件中的内容，文件一般在用户目录下的.ssh目录中

![https://s2.ax1x.com/2019/03/08/kzMw5t.png](https://s2.ax1x.com/2019/03/08/kzMw5t.png)

3. 使用密钥与远程仓库配对，检验能否成功通讯

![https://s2.ax1x.com/2019/03/08/kzMdUI.png](https://s2.ax1x.com/2019/03/08/kzMdUI.png)

    ssh -T git@github.com  # 检验能否成功通讯

![kzMRVs.png](https://s2.ax1x.com/2019/03/08/kzMRVs.png)

4. 推送本地文件到github

![kzlilT.png](https://s2.ax1x.com/2019/03/08/kzlilT.png)
