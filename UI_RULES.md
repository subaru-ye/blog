# UI_RULES.md — UI 编码规则

> 配合 [DESIGN_CONTEXT.md](./DESIGN_CONTEXT.md) 使用。写 UI 代码前必读；与规则冲突的代码不许合入。

## 1. 设计 Token

全部通过 CSS 变量定义在 `src/styles/global.css`，禁止在组件里写死颜色/字号/圆角。

### 颜色（亮 / 暗成对，两套都通过 ≥4.5:1 对比度验证）

| Token | 亮色 | 暗色 | 用途 |
| ----- | ---- | ---- | ---- |
| `--bg` | `#FAF9F7` | `#191B1F` | 页面底色（纸感米白 / 深灰黑） |
| `--surface` | `#FFFFFF` | `#202329` | 分组容器底（引用、折叠目录） |
| `--fg` | `#1C1E21` | `#C9CDD4` | 正文（墨色 / 降饱和浅灰） |
| `--muted` | `#525A66` | `#98A0AB` | 次要信息（日期、摘要、页脚） |
| `--accent` | `#3B5BDB` | `#8CA6F2` | **全站唯一强调色**：链接、当前态、TOC 高亮 |
| `--border` | `#E6E2DB` | `#343841` | 发丝分隔线（1px） |
| `--code-bg` | `#F4F2EB` | `#20232A` | 行内代码 / 表头 |
| `--danger` | `#B4372F` | `#E3908A` | 仅草稿标记（dev 场景） |

强调色**只**出现在：链接及其 hover、导航当前项、TOC 当前项、`:focus-visible`。禁止第二种彩色、禁止渐变。

### 字号 / 行高 / 字族

| Token / 场景 | 值 |
| ------------ | -- |
| `--font-serif` / `--font-sans` / `--font-mono` | 见 DESIGN_CONTEXT 字体表 |
| 正文 | 1.0625rem（17px）/ 行高 1.8 / 行宽 ≤42em |
| h1（文章标题 / 首屏站名） | serif / clamp(1.75rem, 4.5vw, 2.25rem) / 1.35 |
| h2 | serif / 1.375rem / 1.5，上距 2.5em |
| h3 | serif / 1.125rem / 1.5，上距 1.9em |
| meta / 页脚 | sans / 0.8125~0.875rem / 1.6 |
| 日期 | mono / 0.875rem |

### 间距 / 圆角 / 阴影

- 间距走 4px 网格；区块纵向节奏 2~3rem，列表项间 2rem
- `--radius-sm: 4px`（行内代码）、`--radius-md: 8px`（代码块 / 折叠目录 / 按钮）、标签云胶囊 999px
- **阴影：无**。任何装饰性 box-shadow 都不合规；页面在没有阴影时必须完全成立

## 2. 组件规则

- **页头**：站名（衬线）左，导航（无衬线 0.9375rem）右 + 主题切换；当前页 `aria-current="page"` + 下划线（offset 6px）。移动端 4 个双字导航项在 375px 单行放得下，**不引入汉堡菜单**；若导航超过 5 项再改 `<details>` 折叠（零 JS 原则）
- **首页首屏**：衬线大字站名 + 一句定位 + 发丝线，"海报"不是"文档"；下方文章列表倒序
- **文章列表项**：日期（mono muted）→ 标题（衬线）→ 分类·标签（muted）→ 摘要；项间发丝线分隔；**hover 有且只有一个反馈：标题变强调色**
- **文章页**：标题衬线；meta 一行纯文本（日期 · 分类 · 阅读时长）；目录桌面 sticky 侧栏 / 移动端 `<details>` 折叠；底部上一篇 / 下一篇
- **代码块**：圆角 8px、右上角等宽小号语言名；行内代码 `--code-bg` 底 + 4px 圆角
- **引用块**：3px `--border` 左线 + muted 文字，无底色
- **标签云**：唯一允许的轻描边容器；胶囊描边 `--border`，hover 描边与文字变强调色
- **图标**：一律内联 SVG、单一家族（线性、`stroke-width: 1.75`、`currentColor`）；**禁止 emoji 当图标**

## 3. 交互状态

- 链接：正文内链接默认带下划线（下划线色过渡）；导航 / 标题类链接默认无下划线，hover 仅颜色过渡
- `:focus-visible`：2px solid `--accent`，offset 2px（全站统一）
- 触控目标 ≥ 44×44px：导航链接与主题按钮通过 padding 撑到 44px 高，不放大视觉字号
- 主题切换：`localStorage.theme` 优先，否则跟随系统；首屏渲染前设 `data-theme` 防闪烁；无 JS 时 `prefers-color-scheme` 回退

## 4. 动效预算（全站共 3 个，多一个都不加）

1. 页面进入：`main` fade + 上移 8px，220ms ease-out
2. 链接 hover：颜色 / 下划线色过渡，150ms
3. 主题切换：底色 / 文字 / 边框 250ms ease 过渡

只许 `opacity` / `transform` / 颜色属性；TOC 高亮是即时状态切换不算动效；全部包在 `@media (prefers-reduced-motion: no-preference)` 里，关闭动画后页面完整可用。

## 5. 无障碍要求

- 正文与 meta 文字对比度 ≥ 4.5:1，亮暗两套分别验证（`npm run check:contrast`）
- 键盘 Tab 顺序符合视觉顺序；跳到正文 skip-link 常驻
- 每页独立 `title` / `description`；图标带 `aria-hidden`，按钮带 `aria-label`
- 375px 无横向滚动；1440px 行宽受控（42rem）不铺满

## 6. 性能红线

零 webfont、零动画库、零客户端 JS（暗色切换 + TOC 高亮两段内联脚本除外）；不为视觉效果牺牲 Lighthouse Performance ≥ 95 的预算。
