import { describe, it, expect } from 'vitest';
import {
  formatTime,
  formatStatusLabel,
  truncateText,
  normalizeAnimeStatus,
  canTrackPlayback,
  getAdjacentEpisodes,
} from '../src/lib/utils.js';
import { EpisodeSourceRow } from '../src/types/index.js';

describe('TotalAnime Web: Utility & Formatting Tests', () => {
  it('should format seconds into mm:ss time display', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(75)).toBe('1:15');
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(1440)).toBe('24:00');
    expect(formatTime(-10)).toBe('0:00');
  });

  it('should return human-friendly status labels and colors', () => {
    const releasing = formatStatusLabel('releasing');
    expect(releasing.label).toBe('En Emisión');
    expect(releasing.color).toContain('emerald');

    const finished = formatStatusLabel('finished');
    expect(finished.label).toBe('Finalizado');
    expect(finished.color).toContain('indigo');

    const upcoming = formatStatusLabel('not_yet_released');
    expect(upcoming.label).toBe('Próximamente');
    expect(upcoming.color).toContain('amber');

    const unknown = formatStatusLabel('custom_unknown');
    expect(unknown.label).toBe('custom_unknown');
  });

  it('should normalize anime status strings to AniList / DB enum values', () => {
    expect(normalizeAnimeStatus('emision')).toBe('RELEASING');
    expect(normalizeAnimeStatus('en_emision')).toBe('RELEASING');
    expect(normalizeAnimeStatus('en emisión')).toBe('RELEASING');
    expect(normalizeAnimeStatus('releasing')).toBe('RELEASING');
    expect(normalizeAnimeStatus('RELEASING')).toBe('RELEASING');

    expect(normalizeAnimeStatus('finalizado')).toBe('FINISHED');
    expect(normalizeAnimeStatus('finished')).toBe('FINISHED');
    expect(normalizeAnimeStatus('FINISHED')).toBe('FINISHED');

    expect(normalizeAnimeStatus('proximamente')).toBe('NOT_YET_RELEASED');
    expect(normalizeAnimeStatus('próximamente')).toBe('NOT_YET_RELEASED');
    expect(normalizeAnimeStatus('not_yet_released')).toBe('NOT_YET_RELEASED');

    expect(normalizeAnimeStatus('')).toBe('');
    expect(normalizeAnimeStatus(undefined)).toBe('');
  });

  it('should truncate synopsis text cleanly with ellipsis', () => {
    const shortText = 'Corta sinopsis';
    expect(truncateText(shortText, 50)).toBe('Corta sinopsis');

    const longText = 'Esta es una sinopsis extremadamente larga que debe ser truncada de forma segura para no romper el layout de la tarjeta';
    const truncated = truncateText(longText, 30);
    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBeLessThanOrEqual(33);
  });
});

describe('TotalAnime Web: Streaming Server Selection Logic', () => {
  const mockSources: EpisodeSourceRow[] = [
    {
      id: 1,
      episode_id: 101,
      provider: 'yourupload',
      server_name: 'YourUpload',
      embed_url: 'https://www.yourupload.com/embed/123',
      direct_stream_url: null,
      language: 'sub',
      quality: 'HD',
      priority: 5,
      is_active: true,
      last_verified_at: '2026-09-05T00:00:00Z',
      created_at: '2026-09-05T00:00:00Z',
      updated_at: '2026-09-05T00:00:00Z',
    },
    {
      id: 2,
      episode_id: 101,
      provider: 'mega',
      server_name: 'Mega',
      embed_url: 'https://mega.nz/embed/!456',
      direct_stream_url: null,
      language: 'sub',
      quality: 'FHD',
      priority: 1,
      is_active: true,
      last_verified_at: '2026-09-05T00:00:00Z',
      created_at: '2026-09-05T00:00:00Z',
      updated_at: '2026-09-05T00:00:00Z',
    },
    {
      id: 3,
      episode_id: 101,
      provider: 'okru',
      server_name: 'OkRu Doblado',
      embed_url: 'https://ok.ru/videoembed/789',
      direct_stream_url: null,
      language: 'dub',
      quality: 'HD',
      priority: 2,
      is_active: true,
      last_verified_at: '2026-09-05T00:00:00Z',
      created_at: '2026-09-05T00:00:00Z',
      updated_at: '2026-09-05T00:00:00Z',
    },
  ];

  it('should filter sources by language correctly', () => {
    const subSources = mockSources.filter((s) => s.language === 'sub');
    expect(subSources).toHaveLength(2);
    expect(subSources.every((s) => s.language === 'sub')).toBe(true);

    const dubSources = mockSources.filter((s) => s.language === 'dub');
    expect(dubSources).toHaveLength(1);
    expect(dubSources[0].provider).toBe('okru');
  });

  it('should sort sources by priority in ascending order (priority 1 first)', () => {
    const subSources = mockSources.filter((s) => s.language === 'sub');
    const sorted = [...subSources].sort((a, b) => a.priority - b.priority);

    expect(sorted[0].provider).toBe('mega');
    expect(sorted[0].priority).toBe(1);
    expect(sorted[1].provider).toBe('yourupload');
    expect(sorted[1].priority).toBe(5);
  });
});

