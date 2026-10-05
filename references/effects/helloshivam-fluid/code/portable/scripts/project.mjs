import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const pageNames = ['index.html', 'works.html', 'about.html', 'motion.html'];
const pageComponents = {
  'index.html': ['hero'],
  'works.html': [],
  'about.html': [],
  'motion.html': []
};

export function deployedUrl(value = '') {
  if (!value.trim()) return null;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('SITE_URL must be an http(s) URL without credentials, query or fragment.');
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export async function renderDocument(siteUrl = '', page = 'index.html') {
  if (!pageNames.includes(page)) throw new Error(`Unknown page: ${page}`);
  const url = deployedUrl(siteUrl);
  let html = await readFile(join(projectRoot, page), 'utf8');
  const names = pageComponents[page];
  const components = await Promise.all(names.map(name => readFile(join(projectRoot, 'src/components', `${name}.html`), 'utf8')));
  names.forEach((name, i) => {
    const marker = `<!-- component:${name} -->`;
    if (!html.includes(marker)) throw new Error(`Missing component marker: ${name}`);
    html = html.replace(marker, components[i].trim());
  });
  const pageUrl = url ? (page === 'index.html' ? url : new URL(page, url).href) : '';
  const metadata = pageUrl ? `<link rel="canonical" href="${escapeAttribute(pageUrl)}">\n  <meta property="og:url" content="${escapeAttribute(pageUrl)}">` : '';
  return html.replace('<!-- deployment:metadata -->', metadata);
}

export async function filesIn(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    const name = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await filesIn(path, `${name}/`));
    else if (entry.isFile()) result.push({ name, path });
    else throw new Error(`Unsupported symlink or special file: ${name}`);
  }
  return result;
}
