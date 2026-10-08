import { spawn } from 'child_process';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { streamResolverService } from './streamResolver.service.js';

export interface ThumbnailGenerationResult {
  success: boolean;
  episode_id: number;
  thumbnail_url?: string;
  filename?: string;
  error?: string;
}

export class ThumbnailService {
  /**
   * Generates a random timestamp formatted as HH:MM:SS within the middle portion of the video
   * (e.g. between 15% and 65% of the duration, or between 180s and 450s to avoid intros/black screens)
   */
  public getRandomTimestamp(durationSeconds?: number | null): string {
    let targetSec: number;

    if (durationSeconds && durationSeconds > 120) {
      // Pick random second between 15% and 65% of total video duration
      const minSec = Math.floor(durationSeconds * 0.15);
      const maxSec = Math.floor(durationSeconds * 0.65);
      targetSec = Math.floor(minSec + Math.random() * (maxSec - minSec));
    } else {
      // Standard anime episode (20-25 mins): pick between 3m and 8m (180s - 480s)
      targetSec = Math.floor(180 + Math.random() * 300);
    }

    const hours = Math.floor(targetSec / 3600);
    const minutes = Math.floor((targetSec % 3600) / 60);
    const seconds = targetSec % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Spawns ffmpeg to extract a single video frame from an HLS or MP4 stream directly into a Buffer.
   */
  public async extractFrameFromStream(
    streamUrl: string,
    timestamp: string = '00:03:30',
    headers?: Record<string, string>
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const ffmpegArgs: string[] = [
        '-hide_banner',
        '-loglevel', 'error',
        '-ss', timestamp, // Fast seek before input
      ];

      // Attach custom HTTP headers if provided (Referer, User-Agent)
      if (headers) {
        const headerStr = Object.entries(headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n');
        if (headerStr) {
          ffmpegArgs.push('-headers', headerStr);
        }
      }

      ffmpegArgs.push(
        '-i', streamUrl,
        '-frames:v', '1',
        '-vf', 'scale=640:360:force_original_aspect_ratio=increase,crop=640:360',
        '-q:v', '2', // High quality JPEG
        '-f', 'image2',
        'pipe:1'
      );

      const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      ffmpegProcess.stdout.on('data', (chunk: Buffer) => {
        stdoutChunks.push(chunk);
      });

      ffmpegProcess.stderr.on('data', (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      // 15 seconds timeout to prevent hanging on slow network streams
      const timeout = setTimeout(() => {
        ffmpegProcess.kill('SIGKILL');
        reject(new Error('FFmpeg timeout al capturar fotograma (15s excedidos)'));
      }, 15000);

      ffmpegProcess.on('close', (code) => {
        clearTimeout(timeout);
        const resultBuffer = Buffer.concat(stdoutChunks);

        if (code === 0 && resultBuffer.length > 500) {
          resolve(resultBuffer);
        } else {
          const stderrMsg = Buffer.concat(stderrChunks).toString('utf-8');
          reject(new Error(`FFmpeg falló con código ${code}: ${stderrMsg || 'No se pudo generar buffer de imagen'}`));
        }
      });

      ffmpegProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Generates and uploads a dynamic frame thumbnail for a specific episode.
   */
  public async generateEpisodeThumbnail(episodeId: number): Promise<ThumbnailGenerationResult> {
    try {
      // 1. Fetch episode data
      const { data: episode, error: epError } = await supabaseAdmin
        .from('episodes')
        .select('id, anime_id, episode_number, duration, thumbnail, animes(slug, name, cover_image)')
        .eq('id', episodeId)
        .single();

      if (epError || !episode) {
        throw new Error(`Episodio no encontrado (ID: ${episodeId})`);
      }

      // 2. Fetch active sources for this episode
      const { data: sources, error: srcError } = await supabaseAdmin
        .from('episode_sources')
        .select('*')
        .eq('episode_id', episodeId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (srcError || !sources || sources.length === 0) {
        throw new Error(`No hay servidores de video activos para el episodio ${episode.episode_number}`);
      }

      let frameBuffer: Buffer | null = null;
      let lastError: string = '';

      // 3. Try resolving each active source until a valid frame is captured
      for (const source of sources) {
        try {
          const playable = await streamResolverService.resolveSource(source);

          if (playable.type === 'hls' || playable.type === 'mp4' || (playable.direct_url && !playable.direct_url.includes('iframe'))) {
            const streamUrl = playable.direct_url || playable.url;
            const timestamp = this.getRandomTimestamp(episode.duration);

            try {
              frameBuffer = await this.extractFrameFromStream(streamUrl, timestamp, playable.headers);
            } catch (err: any) {
              // Retry with safe 60s fallback timestamp
              frameBuffer = await this.extractFrameFromStream(streamUrl, '00:01:30', playable.headers);
            }

            if (frameBuffer && frameBuffer.length > 500) {
              break; // Successfully captured frame!
            }
          }
        } catch (err: any) {
          lastError = err.message || 'Error resolviendo stream';
          continue;
        }
      }

      if (!frameBuffer) {
        throw new Error(`No se pudo capturar fotograma de los servidores disponibles: ${lastError}`);
      }

      // 4. Upload thumbnail to Supabase Storage bucket 'thumbnails'
      const animeSlug = (episode.animes as any)?.slug || `anime-${episode.anime_id}`;
      const uniqueFilename = `${animeSlug}/ep-${episode.episode_number}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('thumbnails')
        .upload(uniqueFilename, frameBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error al subir thumbnail a Storage: ${uploadError.message}`);
      }

      // 5. Get public storage URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('thumbnails')
        .getPublicUrl(uniqueFilename);

      const thumbnailUrl = publicUrlData.publicUrl;

      // 6. Update episode row in database
      const { error: updateError } = await supabaseAdmin
        .from('episodes')
        .update({
          thumbnail: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', episodeId);

      if (updateError) {
        throw new Error(`Error al actualizar thumbnail en la base de datos: ${updateError.message}`);
      }

      return {
        success: true,
        episode_id: episodeId,
        thumbnail_url: thumbnailUrl,
        filename: uniqueFilename,
      };
    } catch (err: any) {
      return {
        success: false,
        episode_id: episodeId,
        error: err.message || 'Error desconocido generando thumbnail',
      };
    }
  }

  /**
   * Bulk generates thumbnails for all available episodes of an anime.
   */
  public async generateAnimeThumbnailsBulk(animeId: number): Promise<{
    total: number;
    successCount: number;
    failedCount: number;
    results: ThumbnailGenerationResult[];
  }> {
    const { data: episodes, error } = await supabaseAdmin
      .from('episodes')
      .select('id, episode_number')
      .eq('anime_id', animeId)
      .order('episode_number', { ascending: true });

    if (error || !episodes) {
      throw new Error(`Error al listar episodios para el anime ${animeId}: ${error?.message}`);
    }

    const results: ThumbnailGenerationResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const ep of episodes) {
      const res = await this.generateEpisodeThumbnail(ep.id);
      results.push(res);
      if (res.success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    return {
      total: episodes.length,
      successCount,
      failedCount,
      results,
    };
  }
}

export const thumbnailService = new ThumbnailService();
