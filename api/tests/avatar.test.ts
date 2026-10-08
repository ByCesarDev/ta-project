import { describe, it, expect, vi, beforeEach } from 'vitest';
import { avatarService } from '../src/services/avatar.service.js';
import { supabaseAdmin } from '../src/config/supabaseAdmin.js';

vi.mock('../src/config/supabaseAdmin.js', () => {
  return {
    supabaseAdmin: {
      storage: {
        from: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

describe('AvatarService - Privacy Proxy & Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvatarImage (Privacy Proxy)', () => {
    it('should reject invalid filenames with path traversal attempts', async () => {
      await expect(avatarService.getAvatarImage('../../../etc/passwd')).rejects.toThrow();
    });

    it('should fetch and return buffer for existing avatar in storage bucket', async () => {
      const mockBuffer = Buffer.from('fake-image-bytes');
      const mockBlob = {
        arrayBuffer: async () => mockBuffer.buffer,
      };

      (supabaseAdmin.storage.from as any).mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: mockBlob,
          error: null,
        }),
      });

      const result = await avatarService.getAvatarImage('user-1.jpeg');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should fallback to default-avatar.png if requested avatar is not found', async () => {
      const defaultBuffer = Buffer.from('default-image-bytes');
      const defaultBlob = {
        arrayBuffer: async () => defaultBuffer.buffer,
      };

      const downloadMock = vi
        .fn()
        .mockResolvedValueOnce({ data: null, error: new Error('Object not found') })
        .mockResolvedValueOnce({ data: defaultBlob, error: null });

      (supabaseAdmin.storage.from as any).mockReturnValue({
        download: downloadMock,
      });

      const result = await avatarService.getAvatarImage('non-existent.png');
      expect(result.contentType).toBe('image/png');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('listAvatars', () => {
    it('should return avatars formatted with proxy URLs', async () => {
      const mockAvatars = [
        { id: 1, filename: 'default-avatar.png', is_default: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
        { id: 2, filename: 'user-1.jpeg', is_default: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ];

      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockAvatars, error: null }),
          }),
        }),
      });

      const list = await avatarService.listAvatars();
      expect(list).toHaveLength(2);
      expect(list[0].url).toBe('/api/v1/avatars/default-avatar.png');
      expect(list[0].is_default).toBe(true);
      expect(list[1].url).toBe('/api/v1/avatars/user-1.jpeg');
    });
  });

  describe('deleteAvatar', () => {
    it('should reject deleting the default avatar', async () => {
      (supabaseAdmin.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 1, filename: 'default-avatar.png', is_default: true },
              error: null,
            }),
          }),
        }),
      });

      await expect(avatarService.deleteAvatar(1)).rejects.toThrow(
        'No se puede eliminar el avatar predeterminado del sistema'
      );
    });

    it('should delete storage file and database record for non-default avatars', async () => {
      const removeMock = vi.fn().mockResolvedValue({ error: null });
      (supabaseAdmin.storage.from as any).mockReturnValue({
        remove: removeMock,
      });

      const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
      (supabaseAdmin.from as any).mockImplementation((table: string) => {
        if (table === 'avatars') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 2, filename: 'custom-user.png', is_default: false },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: deleteEqMock,
            }),
          };
        }
        return {};
      });

      const result = await avatarService.deleteAvatar(2);
      expect(result.success).toBe(true);
      expect(removeMock).toHaveBeenCalledWith(['custom-user.png']);
      expect(deleteEqMock).toHaveBeenCalledWith('id', 2);
    });
  });
});
