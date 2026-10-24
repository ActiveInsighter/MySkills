# MySkills

- 项目路径：`/home/dev/Documents/Project/MySkills`。
- 参考项目：`../fumadocs-study`、`../exam-docs` 的 Fumadocs spacious 布局与主题；MCP 协议行为参考 `../docs-md-mcp`。
- 文章保存在 `content/docs/**/*.md`，使用 UTF-8；不要加入数学公式插件。
- 修改外观时保持 `styles/tokens/`、`app/flat-ui.css`、`app/docs/docs-typography.css` 与参考站点风格一致。
- 新增或调整路由后验证中文直达、Markdown 下载、搜索和 MCP。
- 使用 `npm test`、`npm run cf:types`、`npm run typecheck`、`npm run build`；部署命令为 `npm run deploy`。
- Worker：`myskills`，域名：`myskills.any1.tech`；不要将参考站点的 Worker 配置覆盖到这个站点。
- 发布内容以公开仓库为准，禁止提交凭据、私人文件或环境变量值。
- Next.js API 以 `node_modules/next/dist/docs/` 中对应版本的指南为准。
