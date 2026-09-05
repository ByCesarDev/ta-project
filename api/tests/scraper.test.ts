import { describe, it, expect } from 'vitest';
import { videoScraper } from '../src/scrapers/videoScraper.service.js';

describe('VideoScraperService HTML Parser', () => {
  it('should parse Base64 encoded select options and return sorted servers', () => {
    // Construct Base64 iframe values
    const megaIframe = Buffer.from('<iframe src="https://mega.nz/embed/file123" allowfullscreen></iframe>').toString(
      'base64'
    );
    const wishIframe = Buffer.from(
      '<iframe src="https://streamwish.to/e/swish999" allowfullscreen></iframe>'
    ).toString('base64');
    const tapeIframe = Buffer.from(
      '<iframe src="https://streamtape.com/e/tape888" allowfullscreen></iframe>'
    ).toString('base64');

    const html = `
      <div class="mobius">
        <select>
          <option value="${tapeIframe}">Streamtape</option>
          <option value="${megaIframe}">Mega</option>
          <option value="${wishIframe}">StreamWish</option>
        </select>
      </div>
    `;

    const servers = videoScraper.parseEpisodeHtml(html, 'sub');

    expect(servers).toHaveLength(3);
    // Mega should be first due to priority 10
    expect(servers[0]?.provider).toBe('mega');
    expect(servers[0]?.embed_url).toBe('https://mega.nz/embed/file123');
    // StreamWish second (priority 20)
    expect(servers[1]?.provider).toBe('streamwish');
    expect(servers[1]?.embed_url).toBe('https://streamwish.to/e/swish999');
    // Streamtape third (priority 40)
    expect(servers[2]?.provider).toBe('streamtape');
  });

  it('should parse inline JavaScript var videos = [...] structures', () => {
    const html = `
      <script>
        var videos = [
          ["FileMoon", "https://filemoon.sx/e/moon123", "0"],
          ["YourUpload", "https://www.yourupload.com/embed/yu456", "0"]
        ];
      </script>
    `;

    const servers = videoScraper.parseEpisodeHtml(html, 'sub');

    expect(servers).toHaveLength(2);
    expect(servers[0]?.provider).toBe('filemoon');
    expect(servers[1]?.provider).toBe('yourupload');
  });

  it('should correctly format anime slugs', () => {
    expect(videoScraper.formatSlug('Shingeki no Kyojin: The Final Season')).toBe(
      'shingeki-no-kyojin-the-final-season'
    );
    expect(videoScraper.formatSlug('Fate/stay night [Unlimited Blade Works]')).toBe(
      'fatestay-night-unlimited-blade-works'
    );
  });
});
