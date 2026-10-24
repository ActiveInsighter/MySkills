---
title: 编写与发布
description: 用普通 Markdown 维护 Skill，中文路径也可以直接发布。
---

## 新增一篇 Skill

在仓库 `content/docs/skills/` 下新增 `.md` 文件，例如 `我的新技能.md`：

```markdown
---
title: 我的新技能
description: 说明这篇 Skill 解决的问题。
---

## 适用场景
写清什么时候使用。

## 执行步骤
列出可以照着执行的步骤。

## 验收标准
说明怎样判断完成。
```

把文件名加入同目录 `meta.json` 的 `pages` 数组，可以控制侧边栏顺序。正文中的站内链接使用 `/docs/skills/我的新技能` 这样的页面路径。

## 本地预览

```bash
npm ci
npm run dev
```

内容以 UTF-8 保存。正文支持标题、列表、表格、代码块等 Markdown 语法；项目没有配置数学公式插件。

## Markdown 导出

每篇文档对应同路径的 `.md` 地址。例如：

- 页面：`/docs/skills/任务拆解与验收`
- Markdown：`/docs/skills/任务拆解与验收.md`

导出保留原文与 frontmatter。文章顶部可以复制原文、下载 `.md`，也可以打开 GitHub 源文件。下载响应使用 UTF-8 内容类型和标准中文文件名编码。

为了让网页和 AI 读取内容保持一致，知识库正文使用 `.md` 文件。若要引入 MDX 交互组件，需要先提供对应的纯 Markdown 表达方式。

## 发布

推送到 `main` 后，GitHub Actions 执行测试、类型检查和静态构建。配置部署凭据后，还会发布到 Cloudflare Worker Assets 并运行线上 MCP 验证。仓库需要配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。

构建会更新 `llms.txt`、`llms-full.txt`、`skills.json` 和站内搜索索引。部署成功后，网页、导出文件和 MCP 使用同一批内容。
