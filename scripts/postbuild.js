import fs from 'node:fs';
import path from 'node:path';

// 1. Process and sync all HTML files from dist to root
function processHtmlFile(distPath, targetPath) {
  let html = fs.readFileSync(distPath, 'utf8');
  html = html.replace(/src="(?:\/website)?assets\//g, 'src="./assets/');
  html = html.replace(/href="(?:\/website)?assets\//g, 'href="./assets/');
  html = html.replace(/href="(?:\/website)?\/_astro\//g, 'href="./_astro/');
  html = html.replace(/src="(?:\/website)?\/_astro\//g, 'src="./_astro/');
  html = html.replace(/href="(?:\/website)?\/assets\//g, 'href="./assets/');
  html = html.replace(/src="(?:\/website)?\/assets\//g, 'src="./assets/');
  fs.writeFileSync(distPath, html);
  fs.copyFileSync(distPath, targetPath);
}

if (fs.existsSync('dist')) {
  const distItems = fs.readdirSync('dist');
  
  // Direct HTML files (index.html, 404.html, privacy.html, terms.html)
  for (const item of distItems) {
    if (item.endsWith('.html')) {
      processHtmlFile(path.join('dist', item), item);
    } else {
      const itemStat = fs.statSync(path.join('dist', item));
      if (itemStat.isDirectory() && item !== '_astro' && item !== 'assets') {
        // In case of folder format /privacy/index.html
        fs.cpSync(path.join('dist', item), item, { recursive: true });
        const subIndex = path.join('dist', item, 'index.html');
        if (fs.existsSync(subIndex)) {
          processHtmlFile(subIndex, path.join(item, 'index.html'));
        }
      }
    }
  }
}

// 2. Sync sitemaps and robots to root
if (fs.existsSync('dist')) {
  const sitemapFiles = fs.readdirSync('dist').filter(f => f.startsWith('sitemap') && f.endsWith('.xml'));
  for (const sf of sitemapFiles) {
    fs.copyFileSync(`dist/${sf}`, sf);
  }

  if (fs.existsSync('dist/robots.txt')) {
    fs.copyFileSync('dist/robots.txt', 'robots.txt');
  }

  // 3. Sync _astro bundle (clean sync to remove stale hashed assets)
  if (fs.existsSync('dist/_astro')) {
    if (fs.existsSync('_astro')) {
      fs.rmSync('_astro', { recursive: true, force: true });
    }
    fs.cpSync('dist/_astro', '_astro', { recursive: true });
  }
}

console.log('✅ Postbuild complete: all HTML routes (index, 404, privacy, terms), assets & sitemaps synced');
