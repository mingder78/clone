import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

const START_URL = "https://uyiwang.com";
const OUTPUT_DIR = "/Users/ming/src/mirror";

const visited = new Set();
const queue = [START_URL];

async function ensureDir(file) {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

async function savePage(url, html) {
  const filePath = path.join(OUTPUT_DIR, new URL(url).pathname);
  const final = filePath.endsWith('/') ? filePath + 'index.html' : filePath;
  await ensureDir(final);
  await fs.writeFile(final, html);
}

async function crawl() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    console.log("Fetching:", url);

    await page.goto(url, { waitUntil: 'networkidle2' });

    const html = await page.content();
    await savePage(url, html);

    const links = await page.$$eval('a', as => as.map(a => a.href));

    for (const link of links) {
      if (link.startsWith(START_URL)) queue.push(link);
    }
  }

  await browser.close();
}

crawl();

