const buildId = 'KDMZuiBL2PCQUgVFFyayY';
const domains = [
  'www3.dramasfree.com',
  'ww1.123flmsfree.com',
  'play.cuevana19.com',
  'peliculaplay.com',
  'ver.123pelicula.com',
  'flixlat.com',
  'es.cuevana4br.com',
  'ww20.321moviesfree.com'
];

async function testSearchJson(domain: string) {
  try {
    const url = `https://${domain}/_next/data/${buildId}/es/search.json?keyword=Solo+Leveling`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'x-nextjs-data': '1',
      }
    });
    console.log(`[${domain}] -> STATUS: ${res.status}`);
    if (res.status === 200) {
      const json = await res.json();
      console.log('  PageProps keys:', Object.keys(json.pageProps || {}));
      console.log('  searchRes items count:', json.pageProps?.searchRes?.length || json.pageProps?.searchResults?.length);
      console.log('  First item:', json.pageProps?.searchRes?.[0] || json.pageProps?.searchResults?.[0]);
    }
  } catch (err: any) {
    console.log(`[${domain}] -> ERROR:`, err.message);
  }
}

async function main() {
  console.log('Testing Next.js pure data search route...\n');
  for (const d of domains) {
    await testSearchJson(d);
  }
}

main();
