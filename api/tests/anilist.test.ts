import { describe, it, expect } from 'vitest';
import { anilistService } from '../src/services/anilist.service.js';
import { AniListMedia } from '../types/index.js';

describe('AniListService Utilities & Normalization', () => {
  it('should clean HTML tags and formatting from descriptions', () => {
    const raw = '<p>A <i>young boy</i> with an <b>unbreakable spirit</b>.<br><br>He aims to be the best!</p>';
    const cleaned = anilistService.cleanDescription(raw);
    expect(cleaned).toBe('A young boy with an unbreakable spirit.\n\nHe aims to be the best!');
  });

  it('should generate URL-friendly slugs with accent normalization', () => {
    expect(anilistService.generateSlug('Jujutsu Kaisen 2nd Season')).toBe('jujutsu-kaisen-2nd-season');
    expect(anilistService.generateSlug('Pokémon: Diamond & Pearl')).toBe('pokemon-diamond-pearl');
    expect(anilistService.generateSlug('KonoSuba: God\'s Blessing on this Wonderful World!')).toBe(
      'konosuba-gods-blessing-on-this-wonderful-world'
    );
  });

  it('should map AniList status correctly', () => {
    expect(anilistService.mapStatus('RELEASING')).toBe('emision');
    expect(anilistService.mapStatus('FINISHED')).toBe('finalizado');
    expect(anilistService.mapStatus('CANCELLED')).toBe('finalizado');
    expect(anilistService.mapStatus('NOT_YET_RELEASED')).toBe('proximamente');
    expect(anilistService.mapStatus(undefined)).toBe('proximamente');
  });

  it('should normalize AniListMedia GraphQL response to Supabase schema', () => {
    const mockMedia: AniListMedia = {
      id: 12345,
      title: {
        romaji: 'Kimetsu no Yaiba: Yuukaku-hen',
        english: 'Demon Slayer: Kimetsu no Yaiba Entertainment District Arc',
        native: '鬼滅の刃 遊郭編',
        userPreferred: 'Kimetsu no Yaiba: Yuukaku-hen',
      },
      description: 'Tanjiro and friends embark on a <i>dangerous mission</i>.',
      status: 'FINISHED',
      episodes: 11,
      seasonYear: 2021,
      format: 'TV',
      genres: ['Action', 'Fantasy', 'Supernatural'],
      coverImage: {
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx12345.jpg',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/12345.jpg',
      startDate: { year: 2021, month: 12, day: 5 },
      endDate: { year: 2022, month: 2, day: 13 },
    };

    const { anime, genres } = anilistService.formatForSupabase(mockMedia);

    expect(anime.name).toBe('Demon Slayer: Kimetsu no Yaiba Entertainment District Arc');
    expect(anime.title_romaji).toBe('Kimetsu no Yaiba: Yuukaku-hen');
    expect(anime.title_native).toBe('鬼滅の刃 遊郭編');
    expect(anime.slug).toBe('demon-slayer-kimetsu-no-yaiba-entertainment-district-arc');
    expect(anime.status).toBe('finalizado');
    expect(anime.episodes).toBe(11);
    expect(anime.anilist_id).toBe(12345);
    expect(anime.season_year).toBe(2021);
    expect(anime.start_date).toBe('2021-12-05');
    expect(anime.end_date).toBe('2022-02-13');
    expect(genres).toEqual(['Action', 'Fantasy', 'Supernatural']);
  });
});
