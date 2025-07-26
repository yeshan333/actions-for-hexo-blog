---
title: 对下载软件/文件进行校验的工具（Checksum and GPG）
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
cover: https://z3.ax1x.com/2021/07/11/W9bniR.png
date: 2021-07-10 18:23:57
tags: [MD5, GPG]
categories: Cryptography
references:
  - title: GnuPG
    url: https://gnupg.org/
  - title: What is Ownertrust? Trust-levels explained
    url: https://gpgtools.tenderapp.com/kb/faq/what-is-ownertrust-trust-levels-explained
  - title: 开源软件源码编译指南
    url: https://www.kawabangga.com/posts/4373
  - title: Validating other keys on your public keyring
    url: https://www.gnupg.org/gph/en/manual/x334.html
  - title: commit signature verification - GitHub
    url: https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification/about-commit-signature-verification
keywords: "gpg, md5, checksums"
---

## 前言

之前装软件一直都没有验证安装文件的习惯，信息安全意识不高，碰巧最近没啥事，微微写篇文章记录下校验工具（互联网http、https、ftp 服务并没有那么安全，是可以被劫持篡改。老装软件选手了，是该养成个校验文件的习惯了）。

在互联网下载软件/文件的时候经常会看到官方提供了一段⌈校验和（checksum）⌋或包含校验和的文件供校验。常见的校验和有 md5、SHA 家族等。还有部分软件/文件会提供 GPG 校验文件（signature file, SIG）给下载者进行校验。

来看看这两种校验方式相关的工具。

<!-- more -->

## 校验和校验工具

