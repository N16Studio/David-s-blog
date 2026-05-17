const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'data', 'blog.json');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content, 'utf8');
}

function page({ title, hrefPrefix = '', body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${hrefPrefix}styles.css">
</head>
<body>
  <main class="page">
${body}
  </main>
</body>
</html>
`;
}

function articleList(articles, hrefPrefix = '') {
  if (articles.length === 0) {
    return '    <p class="empty-list">No blog posts.</p>';
  }

  return `    <ul class="post-list">
${articles.map((article) => `      <li><a href="${hrefPrefix}posts/${escapeHtml(article.slug)}/">${escapeHtml(article.title)}</a></li>`).join('\n')}
    </ul>`;
}

function renderCategories() {
  return `    <ul class="category-list">
${data.categories.map((category) => `      <li><a href="topics/${escapeHtml(slugify(category))}/">${escapeHtml(category)}</a></li>`).join('\n')}
    </ul>`;
}

function renderArticleBody(article) {
  return article.body.map((block) => {
    if (block.type === 'h2') {
      return `      <h2>${escapeHtml(block.text)}</h2>`;
    }
    return `      <p>${escapeHtml(block.text)}</p>`;
  }).join('\n');
}

writeFile(path.join(root, 'styles.css'), `:root {
  --background: #f7f3ea;
  --text: #1f1f1f;
  --muted: #6a6258;
  --measure: 760px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--background);
  color: var(--text);
  font-family: Georgia, "Times New Roman", serif;
  line-height: 1.55;
}

a {
  color: inherit;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.16em;
}

a:hover {
  text-decoration-thickness: 2px;
}

.page {
  width: min(var(--measure), calc(100% - 40px));
  margin: 0 auto;
  padding: 72px 0 84px;
}

.site-title {
  margin: 0 0 72px;
  font-size: clamp(58px, 11vw, 128px);
  font-weight: 400;
  line-height: 0.92;
}

.category-list,
.post-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-list {
  gap: 8px;
  margin: -34px 0 58px;
  color: var(--muted);
  font-size: clamp(20px, 3vw, 30px);
  line-height: 1.2;
}

.category-list a,
.post-list a {
  text-decoration: none;
}

.category-list a:hover,
.post-list a:hover {
  text-decoration: underline;
}

.post-list {
  gap: 26px;
}

.post-list a,
.empty-list {
  font-size: clamp(28px, 5vw, 58px);
  line-height: 1.04;
  font-weight: 400;
}

.empty-list {
  margin: 0;
  color: var(--muted);
}

.article-title {
  margin: 0 0 26px;
  font-size: clamp(48px, 8vw, 92px);
  font-weight: 400;
  line-height: 0.98;
}

.article-date,
.topic-title,
.back {
  color: var(--muted);
}

.article-date {
  margin: 0 0 64px;
  font-size: 18px;
}

.topic-title {
  margin: -34px 0 58px;
  font-size: clamp(24px, 4vw, 42px);
  font-weight: 400;
  line-height: 1.15;
}

.article-body {
  display: grid;
  gap: 1.15em;
  font-size: clamp(24px, 3.6vw, 42px);
  line-height: 1.2;
}

.article-body p {
  margin: 0;
}

.article-body h2 {
  margin: 0.65em 0 -0.45em;
  font-size: clamp(26px, 3.8vw, 46px);
  font-weight: 400;
  line-height: 1.08;
}

.back {
  display: inline-block;
  margin-top: 72px;
  font-size: 18px;
}

@media (max-width: 620px) {
  .page {
    width: min(100% - 32px, var(--measure));
    padding-top: 46px;
  }

  .site-title {
    margin-bottom: 52px;
  }

  .category-list,
  .topic-title {
    margin: -26px 0 44px;
  }

  .post-list {
    gap: 22px;
  }

  .article-date {
    margin-bottom: 46px;
  }
}
`);

writeFile(path.join(root, 'index.html'), page({
  title: data.siteTitle,
  body: `    <h1 class="site-title">${escapeHtml(data.siteTitle)}</h1>
${renderCategories()}
${articleList(data.articles)}`
}));

for (const category of data.categories) {
  const categorySlug = slugify(category);
  const articles = data.articles.filter((article) => (article.topics || []).includes(category));
  writeFile(path.join(root, 'topics', categorySlug, 'index.html'), page({
    title: `${category} - ${data.siteTitle}`,
    hrefPrefix: '../../',
    body: `    <h1 class="site-title">${escapeHtml(data.siteTitle)}</h1>
    <h2 class="topic-title">${escapeHtml(category)}</h2>
${articleList(articles, '../../')}
    <a class="back" href="../../">Blog</a>`
  }));
}

for (const article of data.articles) {
  writeFile(path.join(root, 'posts', article.slug, 'index.html'), page({
    title: `${article.title} - ${data.siteTitle}`,
    hrefPrefix: '../../',
    body: `    <h1 class="article-title">${escapeHtml(article.title)}</h1>
    <p class="article-date">${escapeHtml(article.date)}</p>
    <div class="article-body">
${renderArticleBody(article)}
    </div>
    <a class="back" href="../../">Blog</a>`
  }));
}

console.log(`Built ${data.articles.length} articles and ${data.categories.length} topics.`);
