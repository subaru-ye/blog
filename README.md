# 白桦的技术博客

用于求职展示的个人技术博客：Astro 5 静态生成、零客户端 JS、中文排版优先。目标部署到 EdgeOne Pages（国内免翻墙访问、免备案）。

## 常用命令

```bash
npm install
npm run dev      # 开发预览 http://localhost:4321（含草稿）
npm run build    # 构建到 dist/（草稿被过滤）
npm run preview  # 本地预览构建产物
npx astro check  # 类型检查
```

## 写一篇文章

复制 `templates/post-template.md` 到 `src/content/blog/`，改 frontmatter 开写：

```bash
cp templates/post-template.md "src/content/blog/$(date +%F)-my-post-title.md"
```

### 文件命名规范

全小写英文 + 连字符 + 日期前缀：`YYYY-MM-DD-my-post-title.md`（如 `2026-09-29-blog-launch.md`）。
日期前缀让文件系统内自然按时间排序。

### frontmatter 字段

| 字段          | 必填 | 说明                                             |
| ------------- | ---- | ------------------------------------------------ |
| `title`       | ✅   | 标题                                             |
| `description` | ✅   | 80~160 字摘要（列表页 / RSS / 搜索结果展示）     |
| `pubDate`     | ✅   | 发布日期                                         |
| `category`    |      | 技术笔记 / 项目复盘 / 踩坑记录 / 随笔，默认「随笔」 |
| `tags`        |      | 1~3 个                                           |
| `draft`       |      | `true` 为草稿                                    |
| `updatedDate` |      | 内容大改后补上                                   |

### 草稿工作流

- `draft: true` 的文章：**dev 全站可见**（带「草稿」标记，方便预览），**build 全站过滤**（列表 / 文章页 / RSS / 标签 / 时间线均不出现）
- 过滤逻辑统一在 `src/utils/posts.ts` 的 `getPosts()`，一处定义全站生效
- 发布：删掉 `draft` 字段，提交推送即自动上线

## 目录结构

```
src/
  content.config.ts    # 内容集合 schema（frontmatter 校验）
  content/blog/        # 文章（Markdown）
  layouts/             # BaseLayout（head/导航/页脚）、BlogPost（文章页）
  components/          # PostList（文章列表）、Toc（目录）
  pages/               # 路由：首页 / blog/[id] / tags / archives / about / rss.xml
  styles/global.css    # 全站样式（主题变量、排版、代码块）
  consts.ts            # 站点常量（标题、导航、GitHub 链接）
  utils/posts.ts       # getPosts（草稿过滤）+ 日期/阅读时长工具
templates/post-template.md  # 新文章模板，复制即用
public/               # 静态资源（favicon、图片放 public/images/）
```

## 站点功能

- 标签云 `/tags/` + 每标签列表 `/tags/[tag]/`；时间线 `/archives/`（按年份分组）
- 文章页：自动目录（桌面侧边悬浮 / 移动端折叠）、阅读时长、上一篇下一篇
- SEO：每页独立 title/description、OG 标签、canonical、`sitemap-index.xml`、RSS `/rss.xml`
- 明暗主题：跟随系统 + 手动切换（localStorage 记忆）；Shiki 代码高亮双主题，代码块右上角显示语言名
- 全站零客户端 JS（仅主题切换一段内联脚本）

## 部署（EdgeOne Pages）

1. GitHub 建仓 `subaru-ye/blog` 并推送
2. [EdgeOne Pages（国际站）](https://edgeone.ai/products/pages) 关联仓库：
   - 构建命令 `npm run build`
   - 输出目录 `dist`
3. 部署后把默认域名（形如 `xxx.edgeone.app`）填入 `astro.config.mjs` 的 `site` 字段（RSS/sitemap 依赖），重新部署
4. 后续可绑定自购域名
