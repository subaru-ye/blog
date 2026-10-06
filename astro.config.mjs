// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// site 部署时替换为真实域名（EdgeOne Pages 默认域名或自购域名），RSS/sitemap 依赖它
export default defineConfig({
  site: 'https://blog.example.com',
  devToolbar: { enabled: false },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      // 双主题：亮色用内联 light 值，暗色经 --shiki-dark CSS 变量切换（见 global.css）
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      wrap: false,
    },
  },
});
