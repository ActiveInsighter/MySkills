# MySkills

个人 Skill 知识库。使用 Fumadocs、Next.js 静态导出与 Cloudflare Workers Assets。

- 网站：https://myskills.any1.tech
- MCP：https://myskills.any1.tech/mcp（Streamable HTTP，无认证）
- 仓库：https://github.com/ActiveInsighter/MySkills
- 本地目录：`/home/dev/Documents/Project/MySkills`

界面沿用 `fumadocs-study` / `exam-docs` 的 spacious 布局、黑白主题、扁平表面与正文排版。没有数学公式插件或 KaTeX 依赖。

## 开发

```bash
npm ci
npm run dev
```

正文放在 `content/docs/**/*.md`，UTF-8 编码。`meta.json` 控制导航顺序。
首批两篇 Skill 是起步示例，可替换或继续扩展。

## 内容与导出

- `/docs/skills/任务拆解与验收`：文章页面。
- `/docs/skills/任务拆解与验收.md`：完整 Markdown 原文（含 frontmatter）。
- `/api/download?path=...`：UTF-8 Markdown 附件，使用 RFC 5987 中文文件名。
- `/llms.txt`：所有文章的 Markdown 索引；`/llms-full.txt`：全文集合。
- `/skills.json`：结构化文章列表。
- `/api/search`：构建期导出的 ZBSearch 索引，浏览器内搜索中英文。

构建后规范化 Next.js 静态输出中的百分号编码中文路径，避免直接访问中文文章出现 404。
知识库正文统一使用 `.md`，导出与源文件完全一致；不支持将带 JSX 的 MDX 直接作为纯 Markdown 发布。

## MCP

项目内 `.mcp.json` 和 `.codex/config.toml` 已注册远程 MCP。
客户端启用项目配置后可调用：

| 工具 | 参数 | 功能 |
| --- | --- | --- |
| `get_index` | `site: "myskills"`, `query?` | 获取实时索引，按所有关键词过滤 |
| `read_doc` | `url`, `site?` | 按网页或 `.md` 链接读取原文 |
| `read_docs` | `urls`（最多 20）, `site?`, `max_chars?` | 批量读全文，附结构化状态与重试链接 |

路径模式需要 `site`，完整 URL 可省略。批量默认 50000 字符，最大 100000；首篇完整返回，后续放不下的整篇跳过。单文档上限 2 MB，每次请求累计读取最多 8 MB。

MCP 协议与工具行为参考 `../docs-md-mcp`，本站用 `ASSETS.fetch()` 读取当前部署，无外部代理、无内容缓存延迟；只允许配置的 HTTPS origin 和文档路径。输入限制 64 KiB，每 IP 每分钟最多 120 次 MCP 请求。

```bash
claude mcp add --transport http --scope project myskills https://myskills.any1.tech/mcp
```

## 验证与部署

```bash
npm test
npm run cf:types
npm run typecheck
npm run build
npx wrangler deploy --dry-run
npx wrangler deploy
npm run e2e
npm run verify:browser
```

Worker 名称 `myskills`，Assets 绑定 `ASSETS`，静态目录 `out`。自定义域名在 `wrangler.jsonc` 管理。网页直接由 Assets 提供，仅 `/mcp` 与 `/api/download` 先经过 Worker。

GitHub Actions 对每次 PR / main 推送运行测试、类型检查与构建。为仓库配置 `CLOUDFLARE_API_TOKEN`（Workers Scripts 写权限，域名绑定需要 Workers Routes 与 Zone 读取权限）及 `CLOUDFLARE_ACCOUNT_ID` 后，main 自动部署并运行线上 MCP 验证。缺少凭据时 CI 明确跳过远程部署，本机可使用已登录的 Wrangler 发布。
