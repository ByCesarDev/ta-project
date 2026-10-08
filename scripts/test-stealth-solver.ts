import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as path from 'path';
import * as os from 'os';

puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_PROFILE = path.join(os.tmpdir(), 'totalanime_stealth_profile');

async function testStealth() {
  console.log('Testing Puppeteer-Extra Stealth on dramasfree / flixlat cluster...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Turnstile solves easily in visible/stealth mode
    userDataDir: TEMP_PROFILE,
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1200,800',
    ],
  });

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());
    const targetUrl = 'https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1';
    
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Check if Cloudflare challenge is present
    let title = await page.title();
    console.log(`Initial Title: "${title}"`);

    // If Cloudflare challenge, wait up to 10s for auto-solving or click checkbox
    let attempts = 0;
    while (title.includes('Cloudflare') && attempts < 10) {
      console.log(`[Attempt ${attempts + 1}] Waiting for Cloudflare clearance...`);
      // Try to click Turnstile iframe if present
      try {
        const frames = page.frames();
        for (const frame of frames) {
          const checkbox = await frame.$('input[type="checkbox"], .ctp-checkbox-label, #challenge-stage');
          if (checkbox) {
            console.log('Found Turnstile checkbox element, clicking...');
            await checkbox.click();
          }
        }
      } catch {}

      await new Promise((r) => setTimeout(r, 2000));
      title = await page.title();
      attempts++;
    }

    console.log(`Final Page Title: "${title}"`);

    // Extract cookies and __NEXT_DATA__
    const cookies = await page.cookies();
    const cfClearance = cookies.find((c) => c.name === 'cf_clearance');
    console.log('cf_clearance cookie found:', cfClearance?.value || 'None');

    const nextData = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      return el ? JSON.parse(el.textContent || '{}') : null;
    });

    if (nextData) {
      const p = nextData.props?.pageProps;
      console.log('🎉 SUCCESS! __NEXT_DATA__ extracted:');
      console.log('  Drama Name:', p?.name);
      console.log('  DubMode:', p?.dubMode);
      console.log('  Media Info List count:', p?.mediaInfoList?.length);
      console.log('  Media URLs:', p?.mediaInfoList?.map((m: any) => ({ def: m.currentDefinition, url: m.mediaUrl })));
    } else {
      console.log('__NEXT_DATA__ was not found.');
    }
  } catch (err: any) {
    console.error('Stealth Error:', err.message);
  } finally {
    await browser.close();
  }
}

testStealth();
