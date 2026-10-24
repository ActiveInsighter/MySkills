# MySkills

两个 Fumadocs 项目相关的 10 个共用 Skill，供自己查阅与 AI 按需读取。

- 网站：https://myskills.any1.tech
- MCP：https://myskills.any1.tech/mcp（Streamable HTTP，无认证）
- 仓库：https://github.com/ActiveInsighter/MySkills
- 项目目录：`/home/dev/Documents/Project/MySkills`

Fumadocs spacious 布局、主题与排版沿用 `fumadocs-study` / `exam-docs`，未配置数学公式插件。初始演示文章已移除。

## Skill 来源与维护

`skills/` 保存从本机共用 Skill 目录迁入的完整快照。保留原始 `SKILL.md`、规则、参考文件、脚本、资源及源目录中已有的许可证；同步时不执行 Skill 内的脚本。

| 名称 | 用途 |
| --- | --- |
| frontend-design | 前端视觉设计 |
| shadcn | shadcn / Base UI 组件 |
| design-system-patterns | 设计 Token、主题与组件架构 |
| tailwind-design-system | Tailwind CSS v4 设计系统 |
| vercel-composition-patterns | React 组件组合 |
| vercel-react-best-practices | React / Next.js 性能 |
| web-design-guidelines | 网页体验与无障碍审查 |
| playwright-cli | 浏览器交互验证 |
| supabase | Supabase 开发与排障 |
| supabase-postgres-best-practices | Postgres、SQL、索引与 RLS |

维护 `skills/<name>/` 内的原文件；中文标题、适用场景与标签在 `skills/catalog.json` 中维护。`scripts/sync-skills.mjs` 生成阅读页与原始文件导出，内部相对链接指向对应阅读页或原始资源。

生成的 Skill 阅读页不作为第二份手动维护的源。`content/docs/` 中只保留站点入口、Skill 目录和 AI 接入说明。

## 开发与验证

```bash
npm ci
npm run dev
npm test
npm run cf:types
npm run typecheck
npm run build
npm run e2e
npm run verify:browser
```

- `/docs/skills/shadcn`：Skill 阅读页。
- `/docs/skills/shadcn.md`：阅读页 Markdown，保留中文标题和入口说明。
- `/skill-files/shadcn/SKILL.md`：未经改写的原始 Skill。
- `/skill-files/shadcn/rules/base-vs-radix.md`：原始规则文件。
- `/api/download?path=...`：UTF-8 Markdown 下载，支持中文文件名。
- `/skills.json`：仅名称、说明、标签、入口等轻量 Skill 元数据。
- `/documents.json`：全部阅读页清单。
- `/llms.txt`：入口索引和 AI 使用步骤，不展开所有参考文档。
- `/api/search`：构建期导出的 ZBSearch 索引，支持中英文浏览器内搜索。

静态导出规范化中文路径；Skill 原始文件保持 UTF-8 和原始字节。

## MCP：逐步发现、按需读取

项目内 `.mcp.json` 和 `.codex/config.toml` 已注册远程地址。
MCP 初始化响应的 `instructions`、工具描述和网站 [AI 按需读取](https://myskills.any1.tech/docs/ai) 共同说明流程：

1. `list_skills({query?})`：只读名称、适用场景和标签，按当前任务选择；没有匹配时缩短关键词或查看完整目录。
2. `read_skill({name})`：读取选中的原始 `SKILL.md`，同时获得可用资源路径。
3. `read_skill({name, path})`：沿入口引用，只读取当前任务需要的规则、参考文档或文本资源。脚本仅返回源码，不执行。

例如：

```json
{"name":"shadcn","path":"rules/base-vs-radix.md"}
```

原有 `get_index` / `read_doc` / `read_docs` 保留，可按网页或 Markdown 链接读取。路径模式使用 `site: "myskills"`。批量最多 20 篇，默认预算 50000 字符，最大 100000；首篇完整返回，后续超预算文档整篇跳过并附重试状态。

Worker 通过 `ASSETS` 读取同一部署中的文件，仅允许本站文档路径或清单中明确列出的 Skill 文件。单文件上限 2 MB，每次请求累计最多 8 MB，输入最多 64 KiB；每 IP 每分钟最多 120 次 MCP 请求。二进制资源返回链接指引，不作为文本解码。

## 部署

Worker 为 `myskills`，自定义域名 `myskills.any1.tech`，Assets 目录 `out`。网页由静态 Assets 提供；`/mcp` 与 `/api/download` 经过 Worker。

GitHub Actions 在 `main` 推送后执行测试、类型检查、静态构建、部署与线上 MCP 验证。仓库已经配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。本机发布可运行 `npm run deploy`。
