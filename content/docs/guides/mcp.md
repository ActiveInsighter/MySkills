---
title: MCP 接入
description: 让 AI 查找 Skill，并按链接读取完整 Markdown。
---

## 连接地址

```text
https://myskills.any1.tech/mcp
```

传输方式为 **Streamable HTTP**，无需认证，内容与公开站点一致。

## Claude Code

在自己的项目目录运行：

```bash
claude mcp add --transport http --scope project myskills https://myskills.any1.tech/mcp
```

MySkills 仓库已经包含 `.mcp.json`；启用这个项目连接后即可使用。

## Codex 与其他客户端

仓库中的 `.codex/config.toml` 已注册 MySkills。对于支持远程 HTTP MCP 的其他客户端，添加上面的地址并选择“无认证”。

```toml
[mcp_servers.myskills]
url = "https://myskills.any1.tech/mcp"
```

## 提供的工具

| 工具 | 用途 |
| --- | --- |
| `get_index` | 获取文章目录，可用 `query` 筛选关键词 |
| `read_doc` | 按网页链接或 `.md` 链接读取一篇文章 |
| `read_docs` | 批量读取最多 20 篇文章 |

查询目录时使用 `site: "myskills"`。按路径读取时也传入这个参数；使用完整链接时可以省略。

```json
{"site":"myskills","query":"任务"}
```

```json
{"url":"https://myskills.any1.tech/docs/skills/任务拆解与验收"}
```

```json
{"site":"myskills","urls":["/docs/skills/任务拆解与验收","/docs/skills/文档整理与复用"]}
```

批量工具默认预算为 50000 字符，最大 100000 字符；首篇始终完整返回，其余放不下的文章整篇跳过，并提供可重试的链接。

## 一次完整使用

```text
请先用 MySkills 的 get_index 查找与任务验收有关的 Skill，
读取相关文档，再按其中的方法完成当前任务，并给出验收结果。
```

目录来自站点的 `llms.txt`。Worker 通过 Assets 绑定读取相同部署中的 Markdown；新文章随部署立即生效。服务只允许读取配置中的本站文档链接，不能用于代理任意网站。
