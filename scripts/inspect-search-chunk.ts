async function inspectSearchPage() {
  const url = 'https://static.dramasfree.com/_static/prod/1.3.12/_next/static/chunks/pages/search-ed33284b08587322.js';
  try {
    const res = await fetch(url);
    const code = await res.text();
    console.log('Search chunk length:', code.length);
    console.log('Search chunk sample:\n', code.slice(0, 2000));
  } catch (err) {
    console.log('Err:', err.message);
  }
}

inspectSearchPage();