> [校验和](https://zh.wikipedia.org/wiki/%E6%A0%A1%E9%AA%8C%E5%92%8C)（英语：Checksum）是冗余校验的一种形式。 它是通过错误检测方法，对经过空间（如通信）或时间（如计算机存储）所传送数据的完整性进行检查的一种简单方法。 -来自维基百科

### Windows CertUtil

CertUtil 是 Windows 自带的文件校验和计算程序，我们可以通过它计算下载的软件/文件的 checksum 与官方提供的 checksum 作对比。

在 PowerShell 或 CMD 中可以执行 `CertUtil -?` 命令查看 CertUtil 支持的参数。CertUtil 的计算文件校验和命令的一般形式为

```shell
CertUtil -hashfile <path to file> <hash algorithm>
```

CertUtil 支持的校验和计算的哈希算法有 MD2 MD4 MD5 SHA1 SHA256 SHA384 SHA512 等。

```text
Usage:
  CertUtil [Options] -hashfile InFile [HashAlgorithm]
  Generate and display cryptographic hash over a file

Options:
  -Unicode          -- Write redirected output in Unicode
  -gmt              -- Display times as GMT
  -seconds          -- Display times with seconds and milliseconds
  -v                -- Verbose operation
  -privatekey       -- Display password and private key data
  -pin PIN                  -- Smart Card PIN
  -sid WELL_KNOWN_SID_TYPE  -- Numeric SID
            22 -- Local System
            23 -- Local Service
            24 -- Network Service

Hash algorithms: MD2 MD4 MD5 SHA1 SHA256 SHA384 SHA512
```

让我们看个例子，就装个 Go 吧（嘿嘿，最近在装系统，什么软件都没了），直接官方（[https://golang.org/dl/](https://golang.org/dl/)）下载 Go 的安装程序，下载页面给出了 SHA256 Checksum。

{% gallery %}
![Go 下载页](https://z3.ax1x.com/2021/07/10/WpK4aQ.png)
{% endgallery %}

使用 Certutil 计算 go1.16.5.windows-amd64.msi 安装程序的校验和。

```shell
CertUtil -hashfile go1.16.5.windows-amd64.msi SHA256
```

{% gallery %}
![CertUtil 计算结果](https://z3.ax1x.com/2021/07/10/WpMUWn.png)
{% endgallery %}

CertUtil 计算结果（322dd8c585f37b62c9e603c84747b97a7a65b56fcef56b64e3021ccad90785b2）和下载页提供的校验和（322dd8c585f37b62c9e603c84747b97a7a65b56fcef56b64e3021ccad90785b2）比对，emmm，没毛病，微微放心安装了。

文档：[microsoft windows-commands certutil](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/certutil)

### Linux md5sum

md5sum 是大多数 Linux 系统都预装的校验 128 位 MD5 哈希值，用于检查文件完整性的校验和工具。

命令的一般形式如下，使用 `md5sum --help` 查看更多操作：

```shell
md5sum <file-path or files-path>
```

输出格式一般示例如下（校验和 + 文件名）

{% gallery %}
![md5sum 计算校验和](https://z3.ax1x.com/2021/07/10/Wpa4XQ.png)
{% endgallery %}

部分软件下载时会拿到一个类似如下内容格式的 checksum 文件，姑且命名为 demo_hash.md5

```md5
f4e81ade7d6f9fb342541152d08e7a97  .profile
0f077c02d1303b89b9c5cb92e5d7d112  .bashrc
```

那么使用 md5sum 进行校验时可以这么操作，md5sum 会自动根据 demo_hash.md5 里面的文件逐个检查 md5：

```shell
$ md5sum -c demo_hash.md5 # 加个 `-c` 参数
.profile: OK
.bashrc: OK
```

文档：[md5sum-invocation](https://www.gnu.org/software/coreutils/manual/html_node/md5sum-invocation.html#md5sum-invocation)

## GPG key 校验工具

> [GPG](https://www.gnupg.org/index.html)（GnuPG）是一个实现了 OpenPGP 标准的用于数据加密和数字签名的工具。

互联网上存在着部分软件/文件通过 GPG 密钥进行签名来证明其来源。GitHub 也有着一种使用 GPG 密钥来检验 Git Commit 来源可靠性的手段，如果可靠，会在前端页面 commit log 历史那里显示一个如下的小绿标：

{% gallery %}
![GitHub commit signature](https://z3.ax1x.com/2021/07/10/Wps4PA.png)
{% endgallery %}

btw，之前微微写过一篇文章 -> [给 GitHub commit 加个小绿标](https://shansan.top/2020/06/26/%E7%BB%99%20GitHub%20commit%20%E5%8A%A0%E4%B8%AA%E5%B0%8F%E7%BB%BF%E6%A0%87/)。

使用 GPG key 进行软件/文件校验的一般步骤如下：

- step 1：获取软件/文件作者的**公钥**（public key），导入到 GPG key 管理器；
- step 2：根据作者的 gpg key **指纹**（fingerprint）验证公钥（public key）的可靠性；
- step 3：根据软件/文件的**签名文件**（signature file，SIG）校验来源是否可靠。

### Gpg4win

Gpg4win 是官方的 Windows GnuPG 发行版，全家桶软件，官网为 [gpg4win.org](https://gpg4win.org/about.html)。通过自带的 GUI 客户端 Kleopatra，我们可以很方便的完成文件的校验。直接官网下载安装即可 -> [Download Page](https://gpg4win.org/get-gpg4win.html)。

{% gallery %}
![Kleopatra](https://z3.ax1x.com/2021/07/11/W9YnX9.png)
{% endgallery %}

这里我们以 Windows 下 Python 3.9.6 的安装为例，看下使用 Kleopatra 进行校验的过程是怎么样的 ⌈以下操作下载的文件均在同一个目录下⌋。

先到官方下载页[release/python-396](https://www.python.org/downloads/release/python-396/)下载 Windows Python 3.9.6 的安装文件和对应的 GPG 密钥签名文件（sig）：

{% gallery %}
![安装文件和签名文件下载](https://z3.ax1x.com/2021/07/10/WpK4aQ.png)
{% endgallery %}

```shell
curl -sSlO https://www.python.org/ftp/python/3.9.6/python-3.9.6-amd64.exe
curl -O https://www.python.org/ftp/python/3.9.6/python-3.9.6-amd64.exe.asc
```

![下载 installer & sig 文件](https://z3.ax1x.com/2021/07/11/W9tKgg.png)

现在开始对着之前所的校验步骤操作一下。

**Step 1**：获取软件/文件作者的**公钥**（public key），导入到 GPG key 管理器；

从 [https://www.python.org/downloads/](https://www.python.org/downloads/) 页面大概四分之三的地方，我们可以看到之前下载的 Windows Banaries 的 release manager 是 Steve Dower，我们根据官网提供的链接获取[公钥](https://keybase.io/stevedower/)。

{% gallery %}
![获取 Steve Dower 公钥](https://z3.ax1x.com/2021/07/11/W9UCmd.png)

![keybase 上的公钥](https://z3.ax1x.com/2021/07/11/W9U738.png)
{% endgallery %}

下载公钥。

```shell
curl -O https://keybase.io/stevedower/pgp_keys.asc
```

使用 Kleopatra 导入下载好的公钥 pgp_keys.asc。

{% gallery %}
![导入公钥](https://z3.ax1x.com/2021/07/11/W9wpXF.png)
{% endgallery %}

**Step 2**：根据作者的 gpg key **指纹**（fingerprint）验证公钥（public key）的可靠性；

{% gallery %}
![验证指纹](https://z3.ax1x.com/2021/07/11/W9w5NR.png)
{% endgallery %}

导入的公钥指纹与提供的指纹一致，一般就无问题了。

**Step 3**：根据软件/文件的**签名文件**（signature file，SIG）校验来源是否可靠。

使用之前下载好的 signature file（python-3.9.6-amd64.exe.asc）进行校验，如下：

{% gallery %}
![SIG 校验](https://z3.ax1x.com/2021/07/11/W9Bb0e.png)
{% endgallery %}

emmm，没问题。Good job！

### GnuPG(GPG)

GnuPG 是之前提到的 Gpg4win 的后端，适合命令行选手。大部分 Linux 系统自带。下面我们在 WSL（Ubuntu-20.04）感受下。

这里我们以对 [GnuPG（LTS） Tarball](https://www.gnupg.org/download/index.html) 的下载校验为例子。

```shell
mkdir gnupg_tarball
cd gnupg_tarball
# 下载 GnuPG（LTS） tarball
curl -O https://www.gnupg.org/ftp/gcrypt/gnupg/gnupg-2.2.29.tar.bz2
# 下载校验文件
curl -O https://www.gnupg.org/ftp/gcrypt/gnupg/gnupg-2.2.29.tar.bz2.sig
```

- Step 1：保存公钥，导入公钥。在 [https://www.gnupg.org/signature_key.html](https://www.gnupg.org/signature_key.html) 拿到作者的 signature key，保存到 gnupg-2.2.29.asc。

{% folding open red, 保存公钥 %}

```shell
➜ cat>gnupg-2.2.29.asc<<EOF
> -----BEGIN PGP PUBLIC KEY BLOCK-----
>
> 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
co7CV2> oDwv5co7CV2OH99yPPRitrECBwAACgkQvO9+KUsJLig2Cgv/T4rXEjHwlbsuTkzp
> tgK80Dh92URzBAhPhSJ0kUz2b6y7FgVYgZ95u8elGUS4lOB0GOQSK3y4sCgldTQF
> GQpMuvNMX6oNQTv1Z/H9H7Sc6AntozKRA6LQC+7DMxjPh2DEhVLYNqi7gMXtuH8o
> Xz5+quarw/xbVmuS4UNqcxakd4A/HW6PayRhuju4+oV2+UmGU0etzGVwKSN/UicC
> 3Re3mUy8SwJFQ9/3EAfiY0SGzSWH1z7bTRg9Ga2ctYDNzUpyQsgLxD6ZRHcONkOo
MEQ9> GUMEQ96BeSsjT4yW9ED70CcCbhg+pMxR+lnpk4BZ4WML/plBjEb8B1YaRvhYWKd3
> OSVB/JsS6J6Q/y9TTsAJDBLAfw9h7RQKibViuVFSNftAuSdktah5mDwFnL0ZMzVS
> 3tDVDa5PDqbHEhK55/5EWBg4eNbAukVZmmoLzzERGXuj+LOIRElG3/n3chy1uM73
> B6da3al4gDDNHifPsuozpkVN1EAROZx1K9hGGDZC3yFQTjsJtCRBbmRyZSBIZWlu
> ZWNrZSAoUmVsZWFzZSBTaWduaW5nIEtleSmJAdQEEwEIAD4WIQRbgMV1Qpjwy1XY
> 7Wq8734pSwkuKAUCWMu6rgIbAwUJEswDAAULCQgHAgYVCAkKCwIEFgIDAQIeAQIX
> gAAKCRC8734pSwkuKEL9DACEIL5IS9wUty62Bnwd9wK2hmwihXNkTLsOOoi8aCdO
> ywPwcIucgAcIO+c/t0lbe4y4sJ1KrKbdyOUQiJAyxobLCSV/MkhIDAmsZB1ZIpF3
> nfmNekRdCVcMpqX8jAwoBS3Q9m2UJz1LeDCLFCvLF0nbyUnqHZP19UOvxmzAyZMA
> Ub3W5y1+GMo4yA+3xSFI8ZbjzhawixCCRs69/4p+zCXR4e7LBf6koAHllD/0ZULp
> SDjF+t2IkvRrMlM+e+Mxjklinr8v1FRGzmE/kCcdHaP88+iwC2wUKOZtFs4yIBLO
> SWdQk9tLPmR8uWgNZmatRJyNvOaxd6EbK3jfckbJGFkmXjH+M9vMqFpoAewZ359F
Us7AX> qjq+Us7AXLAMNUynom7IrtR5Rvsjx6RNtKQYUD6XY5rc7r9js9iGruHDAAW5lyRg
> j3wikc0IbV9L1bTsXIp29BsrU9sXUkVEp+xQJZgwqoOduoSjmOK88QdkibDqJiGF
> dzIRiXx+Nxv1Pr9L7A4/tq+YMwRfQ+WJFgkrBgEEAdpHDwEBB0DPvkeV6RzXomGF
> 8jQwp0RXEt2TGFwwI7RkbpYwECY2l7QfV2VybmVyIEtvY2ggKGRpc3Qgc2lnbmlu
> ZyAyMDIwKYiaBBMWCgBCFiEEbapuZKdtKEBXG0kCUoiXuCZAOtoFAl9D7DUCGwMF
> CRKFxxEFCwkIBwIDIgIBBhUKCQgLAgQWAgMBAh4HAheAAAoJEFKIl7gmQDraea4A
> /24v8c50HSC/Basf4WlREkuzhudplo8iT0BGtTQRdGAmAP9gIZ8dBekg9PRlpe7A
> l7ErThn6owVH9szWrUt6jkKOBg==
> =h7e4
> -----END PGP PUBLIC KEY BLOCK-----
>EOF
```

{% endfolding %}

接下来导入公钥到 gpg。

```shell
➜ cat gnupg-2.2.29.asc | gpg --import
gpg: key 249B39D24F25E3B6: public key "Werner Koch (dist sig)" imported
gpg: key 2071B08A33BD3F06: public key "NIIBE Yutaka (GnuPG Release Key) <gniibe@fsij.org>" imported
gpg: key BCEF7E294B092E28: public key "Andre Heinecke (Release Signing Key)" imported
gpg: key 528897B826403ADA: public key "Werner Koch (dist signing 2020)" imported
gpg: Total number processed: 4
gpg:               imported: 4
```

- Step 2：查看导入的公钥的指纹是否与官网上公布的一致

```shell
➜ gpg --list-keys --keyid-format=long Werner Koch
pub   rsa2048/249B39D24F25E3B6 2011-01-12 [SC] [expires: 2021-12-31]
      D8692123C4065DEA5E0F3AB5249B39D24F25E3B6
uid                 [ unknown] Werner Koch (dist sig)

pub   ed25519/528897B826403ADA 2020-08-24 [SC] [expires: 2030-06-30]
      6DAA6E64A76D2840571B4902528897B826403ADA
uid                 [ unknown] Werner Koch (dist signing 2020)
```

如果一致的话，信任此公钥。

```shell
➜ gpg --edit-key D8692123C4065DEA5E0F3AB5249B39D24F25E3B6
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  rsa2048/249B39D24F25E3B6
     created: 2011-01-12  expires: 2021-12-31  usage: SC
     trust: unknown       validity: unknown
[ unknown] (1). Werner Koch (dist sig)

gpg> sign

pub  rsa2048/249B39D24F25E3B6
     created: 2011-01-12  expires: 2021-12-31  usage: SC
     trust: unknown       validity: unknown
 Primary key fingerprint: D869 2123 C406 5DEA 5E0F  3AB5 249B 39D2 4F25 E3B6

     Werner Koch (dist sig)

This key is due to expire on 2021-12-31.
Are you sure that you want to sign this key with your
key "yeshan333 <1329441308@qq.com>" (582AAB66132A3FDA)

Really sign? (y/N) y

gpg> save
```

这玩意还需要一个指纹 sign  公钥，可通过下面的命令快速操作

```shell
gpg --lsign-key "6DAA6E64A76D2840571B4902528897B826403ADA"
```

> Signing a key tells your software that you trust the key that you have been provided with and that you have verified that it is associated with the person in question.

- Step 3：使用 signature file 校验 Tarball

```shell
➜ gpg --verify gnupg-2.2.29.tar.bz2.sig
gpg: assuming signed data in 'gnupg-2.2.29.tar.bz2'
gpg: Signature made Sun Jul  4 22:54:50 2021 CST
gpg:                using EDDSA key 6DAA6E64A76D2840571B4902528897B826403ADA
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   2  signed:   2  trust: 0-, 0q, 0n, 0m, 0f, 2u
gpg: depth: 1  valid:   2  signed:   0  trust: 2-, 0q, 0n, 0m, 0f, 0u
gpg: next trustdb check due at 2021-12-31
gpg: Good signature from "Werner Koch (dist signing 2020)" [full]
```

emmm，问题不大。这里有一丢丢问号❓[What is the exact meaning of this gpg output regarding trust?](https://security.stackexchange.com/questions/41208/what-is-the-exact-meaning-of-this-gpg-output-regarding-trust)


{% folding, 微微提升下信任水平 %}

```shell
➜ gpg --edit-key 6DAA6E64A76D2840571B4902528897B826403ADA D8692123C4065DEA5E0F3AB5249B39D24F25E3B6
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


pub  ed25519/528897B826403ADA
     created: 2020-08-24  expires: 2030-06-30  usage: SC
     trust: undefined     validity: full
[  full  ] (1). Werner Koch (dist signing 2020)


Invalid command  (try "help")

gpg> trust
pub  ed25519/528897B826403ADA
     created: 2020-08-24  expires: 2030-06-30  usage: SC
     trust: undefined     validity: full
[  full  ] (1). Werner Koch (dist signing 2020)

Please decide how far you trust this user to correctly verify other users' keys
(by looking at passports, checking fingerprints from different sources, etc.)

  1 = I don't know or won't say
  2 = I do NOT trust
  3 = I trust marginally
  4 = I trust fully
  5 = I trust ultimately
  m = back to the main menu

Your decision? 4

pub  ed25519/528897B826403ADA
     created: 2020-08-24  expires: 2030-06-30  usage: SC
     trust: full          validity: full
[  full  ] (1). Werner Koch (dist signing 2020)
Please note that the shown key validity is not necessarily correct
unless you restart the program.

gpg> save
Key not changed so no update needed.

➜ gpg --edit-key D8692123C4065DEA5E0F3AB5249B39D24F25E3B6
gpg (GnuPG) 2.2.19; Copyright (C) 2019 Free Software Foundation, Inc.
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.


gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   2  signed:   2  trust: 0-, 0q, 0n, 0m, 0f, 2u
gpg: depth: 1  valid:   2  signed:   0  trust: 0-, 1q, 0n, 0m, 1f, 0u
gpg: next trustdb check due at 2021-12-31
pub  rsa2048/249B39D24F25E3B6
     created: 2011-01-12  expires: 2021-12-31  usage: SC
     trust: undefined     validity: full
[  full  ] (1). Werner Koch (dist sig)

gpg> trust
pub  rsa2048/249B39D24F25E3B6
     created: 2011-01-12  expires: 2021-12-31  usage: SC
     trust: undefined     validity: full
[  full  ] (1). Werner Koch (dist sig)

Please decide how far you trust this user to correctly verify other users' keys
(by looking at passports, checking fingerprints from different sources, etc.)

  1 = I don't know or won't say
  2 = I do NOT trust
  3 = I trust marginally
  4 = I trust fully
  5 = I trust ultimately
  m = back to the main menu

Your decision? 4

pub  rsa2048/249B39D24F25E3B6
     created: 2011-01-12  expires: 2021-12-31  usage: SC
     trust: full          validity: full
[  full  ] (1). Werner Koch (dist sig)
Please note that the shown key validity is not necessarily correct
unless you restart the program.

gpg> save

➜ gpg --verify gnupg-2.2.29.tar.bz2.sig
gpg: assuming signed data in 'gnupg-2.2.29.tar.bz2'
gpg: Signature made Sun Jul  4 22:54:50 2021 CST
gpg:                using EDDSA key 6DAA6E64A76D2840571B4902528897B826403ADA
gpg: checking the trustdb
gpg: marginals needed: 3  completes needed: 1  trust model: pgp
gpg: depth: 0  valid:   2  signed:   2  trust: 0-, 0q, 0n, 0m, 0f, 2u
gpg: depth: 1  valid:   2  signed:   0  trust: 0-, 0q, 0n, 0m, 2f, 0u
gpg: next trustdb check due at 2021-12-31
gpg: Good signature from "Werner Koch (dist signing 2020)" [full]
```

{% endfolding %}

更多 GPG Key 校验工具查看 GnuPG 主页：https://www.gnupg.org/download/index.html