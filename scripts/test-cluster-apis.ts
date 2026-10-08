const apiDomains = [
  'https://www3-api.dramasfree.com',
  'https://ww1-api.123flmsfree.com',
  'https://api.cuevana19.com',
  'https://api.peliculaplay.com',
  'https://api.123pelicula.com',
  'https://api.flixlat.com',
  'https://api.cuevana4br.com',
  'https://api.321moviesfree.com'
];

async function testApi(domain: string) {
  try {
    const res = await fetch(`${domain}/api/v1/search/drama?keyword=Solo+Leveling`, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': domain.replace('-api', ''),
        'Referer': `${domain.replace('-api', '')}/`,
      }
    });
    const text = await res.text();
    console.log(`[${domain}] -> STATUS ${res.status}:`, text.slice(0, 150));
  } catch (err: any) {
    console.log(`[${domain}] -> ERROR:`, err.message);
  }
}

async function main() {
  console.log('Testing cluster backend API endpoints...\n');
  for (const d of apiDomains) {
    await testApi(d);
  }
}

main();
