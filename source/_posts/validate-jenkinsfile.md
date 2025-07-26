---
title: 使用 vscode 插件 vscode-jenkins-pipeline-linter-connector 和 LLMs 大模型校验你的 Jenkinsfile
toc: true
comments: true
popular_posts: false
mathjax: true
pin: false
keywords: "Jenkins, LLMs, langchain, vscode plugin, vscode-jenkins-pipeline-linter-connector"
music:
  enable: false
  server: netease
  type: song
  id: 26664345
cover: https://telegraph.shansan.top/file/594ad9640f5732ee8263d.png
description: "使用 vscode 插件 vscode-jenkins-pipeline-linter-connector 和 LLMs 校验你的 Jenkinsfile"
date: 2024-05-25 17:05:12
tags: ["Jenkins", "Cloudflare", "Workers AI", "Langchain", "LLMs"]
categories: Jenkins
---

[Jenkins](https://www.jenkins.io/) 一直以来都是比较热门的用来做 CI/CD 的自动化工具, 如果你使用过 GitHub Action, 和它类似, 现在大多数的自动化工具都会提供 DSL（领域特定语言）去描述 & 编排自动化工作流, Jenkins 的 [Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/) 就是 Jenkins 提供的编排语言, 对应的编排文件一般称之为 Jenkinsfile, 语法规则和 Groovy 很类似. 

我平常使用 Declarative Pipeline Syntax 比较多, Jenkinsfile 的管理一般都会使用一个 Git 仓库. 在本地编辑完成之后一直比较头疼的是语法的校验, 经常需要代码提交之后实际去跑 Pipeline 才能确认有没有语法问题. 

其实这个语法校验在 Jenkins 的 UI 上配置是自带的, 但总不能每次在代码编辑器编辑之后再拷贝上去吧, Jenkins 的官方文档也有建议本地开发 Pipeline 的使用可以使用什么工具链 [pipeline-development-tools](https://www.jenkins.io/doc/book/pipeline/development/#pipeline-development-tools). 可以使用命令行工具、Jenkins Open API、IDE 插件等可以去使用. 

日常使用 Visual Studio Code 比较多, 所以最终选择了 vscode 的插件 `vscode-jenkins-pipeline-linter-connector`, 这个插件原理实现上还是通过将 Jenkinsfile 的内容通过 API 提交给 Jenkins 去校验的.

不过插件已经年久失修了, 代码比较久了, 实际的使用上遇到了不少的问题, 例如: 

- Jenkinsfile 带有中文的话校验结果显示容易乱码, 比如这个 Jenkinsfile:

```groovy
pipeline {
    agent any

    stages {
        stage('Hello中文>>>>>') {
            steps {
                echo 'Hello Worl中文
            }
        }
    }
}
```

校验结果返回会有段乱码, 如下: 

```shell
Errors encountered validating Jenkinsfile:
WorkflowScript: 6: unexpected char: 0xB8 @ line 6, column 36.
                   echo 'Hello World'ä¸­æ��
```

插件实现依赖的基础库也比较老了, 所以我 fork 了一下原来插件, 做了下代码重构和部分问题的修复 & 优化工作, 主要如下: 

- 修复 Jenkinsfile 中文乱码问题.
- 可以在不保存 Jenkinsfile 的时候直接进行校验.
- 文件保存的时候立即自动触发校验.
- 支持控制什么样的文件名可以进行校验, 相当于一个白名单机制, 可能会有些人会将工作流定义写在另外的文件名下, 比如: `workflows.jenkins` 等, 所以才有了这个特性.
- 引入 `langchain.js` 和 Cloudflare 免费的 [Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) 配置大模型做 Review.
- ...

插件现在已经同步发布到了 Visual Studio Code 商店和 Open VSX Registry 中, 理论上你可以在 [Microsoft Visual Studio Code](https://code.visualstudio.com/)、[code-server](https://github.com/coder/code-server)、[VSCodium](https://vscodium.com/) 等 vscode 系列 IDE 中使用到它, 链接如下:

- Microsoft Visual Studio Marketplace: [https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork](https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork)
- Open VSX Registry: [https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork](https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork)

现在你应该能在插件搜索里搜索到它, 使用 `yeshan333.jenkins-pipeline-linter-connector-fork` 去搜索安装即可:

![search extendsion](https://telegraph.shansan.top/file/ca35ab00c512683aff15a.png)

## 配置插件

插件的文档里已经给出了几个示例配置, 将配置填入你的 vscode 用户配置 json 文件中即可:

![settings](https://telegraph.shansan.top/file/09b95699e28b2bafe3149.png)

```json
{
    "jenkins.pipeline.linter.connector.url": "https://jenkins.shan333.cn/pipeline-model-converter/validate",
    "jenkins.pipeline.linter.connector.user": "jenkins_username",
    "jenkins.pipeline.linter.connector.pass": "jenkins_password"
}
```

将 url、用户密码替换成你自己的 Jenkins 即可. 当然你也可以在插件配置处直接进行配置:

![settings](https://telegraph.shansan.top/file/0ddecbae6772b5d22432b.png)

配置完成之后直接通过命令面板 (Command Pallette) 使用 `Validate Jenkins` 即可开启 Jenkinsfile 校验: 

![https://github.com/yeshan333/vscode-jenkins-pipeline-linter-connector/raw/master/images/example_with_syntax_error.gif](https://github.com/yeshan333/vscode-jenkins-pipeline-linter-connector/raw/master/images/example_with_syntax_error.gif)

接下来介绍如何使用 LLM 去帮你评审 Jenkinsfile. 

### 使用 LLM 大模型评审你的 Jenkinsfile

这一功能默认是关闭的, 需要通过配置 `jenkins.pipeline.linter.connector.llm.enable` 去开启, 

功能开启之后我们还需要几个填写几个关键配置, 如下: 

```json
{
    "jenkins.pipeline.linter.connector.llm.enable": true,
    "jenkins.pipeline.linter.connector.llm.baseUrl": "https://api.cloudflare.com/client/v4/accounts/<CF_ACCOUNT_ID>/ai/v1",
    "jenkins.pipeline.linter.connector.llm.modelName": "@cf/meta/llama-2-7b-chat-fp16",
    "jenkins.pipeline.linter.connector.llm.apiKey": "<CF_API_TOKEN>",
}
```

其中 `baseUrl` 和 `apiKey` 需要我们到 Cloudflare 用户管理后台申请. 

插件默认会使用 Cloudflare Workers AI REST API 提供的文本生成模型去评审 review 我们的 Jenkinsfile, 目前它提供免费额度基本够日常使用. 

**Step 1**: 你需要先按照 Cloudflare 提供的文档去获取 API 访问的密钥 -> [Get started with the Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/), 将获取到的 API Token 填入配置 `"jenkins.pipeline.linter.connector.llm.apiKey"` 中. 

![GET API Token and ACCOUND_ID](https://telegraph.shansan.top/file/3856642f14eb9c17411bc.png)

**Step 2**: 在上一步, 你在申请的时候也会拿到一个 Account ID, 这个 ACCOUNT ID 用于组装配置 `"jenkins.pipeline.linter.connector.llm.baseUrl"`, 将 `"https://api.cloudflare.com/client/v4/accounts/<CF_ACCOUNT_ID>/ai/v1"` 的 `<CF_ACCOUNT_ID>` 替换为你的 Account ID 即可

配置 `jenkins.pipeline.linter.connector.llm.modelName` 是可选地, 你可以选用 [https://developers.cloudflare.com/workers-ai/models/#text-generation](https://developers.cloudflare.com/workers-ai/models/#text-generation) 提到的任意一个文本生成模型去做评审. 

将上述配置配置完成之后, 通过 vscode 命令面板 (Command Pallette) 使用 `Validate Jenkins` 开启 Jenkinsfile 校验的同时也会同时向大模型询问评审意见, 大致效果如下: 

![review with LLMs](https://telegraph.shansan.top/file/9052330caafc891b5e282.png)
