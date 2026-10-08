async function inspectManifest() {
  const url = 'https://static.dramasfree.com/_static/prod/1.3.12/_next/static/KDMZuiBL2PCQUgVFFyayY/_buildManifest.js';
  try {
    const res = await fetch(url);
    const code = await res.text();
    console.log('Build manifest:', code);
  } catch (err) {
    console.log('Err:', err.message);
  }
}

inspectManifest();
