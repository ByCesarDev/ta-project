import { describe, it, expect, beforeEach } from 'vitest';
import { reactionService } from '../src/services/reaction.service.js';
import { savedEpisodeService } from '../src/services/savedEpisode.service.js';
import { getTursoClient, initTursoDatabase } from '../src/config/turso.js';

describe('ReactionService & SavedEpisodeService (Turso)', () => {
  beforeEach(async () => {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.batch([
      `DELETE FROM episode_reactions`,
      `DELETE FROM episode_reaction_stats`,
      `DELETE FROM user_saved_episodes`,
    ], 'write');
  });

  it('handles likes and dislikes count and user state', async () => {
    const epId = 501;

    // Initial state
    const initial = await reactionService.getEpisodeReactions(epId, 'user-a');
    expect(initial.likes).toBe(0);
    expect(initial.dislikes).toBe(0);
    expect(initial.user_reaction).toBe(null);

    // User A likes
    const afterLike = await reactionService.setEpisodeReaction(epId, 'user-a', 'like');
    expect(afterLike.likes).toBe(1);
    expect(afterLike.dislikes).toBe(0);
    expect(afterLike.user_reaction).toBe('like');

    // User B dislikes
    const afterB = await reactionService.setEpisodeReaction(epId, 'user-b', 'dislike');
    expect(afterB.likes).toBe(1);
    expect(afterB.dislikes).toBe(1);

    // User A switches from like to dislike
    const afterSwitch = await reactionService.setEpisodeReaction(epId, 'user-a', 'dislike');
    expect(afterSwitch.likes).toBe(0);
    expect(afterSwitch.dislikes).toBe(2);
    expect(afterSwitch.user_reaction).toBe('dislike');

    // User A un-dislikes (toggle off)
    const afterToggleOff = await reactionService.setEpisodeReaction(epId, 'user-a', 'dislike');
    expect(afterToggleOff.likes).toBe(0);
    expect(afterToggleOff.dislikes).toBe(1);
    expect(afterToggleOff.user_reaction).toBe(null);
  });

  it('saves and retrieves episodes for user watchlist', async () => {
    const userId = 'user-fav-1';
    const epId = 777;

    const notSaved = await savedEpisodeService.isEpisodeSaved(userId, epId);
    expect(notSaved).toBe(false);

    // Save episode
    const saveRes = await savedEpisodeService.toggleSavedEpisode(userId, epId, {
      animeSlug: 'seven-deadly-sins',
      animeTitle: 'The Seven Deadly Sins',
      episodeNumber: 2,
      episodeTitle: 'El inicio de una aventura',
      duration: '24 min',
      thumbnail: 'https://img.totalanime.com/ep2.jpg',
    });
    expect(saveRes.is_saved).toBe(true);

    const isSaved = await savedEpisodeService.isEpisodeSaved(userId, epId);
    expect(isSaved).toBe(true);

    const list = await savedEpisodeService.getSavedEpisodes(userId);
    expect(list.length).toBe(1);
    expect(list[0].episode_id).toBe(epId);
    expect(list[0].anime_title).toBe('The Seven Deadly Sins');
    expect(list[0].episode_title).toBe('El inicio de una aventura');

    // Toggle off
    const unSaveRes = await savedEpisodeService.toggleSavedEpisode(userId, epId, {
      animeSlug: 'seven-deadly-sins',
      animeTitle: 'The Seven Deadly Sins',
      episodeNumber: 2,
    });
    expect(unSaveRes.is_saved).toBe(false);

    const emptyList = await savedEpisodeService.getSavedEpisodes(userId);
    expect(emptyList.length).toBe(0);
  });
});
