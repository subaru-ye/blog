// 全站统一的文章获取入口：列表页、文章页、标签页、归档页、RSS 一律经由这里，
// 保证草稿过滤行为只有一处定义。
// dev 预览包含草稿（可本地检查效果）；build（import.meta.env.DEV 为 false）时全部过滤。
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getPosts(): Promise<CollectionEntry<'blog'>[]> {
  return (
    await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft)
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

// 2026/09/29，用于列表、归档等紧凑场景
export function fmtDate(d: Date): string {
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// 2026年9月29日，用于文章页头
export function fmtDateLong(d: Date): string {
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// 阅读时长（分钟）：中文按 400 字/分钟，代码块不计入
// ponytail: 粗略估算，英文单词按 1.6 个汉字折算；够用即可，不追求精确
export function readingTime(markdown: string): number {
  const text = markdown.replace(/```[\s\S]*?```/g, '');
  const cjk = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const words = (text.match(/[a-zA-Z0-9]+/g) ?? []).length;
  return Math.max(1, Math.round((cjk + words * 1.6) / 400));
}
