import { describe, it, expect } from 'vitest';
import { normalizeServer, sanitizeEmbedUrl } from '../src/scrapers/serverParsers.js';

describe('Server Parsers & Normalizer', () => {
  describe('sanitizeEmbedUrl', () => {
    it('should prepend https: to protocol-relative URLs', () => {
      const url = '//streamwish.to/e/abc123xyz';
      const sanitized = sanitizeEmbedUrl(url);
      expect(sanitized).toBe('https://streamwish.to/e/abc123xyz');
    });

    it('should reject javascript: injection attempts', () => {
      const url = 'javascript:alert(1)';
      const sanitized = sanitizeEmbedUrl(url);
      expect(sanitized).toBeNull();
    });

    it('should reject invalid non-HTTP URLs', () => {
      const url = 'file:///etc/passwd';
      const sanitized = sanitizeEmbedUrl(url);
      expect(sanitized).toBeNull();
    });

    it('should reject localhost and loopback IP SSRF attempts', () => {
      expect(sanitizeEmbedUrl('http://localhost:8080/embed')).toBeNull();
      expect(sanitizeEmbedUrl('http://127.0.0.1:3000/embed')).toBeNull();
      expect(sanitizeEmbedUrl('http://127.0.0.2/embed')).toBeNull();
      expect(sanitizeEmbedUrl('http://[::1]:8080/embed')).toBeNull();
    });

    it('should reject private network IP (RFC 1918) SSRF attempts', () => {
      expect(sanitizeEmbedUrl('http://10.0.0.1/video.mp4')).toBeNull();
      expect(sanitizeEmbedUrl('http://192.168.1.100/video.mp4')).toBeNull();
      expect(sanitizeEmbedUrl('http://172.16.0.5/video.mp4')).toBeNull();
    });

    it('should reject AWS / cloud metadata service IP SSRF attempts', () => {
      expect(sanitizeEmbedUrl('http://169.254.169.254/latest/meta-data/')).toBeNull();
    });

    it('should accept valid https URLs', () => {
      const url = 'https://mega.nz/embed/abcdef';
      const sanitized = sanitizeEmbedUrl(url);
      expect(sanitized).toBe('https://mega.nz/embed/abcdef');
    });
  });

  describe('normalizeServer', () => {
    it('should correctly identify Mega provider with priority 10 and 1080p quality', () => {
      const server = normalizeServer('https://mega.nz/embed/abc123');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('mega');
      expect(server?.server_name).toBe('Mega');
      expect(server?.priority).toBe(10);
      expect(server?.quality).toBe('1080p');
      expect(server?.language).toBe('sub');
      expect(server?.is_active).toBe(true);
    });

    it('should correctly identify StreamWish provider with priority 20', () => {
      const server = normalizeServer('https://wishembed.pro/e/test456', 'StreamWish');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('streamwish');
      expect(server?.server_name).toBe('StreamWish');
      expect(server?.priority).toBe(20);
      expect(server?.is_active).toBe(true);
    });

    it('should correctly identify FileMoon provider with priority 30', () => {
      const server = normalizeServer('https://filemoon.sx/e/xyz789');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('filemoon');
      expect(server?.server_name).toBe('FileMoon');
      expect(server?.priority).toBe(30);
      expect(server?.is_active).toBe(true);
    });

    it('should correctly identify Streamtape provider with priority 40', () => {
      const server = normalizeServer('https://streamtape.com/e/tape123');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('streamtape');
      expect(server?.server_name).toBe('Streamtape');
      expect(server?.priority).toBe(40);
      expect(server?.is_active).toBe(true);
    });

    it('should correctly identify Mp4Upload provider with priority 50', () => {
      const server = normalizeServer('https://www.mp4upload.com/embed-test.html');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('mp4upload');
      expect(server?.server_name).toBe('Mp4Upload');
      expect(server?.priority).toBe(50);
      expect(server?.is_active).toBe(true);
    });

    it('should quarantine custom/unknown domains with is_active = false for review', () => {
      const server = normalizeServer('https://custom-host.tv/embed/video1', 'CustomHost');
      expect(server).not.toBeNull();
      expect(server?.provider).toBe('custom-host');
      expect(server?.server_name).toBe('CustomHost');
      expect(server?.priority).toBe(100);
      expect(server?.is_active).toBe(false);
    });

    it('should support dub stream language flag', () => {
      const server = normalizeServer('https://mega.nz/embed/abc123', 'Mega', 'dub');
      expect(server).not.toBeNull();
      expect(server?.language).toBe('dub');
      expect(server?.is_active).toBe(true);
    });
  });
});
