---
title: Git 仓库瘦身与 LFS 大文件存储
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
headimg:
date: 2021-12-26 16:26:23
tags: Git
categories: Git
keywords: "Git Big Repository & Git LFS"
---

熟悉 Git 的小伙伴应该都知道随着 Git 仓库维护的时间越来越久，追踪的文件越来越多，git 存储的 [objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) 数量会极其庞大，每次从远程仓库 git clone 的时候都会墨迹很久。如果我们不小心 `git add` 了一个体积很大的文件，且 `git push` 到了远程仓库，那么我们 `git clone` 的时候也会很慢。

看一下 GitHub 上的 [microsoft/vscode](https://github.com/microsoft/vscode) 仓库，都有 九万多个 commit 了，可想而知 objects 的数量应该很恐怖，尝试 clone 一下（一百多万个 objects）：

![github vscode repo](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/github_vscode.png)

<!-- more -->

![clone vscode repository](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/clone_vscode.png)

这里微微记录下 Git 仓库瘦身和使用 Git LFS 进行大文件存储管理的几个常规操作。

## Git 仓库瘦身

> 瘦身背景：错误把大文件 push 到了远程仓库

我们可以通过以下命令或者 `du -mh` 查看 Git 仓库的体积，[git-count-objects](https://www.git-scm.com/docs/git-count-objects)：

```shell
# 查看仓库体积情况
git count-objects -vH
```

示例：可以看到当前仓库体积只有 12.00 KiB 左右

![demo git repository](https://cdn.jsdelivr.net/gh/yeshan333/blog_images@main/git_repo.png)

现在我们模拟错误的将大文件上传到远程 Git 仓库的动作：

```shell
# 1、生成一个 90MB 大小的文件，Github 做了限制超过 100 MB 大小的文件建议使用 LFS，直接拒绝 push
➜ dd if=/dev/zero of=bigfile bs=90MB count=1
# 2、将这个文件 push 到远程仓库
➜ git add bigfile
➜ git commit -m "add 90MB bigfile"
➜ git push origin master
Enumerating objects: 4, done.
Counting objects: 100% (4/4), done.
Delta compression using up to 16 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 85.71 KiB | 306.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0)
remote: warning: See http://git.io/iEPt8g for more information.
remote: warning: File bigfile is 85.83 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB
remote: warning: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
To github.com:yeshan333/git-lfs-prune-repo.git
   e3baf1a..f057313  master -> master
```

好，接下来我们假装这个仓库有很多文件，不知道具体是那个文件让 Git 仓库的体积突然变大，导致 clone 很慢🤣。**就算知道了是哪里个文件造成的，我们直接删除那个文件是没有用的，我们还需要删除那个文件对应的 Git Object 文件**。

接下来我们可以通过一下命令将本地 clone 的仓库历史提交过的体积较大的前 5 个文件名与对应的 Object 文件的 ID 罗列出来：

```shell
git rev-list --objects --all | grep "$(git verify-pack -v .git/objects/pack/*.idx | sort -k 3 -n | tail -5 | awk '{print$1}')"
```

然后我们删除历史提交过的大文件 bigfile，从日志中我们可以看到本地仓库已经移除大文件成功了

```shell
➜ git filter-branch --force --index-filter 'git rm -rf --cached --ignore-unmatch bigfile' --prune-empty --tag-name-filter cat -- --all
WARNING: git-filter-branch has a glut of gotchas generating mangled history
         rewrites.  Hit Ctrl-C before proceeding to abort, then use an
         alternative filtering tool such as 'git filter-repo'
         (https://github.com/newren/git-filter-repo/) instead.  See the
         filter-branch manual page for more details; to squelch this warning,
         set FILTER_BRANCH_SQUELCH_WARNING=1.
Proceeding with filter-branch...

Rewrite e3baf1ac709ae54b60afac9038adcf26fd086748 (1/1) (0 seconds passed, remaining 0 predicted)
WARNING: Ref 'refs/heads/master' is unchanged
WARNING: Ref 'refs/remotes/origin/master' is unchanged
WARNING: Ref 'refs/remotes/origin/main' is unchanged
WARNING: Ref 'refs/remotes/origin/master' is unchanged
```

接下来我们使用 reflog 和 gc 压缩（清理和回收大文件占用的 objects 空间）看看瘦身效果，最后将变动推送到远程仓库即可：

```shell
➜ git reflog expire --expire=now --all && git gc --prune=now --aggressive

➜ git count-objects -vH

➜ git push --mirror
Total 0 (delta 0), reused 0 (delta 0)
To github.com:yeshan333/git-lfs-prune-repo.git
 - [deleted]         main
 + f057313...e3baf1a master -> master (forced update)
 * [new branch]      origin/HEAD -> origin/HEAD
 * [new branch]      origin/main -> origin/main
 * [new branch]      origin/master -> origin/master
```

> [What's the difference between git clone --mirror and git clone --bare](https://stackoverflow.com/questions/3959924/whats-the-difference-between-git-clone-mirror-and-git-clone-bare)

## Git LFS 大文件存储

如果我们之前生成的大文件 bigfile 大小超过 100 MB，那么 push 到 Github 的时候，会抛出个 error 错误，并会有条建议使用 LFS (Large File Storage)：https://git-lfs.github.com/ 管理这个大文件：

```shell
➜ git push origin main
Enumerating objects: 4, done.
Counting objects: 100% (4/4), done.
Delta compression using up to 16 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 1.85 MiB | 752.00 KiB/s, done.
Total 3 (delta 0), reused 1 (delta 0)
remote: error: Trace: 993cb74d30fdb2342e7243f5a7002c1892d00d3a216b80e64b43ef7e4382b947
remote: error: See http://git.io/iEPt8g for more information.
remote: error: File bigfile is 1907.35 MB; this exceeds GitHub's file size limit of 100.00 MB
remote: error: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
To github.com:yeshan333/git-lfs-prune-repo.git
 ! [remote rejected] main -> main (pre-receive hook declined)
error: failed to push some refs to 'git@github.com:yeshan333/git-lfs-prune-repo.git'
```

```shell
# 仓库初始化 LFS
➜ git lfs install
Updated git hooks.
Git LFS initialized.
# 创建大文件
➜ dd if=/dev/zero of=bigfile200 bs=200MB count=1
1+0 records in
1+0 records out
200000000 bytes (200 MB, 191 MiB) copied, 0.176594 s, 1.1 GB/s
# 指定 LFS 追踪大文件
➜ git lfs track "bigfile200"
Tracking "“bigfile200”"
# 被追踪的文件会记录再 .gitattributes 文件中我们将 .gitattributes 文件 push 到远程仓库即可
➜ cat .gitattributes
"bigfile200" filter=lfs diff=lfs merge=lfs -text
➜ git add .gitattributes
➜ git commit -m "add .gitattributes"
➜ git push

# 提交大文件
➜ git add bigfile200
➜ git commit -m "bigfile 200MB"
[master 84fb90b] bigfile 200MB
 1 file changed, 3 insertions(+)
 create mode 100644 bigfile200
➜ git push
Uploading LFS objects: 100% (1/1), 200 MB | 3.7 MB/s, done.
Enumerating objects: 4, done.
Counting objects: 100% (4/4), done.
Delta compression using up to 16 threads
Compressing objects: 100% (3/3), done.
Writing objects: 100% (3/3), 423 bytes | 423.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0)
To github.com:yeshan333/git-lfs-prune-repo.git
   aef9a0b..84fb90b  master -> master
```

> 开启了 LFS 之后，对应大文件的内容存储在 LFS 服务器中，不再是存储在 Git 仓库中，Git 仓库中存储的是大文件的指针文件，LFS 的指针文件是一个文本文件。

Done?

## 参考

- [Push Mirroring-Gitlab](https://docs.gitlab.com/ee/user/project/repository/mirror/push.html)
- [git 瘦身 | Palance's Blog](http://palanceli.com/2017/12/18/2017/1218GitReduceSize/)
- [详解 Git 大文件存储（Git LFS）](https://zhuanlan.zhihu.com/p/146683392)
