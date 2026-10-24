# MySkills

- 项目路径：`/home/dev/Documents/Project/MySkills`。
- 参考项目：`../fumadocs-study`、`../exam-docs` 的 Fumadocs spacious 布局与主题；MCP 协议行为参考 `../docs-md-mcp`。
- 原始 Skill 保存在 `skills/<name>/`；生成阅读页在 `content/docs/skills/<name>/`，不要直接改生成文件。其他站点说明使用 UTF-8 Markdown；不要加入数学公式插件。
- 新增 Skill 时维护 `skills/catalog.json`，保留其规则和参考文件，运行 `npm run content:export`。MCP 按需发现与读取说明须同步维护。
- 修改外观时保持 `styles/tokens/`、`app/flat-ui.css`、`app/docs/docs-typography.css` 与参考站点风格一致。
- 新增或调整路由后验证中文直达、Markdown 下载、搜索和 MCP。
- 使用 `npm test`、`npm run cf:types`、`npm run typecheck`、`npm run build`；部署命令为 `npm run deploy`。
- Worker：`myskills`，域名：`myskills.any1.tech`；不要将参考站点的 Worker 配置覆盖到这个站点。
- 发布内容以公开仓库为准，禁止提交凭据、私人文件或环境变量值。
- Next.js API 以 `node_modules/next/dist/docs/` 中对应版本的指南为准。
