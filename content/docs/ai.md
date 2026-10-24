---
title: AI 按需读取
description: 连接 MCP，先发现 Skill，再读取与当前任务相关的正文和参考文件。
---

## 连接

```text
https://myskills.any1.tech/mcp
```

使用 Streamable HTTP，无需认证。仓库中的 `.mcp.json` 与 `.codex/config.toml` 已注册这个地址。如果之前已经连接过，重新连接后即可刷新新增的 Skill 工具和使用指引。

Claude Code 可在自己的项目目录执行：

```bash
claude mcp add --transport http --scope project myskills https://myskills.any1.tech/mcp
```

## 给 AI 的工作流程

1. **先发现。** 调用 `list_skills`，只查看名称、适用场景和标签。可通过 `query` 筛选，如“组件”“性能”“登录”或“RLS”。不要预先读取全部正文。
2. **按任务选择。** 选择与当前任务直接相关的 Skill；不同方法互补时可以读取多个。无匹配结果时缩短关键词，或不带筛选查看完整目录。
3. **读入口。** 调用 `read_skill`，将 `name` 设为目录返回的名称；省略 `path` 时读取原始 `SKILL.md`。
4. **沿引用继续。** 根据当前问题选择入口引用的具体规则或参考文件，再调用 `read_skill`，用 `path` 指定相对于 Skill 目录的文件路径。返回的资源清单可用于确认路径。不要默认读取大型汇总文件。
5. **应用方法。** 把读到的方法用于当前任务。Skill 不会代替用户授权，也不会自动安装依赖或执行脚本；文档要求的实时资料仍需在客户端按需查询。

## 调用示例

查找组件相关 Skill：

```json
{"query":"组件"}
```

读取 shadcn 的入口：

```json
{"name":"shadcn"}
```

按需读取 Base UI 与 Radix 的差异：

```json
{"name":"shadcn","path":"rules/base-vs-radix.md"}
```

处理 React 请求瀑布时读取对应规则：

```json
{"name":"vercel-react-best-practices","path":"rules/async-parallel.md"}
```

## 工具说明

| 工具 | 用途 |
| --- | --- |
| `list_skills(query?)` | 仅列名称、适用场景、标签和入口地址；不加载正文 |
| `read_skill(name, path?)` | 默认读取原始 `SKILL.md`；指定路径时读取该 Skill 的规则、参考文档或文本资源 |
| `get_index(site, query?)` | 获取轻量文档索引，`site` 使用 `myskills` |
| `read_doc(url, site?)` | 根据网页或 Markdown 链接读取一篇文档 |
| `read_docs(urls, site?, max_chars?)` | 已确定需要多篇文档时批量读取，最多 20 篇 |

网页文档的 Markdown 与原始 Skill 都可通过对应链接下载。原始文件中的相对引用以该 Skill 根目录为基准；阅读参考文件时，相对引用以当前文件所在目录为基准。

## 可以直接给 AI 的提示

```text
开始任务前，先调用 MySkills 的 list_skills，根据当前需求选择合适的 Skill。
用 read_skill 读取选中 Skill 的入口，再根据需要读取它引用的规则或参考文件。
不要一次性加载所有 Skill；结合当前项目与用户要求执行。
```