describe('TotalAnime Web: Playback Progress & Completion Calculation', () => {
  it('should mark completed if watched progress >= 85%', () => {
    const totalDurationSeconds = 24 * 60; // 1440s
    const threshold85Percent = 1440 * 0.85; // 1224s

    // At 84% -> not completed
    const progress84 = 1200;
    const isCompleted84 = totalDurationSeconds > 0 && progress84 / totalDurationSeconds >= 0.85;
    expect(isCompleted84).toBe(false);

    // At 85% -> completed
    const progress85 = threshold85Percent;
    const isCompleted85 = totalDurationSeconds > 0 && progress85 / totalDurationSeconds >= 0.85;
    expect(isCompleted85).toBe(true);

    // At 100% -> completed
    const progress100 = 1440;
    const isCompleted100 = totalDurationSeconds > 0 && progress100 / totalDurationSeconds >= 0.85;
    expect(isCompleted100).toBe(true);
  });

  it('should calculate percentage safely with 0 duration', () => {
    const total = 0;
    const watched = 50;
    const isCompleted = total > 0 && watched / total >= 0.85;
    expect(isCompleted).toBe(false);
  });
});

describe('TotalAnime Web: Episode Navigation Boundaries', () => {
  it('should accurately determine previous and next availability', () => {
    const totalEpisodes = 12;

    // Episode 1 (first)
    const ep1 = 1;
    const hasPrev1 = ep1 > 1;
    const hasNext1 = totalEpisodes > 0 ? ep1 < totalEpisodes : true;
    expect(hasPrev1).toBe(false);
    expect(hasNext1).toBe(true);

    // Episode 5 (middle)
    const ep5 = 5;
    const hasPrev5 = ep5 > 1;
    const hasNext5 = totalEpisodes > 0 ? ep5 < totalEpisodes : true;
    expect(hasPrev5).toBe(true);
    expect(hasNext5).toBe(true);

    // Episode 12 (last)
    const ep12 = 12;
    const hasPrev12 = ep12 > 1;
    const hasNext12 = totalEpisodes > 0 ? ep12 < totalEpisodes : true;
    expect(hasPrev12).toBe(true);
    expect(hasNext12).toBe(false);
  });

  it('should handle non-consecutive episode numbers and gaps correctly', () => {
    const episodesWithGaps = [
      { episode_number: 1 },
      { episode_number: 2 },
      { episode_number: 5 },
      { episode_number: 8 },
    ];

    // From episode 1: prev is null, next is 2
    const nav1 = getAdjacentEpisodes(episodesWithGaps, 1);
    expect(nav1.prev).toBeNull();
    expect(nav1.next).toBe(2);

    // From episode 2: prev is 1, next is 5 (skipping 3 and 4)
    const nav2 = getAdjacentEpisodes(episodesWithGaps, 2);
    expect(nav2.prev).toBe(1);
    expect(nav2.next).toBe(5);

    // From episode 5: prev is 2 (skipping 3 and 4), next is 8 (skipping 6 and 7)
    const nav5 = getAdjacentEpisodes(episodesWithGaps, 5);
    expect(nav5.prev).toBe(2);
    expect(nav5.next).toBe(8);

    // From episode 8 (last in list): prev is 5, next is null
    const nav8 = getAdjacentEpisodes(episodesWithGaps, 8);
    expect(nav8.prev).toBe(5);
    expect(nav8.next).toBeNull();
  });
});

describe('TotalAnime Web: Playback Guard & History Protection', () => {
  it('should prevent tracking and saving progress if no source or embed URL exists', () => {
    // null or undefined source
    expect(canTrackPlayback(null)).toBe(false);
    expect(canTrackPlayback(undefined)).toBe(false);

    // source with missing embed_url
    expect(canTrackPlayback({ embed_url: undefined } as any)).toBe(false);
    expect(canTrackPlayback({ embed_url: null } as any)).toBe(false);
    expect(canTrackPlayback({ embed_url: '' } as any)).toBe(false);
    expect(canTrackPlayback({ embed_url: '   ' } as any)).toBe(false);

    // source with valid embed_url
    expect(canTrackPlayback({ embed_url: 'https://streamwish.to/e/abc' })).toBe(true);
    expect(canTrackPlayback({ embed_url: 'https://mega.nz/embed/xyz' })).toBe(true);
  });
});

