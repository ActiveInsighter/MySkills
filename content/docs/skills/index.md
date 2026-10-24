---
title: Skills
description: 两个 Fumadocs 项目相关的 10 个共用 Skill，按任务选择并读取。
---

以下 Skill 从本机共用 Skill 目录迁入，保留原始入口、规则、参考文件和配套资源。

## 按任务选择

| Skill | 名称 | 适用场景 |
| --- | --- | --- |
| [前端视觉设计](/docs/skills/frontend-design) | `frontend-design` | 设计有明确风格的网页与界面，处理布局、排版和视觉方向。 |
| [shadcn 组件开发](/docs/skills/shadcn) | `shadcn` | 使用 shadcn 与 Base UI 组合组件、处理样式、表单和设计系统。 |
| [设计系统架构](/docs/skills/design-system-patterns) | `design-system-patterns` | 组织设计 Token、主题和组件架构，维护两个 Fumadocs 站点的一致性。 |
| [Tailwind 设计系统](/docs/skills/tailwind-design-system) | `tailwind-design-system` | 使用 Tailwind CSS v4 建立语义 Token、深浅主题和响应式组件。 |
| [React 组件组合](/docs/skills/vercel-composition-patterns) | `vercel-composition-patterns` | 重构组件 API，使用组合、Context 和复合组件处理复杂 UI。 |
| [React 与 Next.js 性能](/docs/skills/vercel-react-best-practices) | `vercel-react-best-practices` | 排查瀑布请求、包体积、渲染和缓存问题，优化 React 与 Next.js。 |
| [网页体验与无障碍审查](/docs/skills/web-design-guidelines) | `web-design-guidelines` | 检查界面的交互、可访问性、键盘操作和网页体验规范。 |
| [Playwright 浏览器验证](/docs/skills/playwright-cli) | `playwright-cli` | 在真实浏览器中验证导航、搜索、主题、下载与手机布局。 |
| [Supabase 开发与排障](/docs/skills/supabase) | `supabase` | 处理 Supabase 登录、会话、Storage、Realtime、客户端与服务排障。 |
| [Postgres 与 RLS 最佳实践](/docs/skills/supabase-postgres-best-practices) | `supabase-postgres-best-practices` | 编写和审查 Postgres 表结构、SQL、索引、迁移及 RLS 数据隔离。 |

## 让 AI 按需读取

通过 [MCP 使用说明](/docs/ai) 连接后，先调用 `list_skills` 查询名称和适用场景，再调用 `read_skill` 读取相关入口。需要具体规则时，沿入口中的引用继续读取，无需一次加载全部内容。
