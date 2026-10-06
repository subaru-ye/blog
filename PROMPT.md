# 博客构建提示词

> 用法：在 `C:\code\blog` 目录下打开 AI 会话，把本文件全部内容作为第一条消息发送。

---

## 角色与目标

你是一名资深前端工程师，负责把当前目录下的 Astro 骨架项目构建成一个**用于求职的个人技术博客**，核心诉求按优先级排序：

1. **写作体系**：让"新建一篇文章"的成本低到极致，规范齐全
2. **阅读体验**：中文排版舒适、代码高亮清晰、加载快
3. **求职展示**：SEO 友好、RSS 订阅、GitHub 仓库整洁、About 页专业

## 项目现状（已完成，不要推翻重做）

- Astro 5 最小骨架，`npm run build` 已验证通过（4 个页面）
- 内容集合已配置：`src/content.config.ts`（glob loader + zod schema，字段：title / description / pubDate / updatedDate / tags / draft）
- 已有页面：首页（文章列表）、`/blog/[id]`（文章页）、`/about`（占位）
- 已有布局：`src/layouts/BlogPost.astro`（基础版，待重构）
- 已有依赖：astro、@astrojs/rss、@astrojs/sitemap、sharp
- 示例文章 2 篇：`2026-09-29-hello-world.md`（含写作规范速查）、`2026-09-29-markdown-showcase.md`（格式演示）

常用命令：`npm run dev`（开发，localhost:4321）、`npm run build`、`npx astro check`（类型检查）。

## 任务分阶段执行，每阶段完成后运行 `npm run build` 验证

### P0 写作体系（最优先，做细做全）

1. **frontmatter 扩展**：在 schema 中增加 `category` 字段（枚举：技术笔记 / 项目复盘 / 踩坑记录 / 随笔，默认"随笔"），同步更新两篇示例文章
2. **写作模板**：新建 `templates/post-template.md`，包含全部 frontmatter 字段注释和标准文章结构（背景 → 正文 → 总结 → 参考），README 中说明复制即用
3. **草稿工作流**：确认 `draft: true` 的文章在列表页、文章页、RSS、标签页、归档页**全部**被过滤；`npm run dev` 时草稿仍可本地预览（dev 与 build 的过滤行为要区分）
4. **文件命名规范**：写入 README——全小写英文 + 连字符 + 日期前缀 `YYYY-MM-DD-xxx.md`，理由是文件系统内自然按时间排序
5. **内容规范落地**：把 hello-world 文章改写成正式的《博客启航》，保留并完善其中已有的写作速查章节，作为长期有效的站内规范文档

### P1 页面与功能

按顺序实现，每个都要在导航中可达：

1. 标签页：`/tags/`（全部标签云）+ `/tags/[tag]/`（该标签文章列表）
2. 归档页：`/archives/`，按年份分组，纯文字时间线风格
3. RSS：`/rss.xml`，用 @astrojs/rss，含全文摘要
4. 文章页增强：自动生成目录（TOC，h2/h3，桌面端侧边悬浮，移动端文章顶部折叠）、阅读时长估算（中文按字数 / 400 每分钟）、上一篇/下一篇导航
5. About 页：个人介绍模板（技术方向、经历、GitHub 链接占位 `https://github.com/subaru-ye`、邮箱占位），个人信息缺失处用 `<!-- TODO -->` 标注，不要编造
6. SEO：每页独立 title/description（从 frontmatter 取）、OG 标签、canonical
7. 可选（做完上面再说）：接入 pagefind 实现静态搜索

### P2 设计与阅读体验

1. 设计基调：**简洁、专业、阅读优先**。白底或米白底、深灰字、一个克制的主题色；拒绝花哨动效和渐变堆砌
2. 中文排版：正文字号 16px+、行高 1.8、中英文之间加空格的视觉、`PingFang SC / Microsoft YaHei` 字体栈
3. 暗色模式：跟随系统 `prefers-color-scheme`，加一个手动切换按钮（这个小交互允许少量 JS，localStorage 记忆）
4. 代码块：Shiki 双主题配置（亮/暗各一套），代码块右上角显示语言名
5. 响应式：移动端优先验证，TOC 在移动端不挤占正文
6. 抽出 `BaseLayout.astro` 统一 head、导航、页脚，消除现有重复

### P3 部署（等用户确认设计满意后再做）

1. `git init` + 首次提交，建议用户在 GitHub 建仓 `subaru-ye/blog` 并推送
2. 指导用户在 **EdgeOne Pages（腾讯云国际站）** 关联 GitHub 仓库部署——选它是因为国内免翻墙访问且免备案；构建命令 `npm run build`，输出目录 `dist`
3. `astro.config.mjs` 的 `site` 字段替换为部署后的真实域名（RSS/sitemap 依赖它）
4. 提醒：默认域名形如 `xxx.edgeone.app`，后续可绑自购域名

## 技术边界（硬约束）

- 保持零客户端 JS 为默认，只有暗色切换这类小交互允许内联脚本；不引入 React/Vue 等框架
- 不新增依赖，除非任务明确需要（pagefind 是唯一预期新增）
- 用 Astro 5 内容集合 API：`getCollection` / `render`（来自 `astro:content`），glob loader 在 `src/content.config.ts`，不要用已废弃的 `content/createCollection` 旧 API
- 所有日期展示用 `zh-CN` locale
- 不要修改 `C:\code\baihua`（作品集）和 `C:\code\baihua-blog`（废弃的 Halo 方案）下的任何文件

## 验收标准（每阶段自检，全部完成时汇总）

- [ ] `npm run build` 零错误，`npx astro check` 无类型错误
- [ ] 新建一篇 `draft: true` 文章：dev 可预览、build 产物中不存在
- [ ] 首页、标签页、归档页、RSS、About、文章页全部可正常访问，导航可达
- [ ] 文章页 TOC、阅读时长、上下篇导航正常
- [ ] 移动端 375px 宽度下无横向滚动、排版正常
- [ ] Lighthouse（Performance / SEO / Best Practices）≥ 95
- [ ] README 更新为正式版：项目介绍、写作规范、常用命令、部署说明

## 工作方式

- 每完成一个阶段：构建验证 → 简报改动了什么 → 再进入下一阶段
- 涉及个人信息（简介、邮箱、社交链接）一律用占位符 + `<!-- TODO -->`，汇总时列出来让用户填
- 遇到与用户体验相关的取舍（如是否加搜索、配色偏好）先问用户再做
