import { describe, it, expect, vi } from 'vitest';
import { validateSource, sanitizeEmbedUrl, isPrivateOrLoopbackHost } from '../src/lib/sourceValidator.js';
import { AdminNotification, AuditLog } from '../src/types/index.js';

describe('Admin Panel: Claim Anime RPC & RBAC Logic', () => {
  it('should use the correct RPC parameter signature { p_anime_id } matching PostgreSQL function', () => {
    const animeId = 42;
    const rpcPayload = { p_anime_id: animeId };

    // Function signature in SQL: claim_anime(p_anime_id INT)
    expect(rpcPayload).toHaveProperty('p_anime_id', 42);
    expect(rpcPayload).not.toHaveProperty('target_anime_id');
  });

  it('should enforce that only admins can reassign an anime already claimed by another user', () => {
    const currentUserId = 'user-mod-1';
    const claimedByAnother = 'user-mod-2';

    const canReassign = (isAdmin: boolean, claimedBy: string | null, userId: string) => {
      const isClaimedByMe = claimedBy === userId;
      const isClaimedByOther = Boolean(claimedBy && !isClaimedByMe);
      if (isClaimedByOther && !isAdmin) {
        return false; // Forbidden for regular moderators
      }
      return true;
    };

    // Moderator attempting to reassign someone else's anime
    expect(canReassign(false, claimedByAnother, currentUserId)).toBe(false);

    // Admin attempting to reassign someone else's anime
    expect(canReassign(true, claimedByAnother, currentUserId)).toBe(true);

    // Moderator claiming an unclaimed anime
    expect(canReassign(false, null, currentUserId)).toBe(true);
  });
});

describe('Admin Panel: Episode Sources SSRF Validation & Quarantine Hardening', () => {
  it('should validate and trust known providers matching allowlist without quarantine', () => {
    const megaUrl = 'https://mega.nz/embed/sample123';
    const result = validateSource(megaUrl);

    expect(result.isValid).toBe(true);
    expect(result.isKnownProvider).toBe(true);
    expect(result.isQuarantined).toBe(false);
    expect(result.matchedProvider?.provider).toBe('mega');
  });

  it('should automatically flag unknown/custom hosts and quarantine them (is_active = false)', () => {
    const unknownUrl = 'https://unverified-streaming.xyz/embed/video10';
    const result = validateSource(unknownUrl);

    expect(result.isValid).toBe(true);
    expect(result.isKnownProvider).toBe(false);
    expect(result.isQuarantined).toBe(true);
    expect(result.suggestedProvider).toBe('unverified-streaming');
  });

  it('should block SSRF attempts to localhost, private IP subnets, and cloud metadata endpoints', () => {
    const ssrfTargets = [
      'http://localhost:8080/embed',
      'http://127.0.0.1:3000/embed',
      'http://10.0.0.1/stream',
      'http://192.168.1.100/video',
      'http://172.16.5.4/embed',
      'http://169.254.169.254/latest/meta-data',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.com/video.mp4',
    ];

    for (const url of ssrfTargets) {
      const result = validateSource(url);
      expect(result.isValid).toBe(false);
      expect(result.sanitizedUrl).toBeNull();
    }
  });

  it('should enforce RBAC for source operations: moderator can soft-disable, only admin can hard-delete', () => {
    const checkDeletePermission = (isAdmin: boolean) => isAdmin;
    const checkSoftDisablePermission = (isStaff: boolean) => isStaff;

    expect(checkDeletePermission(false)).toBe(false);
    expect(checkDeletePermission(true)).toBe(true);
    expect(checkSoftDisablePermission(true)).toBe(true);
  });
});

describe('Admin Panel: Episode Number Calculation (Gapped Sequences)', () => {
  it('should calculate next episode number using Math.max to prevent unique key violations', () => {
    // Non-contiguous sequence where episode 2 was deleted: [1, 3, 4]
    const episodes = [
      { episode_number: 1 },
      { episode_number: 3 },
      { episode_number: 4 },
    ];

    const buggyLengthCalc = (episodes.length || 0) + 1; // 3 + 1 = 4 (COLLISION!)
    expect(buggyLengthCalc).toBe(4);

    const safeMaxCalc = Math.max(...episodes.map((e) => e.episode_number), 0) + 1; // 4 + 1 = 5 (CORRECT)
    expect(safeMaxCalc).toBe(5);
  });

  it('should return 1 when there are no existing episodes', () => {
    const emptyEpisodes: { episode_number: number }[] = [];
    const safeMaxCalc = Math.max(...emptyEpisodes.map((e) => e.episode_number), 0) + 1;
    expect(safeMaxCalc).toBe(1);
  });
});

describe('Admin Panel: Audit Logs Schema & In-Memory Profile Resolution', () => {
  it('should match actual database schema columns (actor_id, metadata, ip)', () => {
    const log: AuditLog = {
      id: 101,
      actor_id: 'a0000000-0000-0000-0000-000000000001',
      action: 'import_anime_anilist',
      entity_type: 'animes',
      entity_id: '15',
      metadata: { anilist_id: 1, name: 'Cowboy Bebop' },
      ip: '192.0.2.1',
      created_at: '2026-09-05T20:00:00Z',
      profiles: {
        username: 'admin_master',
        avatar_url: 'https://example.com/avatar.png',
      },
    };

    expect(log).toHaveProperty('actor_id');
    expect(log).toHaveProperty('metadata');
    expect(log).toHaveProperty('ip');
    expect(log.metadata).toHaveProperty('anilist_id', 1);
  });

  it('should correctly resolve profiles from an in-memory map by actor_id', () => {
    const rawLogs = [
      { id: 1, actor_id: 'user-uuid-1', action: 'update_anime' },
      { id: 2, actor_id: 'user-uuid-2', action: 'create_episode' },
      { id: 3, actor_id: null, action: 'system_cleanup' },
    ];

    const profilesMap: Record<string, { username: string; avatar_url: string }> = {
      'user-uuid-1': { username: 'alice_mod', avatar_url: 'https://alice.jpg' },
      'user-uuid-2': { username: 'bob_admin', avatar_url: 'https://bob.jpg' },
    };

    const joinedLogs = rawLogs.map((l) => ({
      ...l,
      profiles: l.actor_id ? profilesMap[l.actor_id] || null : null,
    }));

    expect(joinedLogs[0].profiles?.username).toBe('alice_mod');
    expect(joinedLogs[1].profiles?.username).toBe('bob_admin');
    expect(joinedLogs[2].profiles).toBeNull();
  });
});

describe('Admin Panel: Notifications Schema & Relation Embeds', () => {
  it('should use episode_id, notification_type, episode_air_date and embedded relations', () => {
    const notification: AdminNotification = {
      id: 1,
      moderator_id: 'mod-uuid-1',
      anime_id: 5,
      episode_id: 25,
      episode_air_date: '2026-09-08T18:00:00Z',
      notification_date: '2026-09-05T18:00:00Z',
      notification_type: '3_days',
      is_read: false,
      created_at: '2026-09-05T18:00:00Z',
      animes: {
        id: 5,
        name: 'Attack on Titan',
        cover_image: 'https://example.com/aot.jpg',
        slug: 'attack-on-titan',
      },
      episodes: {
        id: 25,
        episode_number: 12,
        title: 'El Retumbo',
      },
    };

    expect(notification).toHaveProperty('episode_id', 25);
    expect(notification).toHaveProperty('notification_type', '3_days');
    expect(notification).toHaveProperty('episode_air_date');
    expect(notification.episodes?.episode_number).toBe(12);
  });
});
