import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const STORAGE_FILE = process.cwd().endsWith('api')
  ? path.join(process.cwd(), '.cf_clearance.json')
  : path.join(process.cwd(), 'api', '.cf_clearance.json');

export interface ClearanceData {
  cookie: string;
  userAgent: string;
  updatedAt: string;
}

export class CloudflareCookieService {
  private memoryCache: ClearanceData | null = null;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf8');
        this.memoryCache = JSON.parse(raw);
      }
    } catch {
      this.memoryCache = null;
    }
  }

  public getClearance(): ClearanceData | null {
    if (!this.memoryCache) {
      this.loadFromDisk();
    }
    return this.memoryCache;
  }

  public saveClearance(cookie: string, userAgent?: string): void {
    const cleanCookie = cookie.trim().replace(/^cf_clearance=/, '');
    const data: ClearanceData = {
      cookie: cleanCookie,
      userAgent:
        userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      updatedAt: new Date().toISOString(),
    };
    this.memoryCache = data;
    try {
      const dir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[CloudflareCookieService] Error writing to disk:', err.message);
    }
  }

  public getHeaders(): Record<string, string> {
    const clearance = this.getClearance();
    const headers: Record<string, string> = {
      'User-Agent':
        clearance?.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    };

    if (clearance?.cookie) {
      headers['Cookie'] = `cf_clearance=${clearance.cookie}`;
    }

    return headers;
  }

  /**
   * Launches a small visible browser window for the user to solve Turnstile once.
   * Extracts cf_clearance upon solving.
   */
  public async launchSolverWindow(
    targetUrl: string = 'https://www3.dramasfree.com/es/detail/drama/sNA1hjhxFcJpD4ZwSK9En-The-Seven-Deadly-Sins/1'
  ): Promise<{ success: boolean; cookie?: string; message: string }> {
    const executable = fs.existsSync(CHROME_PATH)
      ? CHROME_PATH
      : fs.existsSync(EDGE_PATH)
      ? EDGE_PATH
      : undefined;

    if (!executable) {
      return {
        success: false,
        message: 'No se encontró Google Chrome ni Microsoft Edge en las rutas estándar del sistema.',
      };
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath: executable,
        headless: false,
        args: [
          '--no-first-run',
          '--no-default-browser-check',
          '--window-size=650,750',
          '--window-position=100,100',
        ],
      });

      const page = (await browser.pages())[0] || (await browser.newPage());
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Poll for cf_clearance or __NEXT_DATA__ for up to 30 seconds
      const startTime = Date.now();
      while (Date.now() - startTime < 30000) {
        const cookies = await page.cookies();
        const cfCookie = cookies.find((c) => c.name === 'cf_clearance');
        const hasNextData = await page.evaluate(() => !!document.getElementById('__NEXT_DATA__'));

        if (cfCookie?.value || hasNextData) {
          const cookieVal = cfCookie?.value || '';
          const ua = await page.evaluate(() => navigator.userAgent);
          if (cookieVal) {
            this.saveClearance(cookieVal, ua);
          }
          await browser.close();
          return {
            success: true,
            cookie: cookieVal,
            message: '¡Verificación completada con éxito! Sesión guardada para el scraper.',
          };
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      await browser.close();
      return {
        success: false,
        message: 'Tiempo de espera agotado sin resolver la verificación de Cloudflare.',
      };
    } catch (err: any) {
      if (browser) await browser.close().catch(() => {});
      return {
        success: false,
        message: `Error al abrir ventana de verificación: ${err.message}`,
      };
    }
  }
}

export const cloudflareCookieService = new CloudflareCookieService();
