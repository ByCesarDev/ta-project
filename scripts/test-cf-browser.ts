import puppeteer from 'puppeteer-core';
import * as path from 'path';
import * as os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), 'totalanime_chrome_profile');

async function testNonHeadless() {
  console.log('Testing Chrome with persistent profile for Cloudflare clearance...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Non-headless passes Cloudflare immediately!
    userDataDir: TEMP_PROFILE,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-blink-features=AutomationControlled'
    ],
  });

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());
    console.log('Navigating to The Seven Deadly Sins Latino...');
    await page.goto('https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait a couple seconds if CF challenge solves automatically
    await new Promise((r) => setTimeout(r, 4000));

    console.log('Page Title:', await page.title());

    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el ? JSON.parse(el.textContent || '{}') : null;
    });

    console.log('NextData loaded:', !!nextData);
    if (nextData) {
      const p = nextData.props?.pageProps;
      console.log('SUCCESS! Drama Name:', p?.name);
      console.log('DubMode:', p?.dubMode);
      console.log('DubbingList:', p?.dubbingList?.length);
      console.log('Media count:', p?.mediaInfoList?.length);
      console.log('Media URLs:', p?.mediaInfoList?.map((m: any) => ({ def: m.currentDefinition, url: m.mediaUrl })));
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

testNonHeadless();
