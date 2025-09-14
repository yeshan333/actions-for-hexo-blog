---
title: Validate your Jenkinsfile with the vscode plugin vscode-jenkins-pipeline-linter-connector and the LLMs large model
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
headimg: https://blog-cloudflare-imgbed.pages.dev/file/594ad9640f5732ee8263d.png
description: "使用 vscode 插件 vscode-jenkins-pipeline-linter-connector 和 LLMs 校验你的 Jenkinsfile"
date: 2024-05-25 17:05:12
tags: ["Jenkins", "Cloudflare", "Workers AI", "Langchain", "LLMs"]
categories: Jenkins
---

[Jenkins](https://www.jenkins.io/) is a popular automation tool for CI/CD, if you have used GitHub Action, similar to it, most automation tools now provide DSL (Domain Specific Language) to describe & orchestrate automation workflows, Jenkins' [Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/) is the orchestration language provided by Jenkins, the corresponding orchestration file is generally called **Jenkinsfile**, syntax rules and Groovy is similar.

I usually use [Declarative Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/#pipeline-1) a lot, and I usually use a Git repository for Jenkinsfile management. After the local editing is completed, the headache is the syntax verification, and it is often necessary to actually run the pipeline after the code is committed to confirm whether there are any syntax problems.


In fact, this syntax check is configured on the Jenkins UI, but it can't be copied every time after editing in the code editor, and the official Jenkins documentation also suggests what toolchain [pipeline-development-tools](https://www.jenkins.io/doc/book/pipeline/development/#pipeline-development-tools) can be used for the use of local development pipelines. You can use command-line tools, Jenkins Open API, IDE plug-ins, etc.

I use Visual Studio Code a lot on a daily basis, so I finally chose the vscode plugin `vscode-jenkins-pipeline-linter-connector`, which is implemented by submitting the content of the Jenkinsfile to Jenkins through the API to verify.

However, the vscode plug-in has fallen into disrepair for a long time, and the code has been in use for a long time, and there are many problems encountered in actual use, such as:

- Jenkinsfile with Chinese verification results are easy to garbled characters, such as this Jenkinsfile:

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

The verification result will return garbled characters, as follows:

```shell
Errors encountered validating Jenkinsfile:
WorkflowScript: 6: unexpected char: 0xB8 @ line 6, column 36.
                   echo 'Hello World'ä¸­æ��
```

The basic library that the plugin implementation depends on is also relatively old, so I forked the original plugin and did the following code refactoring and some problem fixes & optimizations, mainly as follows:

- Fixing the Chinese (or other charset) garbled text issue in Jenkinsfile.
- It can be verified without saving the Jenkinsfile.
- The validation can be automatically triggered immediately when the file is saved.
- Support to control what kind of file name can be verified, which is equivalent to a whitelist mechanism, and some people may write the workflow definition under another file name, such as: workflows.jenkins , etc., so there is this feature.
- langchain.js and Cloudflare's free [Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) to configure large models for Jenkinsfile review.
- ...

The plugin is now available in the Visual Studio Code Store and Open VSX Registry, and you can theoretically use it in [Microsoft Visual Studio Code](https://code.visualstudio.com/), [code-server](https://github.com/coder/code-server), [VSCodium](https://vscodium.com/), and other vscode series IDEs, linked below:

- Microsoft Visual Studio Marketplace: [https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork](https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork)
- Open VSX Registry: [https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork](https://marketplace.visualstudio.com/items?itemName=yeshan333.jenkins-pipeline-linter-connector-fork)

Now you should be able to search for it in the plugin search, use `yeshan333.jenkins-pipeline-linter-connector-fork` to search for installations:

![search extendsion](https://blog-cloudflare-imgbed.pages.dev/file/ca35ab00c512683aff15a.png)

## Configure the plugin

There are a few [example configurations](https://github.com/yeshan333/vscode-jenkins-pipeline-linter-connector#example-settings) already given in the plugin documentation, just fill in your vscode user configuration json file:

![settings](https://blog-cloudflare-imgbed.pages.dev/file/09b95699e28b2bafe3149.png)

```json
{
    "jenkins.pipeline.linter.connector.url": "https://jenkins.shan333.cn/pipeline-model-converter/validate",
    "jenkins.pipeline.linter.connector.user": "jenkins_username",
    "jenkins.pipeline.linter.connector.pass": "jenkins_password"
}
```

Replace the url and user password with your own Jenkins. Of course, you can also configure it directly in the plugin configuration:

![settings](https://blog-cloudflare-imgbed.pages.dev/file/0ddecbae6772b5d22432b.png)

Once configured, you can use `Validate Jenkins` in the Command Pallette to enable the Jenkinsfile validation:

![https://github.com/yeshan333/vscode-jenkins-pipeline-linter-connector/raw/master/images/example_with_syntax_error.gif](https://github.com/yeshan333/vscode-jenkins-pipeline-linter-connector/raw/master/images/example_with_syntax_error.gif)

Let's take a look at how to use LLM to review Jenkinsfiles for you.

### Review your Jenkinsfile with the LLM large model

This function is disabled by default, and needs to be enabled by configuring `jenkins.pipeline.linter.connector.llm.enable`.

After the function is enabled, we still need to fill in a few key configurations, as follows:

```json
{
    "jenkins.pipeline.linter.connector.llm.enable": true,
    "jenkins.pipeline.linter.connector.llm.baseUrl": "https://api.cloudflare.com/client/v4/accounts/<CF_ACCOUNT_ID>/ai/v1",
    "jenkins.pipeline.linter.connector.llm.modelName": "@cf/meta/llama-2-7b-chat-fp16",
    "jenkins.pipeline.linter.connector.llm.apiKey": "<CF_API_TOKEN>",
}
```

`baseUrl` and `apiKey` need to be applied to the Cloudflare User Dashboard.

By default, the plugin uses the text generation model provided by the Cloudflare Workers AI REST API to review our Jenkinsfile, which currently offers a free quota that is basically enough for daily use.

**Step 1**: You need to follow the documentation provided by Cloudflare to obtain the API access key -> [Get started with the Workers AI REST API](https://developers.cloudflare.com/workers-ai/get-started/rest-api/), and fill in the obtained API Token in the configuration `"jenkins.pipeline.linter.connector.llm.apiKey"`.

![GET API Token and ACCOUND_ID](https://blog-cloudflare-imgbed.pages.dev/file/3856642f14eb9c17411bc.png)

**Step 2**: In the previous step, you will also get an Account ID when applying, this ACCOUNT ID is used to assemble the configuration "jenkins.pipeline.linter.connector.llm.baseUrl" , replace the `<CF_ACCOUNT_ID>` of `"https://api.cloudflare.com/client/v4/accounts/<CF_ACCOUNT_ID>/ai/v1"` with your Account ID.

Configuring `jenkins.pipeline.linter.connector.llm.modelName` is optional, and you can use any of the text generation models mentioned in [https://developers.cloudflare.com/workers-ai/models/#text-generation](https://developers.cloudflare.com/workers-ai/models/#text-generation) for review.

After the above configuration is completed, the Jenkinsfile verification will be trigger with `Validate Jenkins` in the vscode Command Pallette, and the review opinions will be asked to the large model at the same time, which will have the following effect:

![review with LLMs](https://blog-cloudflare-imgbed.pages.dev/file/9052330caafc891b5e282.png)
