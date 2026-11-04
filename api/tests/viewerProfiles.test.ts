import { describe, it, expect, beforeEach } from 'vitest';
import { viewerProfileService } from '../src/services/viewerProfile.service.js';
import { reactionService } from '../src/services/reaction.service.js';
import { savedEpisodeService } from '../src/services/savedEpisode.service.js';
import { getTursoClient, initTursoDatabase } from '../src/config/turso.js';

describe('ViewerProfileService & Multi-profile Isolation', () => {
  const testAccount = 'test-account-123';
  const otherAccount = 'other-account-999';

  beforeEach(async () => {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.batch([
      {
        sql: `DELETE FROM viewer_profiles WHERE account_id IN (?, ?)`,
        args: [testAccount, otherAccount],
      },
      {
        sql: `DELETE FROM user_saved_episodes WHERE episode_id IN (8881, 8882) OR user_id IN (?, ?)`,
        args: [testAccount, otherAccount],
      },
      {
        sql: `DELETE FROM episode_reactions WHERE episode_id IN (8881, 8882) OR user_id IN (?, ?)`,
        args: [testAccount, otherAccount],
      },
      {
        sql: `DELETE FROM episode_reaction_stats WHERE episode_id IN (8881, 8882)`,
        args: [],
      },
    ], 'write');
  });

  it('automatically provisions a default profile for a new account', async () => {
    const profiles = await viewerProfileService.getProfilesByAccount(testAccount);
    expect(profiles.length).toBe(1);
    expect(profiles[0].is_default).toBe(true);
    expect(profiles[0].account_id).toBe(testAccount);
  });

  it('allows creating secondary profiles up to maximum of 5', async () => {
    await viewerProfileService.ensureDefaultProfile(testAccount);
    const p2 = await viewerProfileService.createProfile(testAccount, { name: 'Nelis' });
    const p3 = await viewerProfileService.createProfile(testAccount, { name: 'Hermano' });
    const p4 = await viewerProfileService.createProfile(testAccount, { name: 'Invitado' });
    const p5 = await viewerProfileService.createProfile(testAccount, { name: 'Anime Lover' });

    expect(p2.name).toBe('Nelis');
    expect(p2.is_default).toBe(false);

    const all = await viewerProfileService.getProfilesByAccount(testAccount);
    expect(all.length).toBe(5);

    // 6th profile should be rejected
    await expect(
      viewerProfileService.createProfile(testAccount, { name: 'Extra Profile' })
    ).rejects.toThrow(/máximo 5 perfiles/);
  });

  it('prevents deleting the default profile but allows deleting secondary profiles', async () => {
    const defaultProfile = await viewerProfileService.ensureDefaultProfile(testAccount);
    await expect(
      viewerProfileService.deleteProfile(defaultProfile.id, testAccount)
    ).rejects.toThrow(/No es posible eliminar el perfil principal/);

    const secondary = await viewerProfileService.createProfile(testAccount, { name: 'Temporal' });
    await viewerProfileService.deleteProfile(secondary.id, testAccount);

    const all = await viewerProfileService.getProfilesByAccount(testAccount);
    expect(all.find((p) => p.id === secondary.id)).toBeUndefined();
  });

  it('enforces that profiles from another account cannot be viewed or edited', async () => {
    const otherProfile = await viewerProfileService.createProfile(otherAccount, { name: 'Secret' });

    const accessedByTest = await viewerProfileService.getProfileById(otherProfile.id, testAccount);
    expect(accessedByTest).toBeNull();

    await expect(
      viewerProfileService.updateProfile(otherProfile.id, testAccount, { name: 'Hacked' })
    ).rejects.toThrow(/no tienes permiso/);
  });

  it('isolates saved episodes between Profile A and Profile B in the same account', async () => {
    const profileA = await viewerProfileService.ensureDefaultProfile(testAccount);
    const profileB = await viewerProfileService.createProfile(testAccount, { name: 'Nelis' });

    const epId = 8881;

    // Profile A saves the episode
    await savedEpisodeService.toggleSavedEpisode(
      testAccount,
      epId,
      {
        animeSlug: 'test-anime',
        animeTitle: 'Test Anime',
        episodeNumber: 1,
      },
      profileA.id
    );

    // Profile A has 1 saved episode
    const listA = await savedEpisodeService.getSavedEpisodes(testAccount, profileA.id);
    expect(listA.length).toBe(1);
    expect(listA[0].episode_id).toBe(epId);

    // Profile B has 0 saved episodes
    const listB = await savedEpisodeService.getSavedEpisodes(testAccount, profileB.id);
    expect(listB.length).toBe(0);

    // Check query isolation
    expect(await savedEpisodeService.isEpisodeSaved(testAccount, epId, profileA.id)).toBe(true);
    expect(await savedEpisodeService.isEpisodeSaved(testAccount, epId, profileB.id)).toBe(false);
  });

  it('isolates episode like/dislike state between Profile A and Profile B while aggregating global counts', async () => {
    const profileA = await viewerProfileService.ensureDefaultProfile(testAccount);
    const profileB = await viewerProfileService.createProfile(testAccount, { name: 'Nelis' });

    const epId = 8882;

    // Profile A likes
    const resA = await reactionService.setEpisodeReaction(epId, testAccount, 'like', profileA.id);
    expect(resA.likes).toBe(1);
    expect(resA.user_reaction).toBe('like');

    // Profile B checks status: global likes = 1, but user_reaction for B is null!
    const statsForB = await reactionService.getEpisodeReactions(epId, testAccount, profileB.id);
    expect(statsForB.likes).toBe(1);
    expect(statsForB.user_reaction).toBe(null);

    // Profile B dislikes: global likes = 1, dislikes = 1!
    const resB = await reactionService.setEpisodeReaction(epId, testAccount, 'dislike', profileB.id);
    expect(resB.likes).toBe(1);
    expect(resB.dislikes).toBe(1);
    expect(resB.user_reaction).toBe('dislike');

    // Profile A status is still 'like'!
    const statsForA = await reactionService.getEpisodeReactions(epId, testAccount, profileA.id);
    expect(statsForA.likes).toBe(1);
    expect(statsForA.dislikes).toBe(1);
    expect(statsForA.user_reaction).toBe('like');
  });

  it('correctly persists and retrieves bio across createProfile, updateProfile and getProfilesByAccount', async () => {
    // 1. Create secondary profile with bio
    const initialBio = 'Amante del anime shonen y del rock japonés.';
    const created = await viewerProfileService.createProfile(testAccount, {
      name: 'Nelis',
      username: 'nelis_bio',
      bio: initialBio,
    });
    expect(created.bio).toBe(initialBio);

    // 2. Fetch via getProfileById -> bio must be present
    const byId = await viewerProfileService.getProfileById(created.id, testAccount);
    expect(byId?.bio).toBe(initialBio);

    // 3. Fetch via getProfilesByAccount -> bio must be present in the list
    const list1 = await viewerProfileService.getProfilesByAccount(testAccount);
    const nelis1 = list1.find((p) => p.id === created.id);
    expect(nelis1).toBeDefined();
    expect(nelis1?.bio).toBe(initialBio);

    // 4. Update bio to new content
    const updatedBio = 'Actualización: ahora viendo romances y slice of life.';
    const updated = await viewerProfileService.updateProfile(created.id, testAccount, {
      bio: updatedBio,
    });
    expect(updated.bio).toBe(updatedBio);

    // 5. Re-fetch via getProfilesByAccount -> updated bio must persist
    const list2 = await viewerProfileService.getProfilesByAccount(testAccount);
    const nelis2 = list2.find((p) => p.id === created.id);
    expect(nelis2?.bio).toBe(updatedBio);

    // 6. Clear bio (empty string) -> should be persisted as null
    const cleared = await viewerProfileService.updateProfile(created.id, testAccount, {
      bio: '',
    });
    expect(cleared.bio).toBe(null);

    const list3 = await viewerProfileService.getProfilesByAccount(testAccount);
    const nelis3 = list3.find((p) => p.id === created.id);
    expect(nelis3?.bio).toBe(null);
  });
});
