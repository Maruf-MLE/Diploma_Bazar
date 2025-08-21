export const generateSitemap = () => {
  const baseUrl = 'https://diplomabazar.vercel.app';
  const pages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/browse', changefreq: 'daily', priority: '0.9' },
    { url: '/all-departments', changefreq: 'weekly', priority: '0.8' },
    { url: '/sell-book', changefreq: 'monthly', priority: '0.8' },
    { url: '/help', changefreq: 'monthly', priority: '0.7' },
    { url: '/register', changefreq: 'monthly', priority: '0.6' },
    { url: '/login', changefreq: 'monthly', priority: '0.6' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};