import { videoScraper } from '../api/src/scrapers/videoScraper.service.js';
import { streamResolverService } from '../api/src/services/streamResolver.service.js';
import { StreamLanguage } from '../api/src/types/index.js';

async function main() {
  const args = process.argv.slice(2);
  const slug = args[0] || 'solo-leveling';
  const ep = parseInt(args[1] || '1', 10);
  const lang = (args[2] || 'sub') as StreamLanguage;

  console.log('='.repeat(60));
  console.log(`🔍 PROBANDO SCRAPER & RESOLVER MULTI-PROVEEDOR`);
  console.log(`- Título / Slug: ${slug}`);
  console.log(`- Episodio:      #${ep}`);
  console.log(`- Idioma:        ${lang.toUpperCase()}`);
  console.log('='.repeat(60));

  console.log('\n[1/2] Consultando proveedores (AnimeFLV, Cuevana, SoloLatino, DramasFree)...');
  const startTime = Date.now();
  const servers = await videoScraper.scrapeEpisodeServers(slug, ep, lang);
  const scrapeDuration = Date.now() - startTime;

  console.log(`✓ Encontrados ${servers.length} servidores en ${scrapeDuration}ms:\n`);

  if (servers.length === 0) {
    console.log('⚠️ No se encontraron servidores para este slug/episodio.');
    return;
  }

  servers.forEach((s, idx) => {
    console.log(
      `  [${idx + 1}] ${s.server_name.padEnd(20)} | Prov: ${s.provider.padEnd(12)} | Lang: ${s.language} | Priority: ${s.priority}`
    );
    console.log(`      Embed: ${s.embed_url}`);
  });

  // Test resolution on each discovered server
  console.log(`\n[2/2] Resolviendo streams nativos para cada servidor...`);
  for (let i = 0; i < Math.min(servers.length, 4); i++) {
    const s = servers[i];
    const resolveStartTime = Date.now();
    const resolved = await streamResolverService.resolveSource(s);
    const resolveDuration = Date.now() - resolveStartTime;

    console.log(`\n------------------------------------------------------------`);
    console.log(`Servidor #${i + 1}: ${s.server_name} (${s.provider})`);
    console.log(`- Tipo:       ${resolved.type.toUpperCase()}`);
    console.log(`- Tiempo:     ${resolveDuration}ms`);
    console.log(`- URL Final:  ${resolved.url.slice(0, 100)}${resolved.url.length > 100 ? '...' : ''}`);
    if (resolved.error_message) {
      console.log(`- Mensaje:    ${resolved.error_message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
