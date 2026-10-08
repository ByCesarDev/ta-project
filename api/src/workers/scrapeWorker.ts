import axios from 'axios';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { env } from '../config/env.js';
import { jobsService } from '../services/jobs.service.js';
import { videoScraper } from '../scrapers/videoScraper.service.js';
import { ScrapeJob, ScrapedServer } from '../types/index.js';

/**
 * Validates actual HLS playback by downloading and inspecting the master playlist,
 * resolving child playlists, and verifying the first media segment with a bounded byte request.
 */
export async function validateHlsPlayback(streamUrl: string): Promise<boolean> {
  if (!streamUrl) return false;
  const cleanUrl = streamUrl.split('#')[0];
  if (!cleanUrl) return false;

  try {
    // 1. Fetch master manifest
    const masterRes = await axios.get(cleanUrl, {
      timeout: 5000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      responseType: 'text',
      validateStatus: (status) => status < 400,
    });

    if (!masterRes.data || typeof masterRes.data !== 'string' || !masterRes.data.includes('#EXTM3U')) {
      return false;
    }

    let childPlaylistUrl = cleanUrl;
    const lines = masterRes.data
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean);

    // If master is multivariant, resolve the first child playlist
    if (masterRes.data.includes('#EXT-X-STREAM-INF')) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF') && i + 1 < lines.length) {
          const target = lines[i + 1];
          if (!target.startsWith('#')) {
            childPlaylistUrl = target.startsWith('http') ? target : new URL(target, cleanUrl).href;
            break;
          }
        }
      }

      if (childPlaylistUrl !== cleanUrl) {
        const childRes = await axios.get(childPlaylistUrl, {
          timeout: 5000,
          responseType: 'text',
          validateStatus: (status) => status < 400,
        });
        if (!childRes.data || !childRes.data.includes('#EXTM3U')) {
          return false;
        }
        lines.length = 0;
        lines.push(
          ...childRes.data
            .split(/\r?\n/)
            .map((l: string) => l.trim())
            .filter(Boolean)
        );
      }
    }

    // 2. Find first media segment (.ts, .m4s, .mp4)
    let segmentUrl: string | null = null;
    for (const line of lines) {
      if (
        !line.startsWith('#') &&
        (line.includes('.ts') ||
          line.includes('.m4s') ||
          line.includes('.mp4') ||
          line.includes('segment') ||
          line.includes('fragment') ||
          line.includes('range'))
      ) {
        segmentUrl = line.startsWith('http') ? line : new URL(line, childPlaylistUrl).href;
        break;
      }
    }

    if (!segmentUrl) {
      for (const line of lines) {
        if (!line.startsWith('#')) {
          segmentUrl = line.startsWith('http') ? line : new URL(line, childPlaylistUrl).href;
          break;
        }
      }
    }

    if (!segmentUrl) {
      return true; // Valid master manifest
    }

    // 3. Range request or bounded 2KB fetch on first segment to prove stream chunk accessibility
    const segRes = await axios.get(segmentUrl, {
      timeout: 5000,
      headers: {
        Range: 'bytes=0-2048',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      responseType: 'arraybuffer',
      validateStatus: (status) => status === 200 || status === 206,
    });

    return Boolean(segRes.data && segRes.data.byteLength > 0);
  } catch {
    return false;
  }
}

export class ScrapeWorker {
  private isRunning: boolean = false;
  private shouldStop: boolean = false;
  private pollIntervalMs: number;
  private workerId: string;

  constructor(pollIntervalMs: number = env.WORKER_POLL_INTERVAL_MS) {
    this.pollIntervalMs = pollIntervalMs;
    this.workerId = `worker-${process.pid}-${Math.random().toString(36).substring(2, 8)}`;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.shouldStop = false;

    console.log(
      `[ScrapeWorker] Worker started with ID '${this.workerId}'. Polling every ${this.pollIntervalMs}ms...`
    );

    while (!this.shouldStop) {
      try {
        const job = await jobsService.claimNextPendingJob(this.workerId);
        if (job) {
          console.log(`[ScrapeWorker] Claimed Job ${job.id} for Anime ID: ${job.anime_id}`);
          await this.processJob(job);
        } else {
          await this.sleep(this.pollIntervalMs);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown worker loop error';
        console.error('[ScrapeWorker] Error in polling loop:', message);
        await this.sleep(this.pollIntervalMs);
      }
    }

    this.isRunning = false;
    console.log('[ScrapeWorker] Worker stopped gracefully.');
  }

  public stop(): void {
    console.log('[ScrapeWorker] Stop requested...');
    this.shouldStop = true;
  }

  public async processJob(job: ScrapeJob): Promise<void> {
    const jobLog: Array<{
      level: 'info' | 'scrape' | 'success' | 'warn' | 'error';
      timestamp: string;
      episode_number?: number;
      message: string;
      detail?: string;
      error?: string;
    }> = [];
    let processed = 0;
    let failed = 0;

    try {
      jobLog.push({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: `⚡ Conexión establecida con ScrapeWorker [${this.workerId}]`,
      });

      // 1. Fetch Anime details
      const { data: anime, error: animeError } = await supabaseAdmin
        .from('animes')
        .select('id, name, slug, title_romaji, episodes, source_url, source_id, status')
        .eq('id', job.anime_id)
        .single();

      if (animeError || !anime) {
        throw new Error(`Anime no encontrado con ID ${job.anime_id}: ${animeError?.message}`);
      }

      const snapshotSource = (job.source_config && typeof job.source_config.source_url === 'string')
        ? job.source_config.source_url
        : job.source_url;
      const effectiveSource = (snapshotSource || anime.source_url || anime.slug).trim();
      const targetMode = job.target_mode || 'all';

      jobLog.push({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: `🎬 Iniciando tarea para "${anime.name}" • Modo: ${targetMode.toUpperCase()} • Fuente: ${effectiveSource}`,
      });

      // 2. Inspect source and discover published episodes and all audio variants
      let publishedEpisodes: number[] = [];
      try {
        const preview = await videoScraper.previewSource(effectiveSource);
        if (preview && preview.published_episodes.length > 0) {
          publishedEpisodes = preview.published_episodes;
          const variantLabels = preview.variants.map((v) => v.language_label).join(' • ');
          jobLog.push({
            level: 'info',
            timestamp: new Date().toISOString(),
            message: `🔎 Fuente analizada: ${publishedEpisodes.length} episodios publicados • Variantes: [${variantLabels}]`,
          });
        }
      } catch (prevErr: any) {
        jobLog.push({
          level: 'warn',
          timestamp: new Date().toISOString(),
          message: `⚠️ No se pudo previsualizar la fuente: ${prevErr.message}. Usando listado estándar.`,
        });
      }

      if (publishedEpisodes.length === 0) {
        const epCount = anime.episodes && anime.episodes > 0 ? anime.episodes : 1;
        for (let i = 1; i <= epCount; i++) publishedEpisodes.push(i);
      }

      // 3. Determine target episode numbers according to scope (targetMode)
      let targetEpisodeNumbers: number[] = [];
      if (targetMode === 'single' && typeof job.target_episode_number === 'number') {
        targetEpisodeNumbers = [job.target_episode_number];
      } else if (targetMode === 'pending') {
        // Find existing episodes with active sources
        const { data: epSources } = await supabaseAdmin
          .from('episodes')
          .select('episode_number, episode_sources(id, is_active)')
          .eq('anime_id', anime.id);

        const epsWithSources = new Set<number>();
        if (epSources) {
          for (const ep of epSources) {
            const hasActive = Array.isArray(ep.episode_sources) && ep.episode_sources.some((s: any) => s.is_active);
            if (hasActive) epsWithSources.add(Number(ep.episode_number));
          }
        }
        targetEpisodeNumbers = publishedEpisodes.filter((num) => !epsWithSources.has(num));
        if (targetEpisodeNumbers.length === 0) {
          jobLog.push({
            level: 'info',
            timestamp: new Date().toISOString(),
            message: `✨ Todos los episodios ya cuentan con fuentes activas. Nada que procesar.`,
          });
          await jobsService.finishJob(job.id, this.workerId, 'completed', 0, 0, jobLog);
          return;
        }
      } else {
        // 'all' scope
        targetEpisodeNumbers = publishedEpisodes;
      }

      // 4. Ensure target episodes exist in the database (auto-create missing rows)
      const { data: existingEpisodes } = await supabaseAdmin
        .from('episodes')
        .select('id, episode_number')
        .eq('anime_id', anime.id);

      const existingEpMap = new Map<number, number>();
      if (existingEpisodes) {
        for (const ep of existingEpisodes) {
          existingEpMap.set(Number(ep.episode_number), ep.id);
        }
      }

      const episodesToProcess: Array<{ id: number; episode_number: number }> = [];

      for (const num of targetEpisodeNumbers) {
        if (existingEpMap.has(num)) {
          episodesToProcess.push({ id: existingEpMap.get(num)!, episode_number: num });
        } else {
          // Insert missing episode row
          const { data: newEp, error: insErr } = await supabaseAdmin
            .from('episodes')
            .insert({
              anime_id: anime.id,
              episode_number: num,
              title: `Episodio ${num}`,
              status: 'pending',
              views: 0,
            })
            .select('id, episode_number')
            .single();

          if (!insErr && newEp) {
            episodesToProcess.push({ id: newEp.id, episode_number: num });
            existingEpMap.set(num, newEp.id);
          }
        }
      }

      jobLog.push({
        level: 'info',
        timestamp: new Date().toISOString(),
        message: `📋 Procesando ${episodesToProcess.length} episodios seleccionados...`,
      });

      // 5. Process each target episode
      for (const ep of episodesToProcess) {
        if (this.shouldStop) {
          jobLog.push({
            level: 'warn',
            timestamp: new Date().toISOString(),
            message: `🛑 Tarea interrumpida por señal de apagado del worker`,
          });
          break;
        }

        // Fencing check: ensure worker still owns lease
        const isLeaseValid = await jobsService.updateHeartbeat(job.id, this.workerId);
        if (!isLeaseValid) {
          jobLog.push({
            level: 'warn',
            timestamp: new Date().toISOString(),
            message: `⚠️ Pérdida de lease o bloqueo por otro worker para el Job ${job.id}. Abortando procesamiento.`,
          });
          return;
        }

        try {
          // Resolve any explicit source episode mapping from snapshot
          const offsetMap = job.source_config?.episode_offset_map;
          const sourceEpNum = offsetMap && offsetMap[String(ep.episode_number)] !== undefined
            ? offsetMap[String(ep.episode_number)]
            : ep.episode_number;

          // Extract all available audio versions for this episode
          const rawServers = await videoScraper.scrapeAllEpisodeServers(effectiveSource, sourceEpNum);

          if (rawServers.length === 0) {
            failed++;
            jobLog.push({
              level: 'warn',
              episode_number: ep.episode_number,
              message: `Episodio ${ep.episode_number}: No se encontraron fuentes en los espejos del cluster`,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Validate playback of extracted streams before declaring availability
            const validServers: ScrapedServer[] = [];
            for (const s of rawServers) {
              let isPlayable = true;
              if (s.direct_stream_url) {
                isPlayable = await validateHlsPlayback(s.direct_stream_url);
              }
              validServers.push({
                ...s,
                is_active: isPlayable,
              });
            }

            // Upsert verified servers with unique composite key: (episode_id, provider, audio_variant, source_key, quality)
            let insertedCount = 0;
            for (const s of validServers) {
              const { error: insErr } = await supabaseAdmin.from('episode_sources').upsert(
                {
                  episode_id: ep.id,
                  provider: s.provider,
                  server_name: s.server_name,
                  embed_url: s.embed_url,
                  direct_stream_url: s.direct_stream_url || null,
                  language: s.language,
                  audio_variant: s.audio_variant || 'default',
                  audio_language: s.audio_language || (s.language === 'dub' ? 'es-419' : 'ja'),
                  language_label: s.language_label || null,
                  source_key: s.source_key || 'default',
                  quality: s.quality,
                  priority: s.priority,
                  is_active: s.is_active ?? true,
                  subtitles: s.subtitles || [],
                  last_verified_at: new Date().toISOString(),
                },
                {
                  onConflict: 'episode_id,provider,audio_variant,source_key,quality',
                  ignoreDuplicates: false,
                }
              );

              if (!insErr) insertedCount++;
            }

            const activeSourcesCount = validServers.filter((s) => s.is_active).length;
            if (activeSourcesCount > 0) {
              await supabaseAdmin
                .from('episodes')
                .update({ status: 'available', updated_at: new Date().toISOString() })
                .eq('id', ep.id);

              processed++;

              const variantLabels = Array.from(
                new Set(validServers.map((s) => s.language_label || s.audio_language))
              ).join(' + ');
              const qualities = Array.from(new Set(validServers.map((s) => s.quality))).join(', ');

              jobLog.push({
                level: 'success',
                episode_number: ep.episode_number,
                message: `Episodio ${ep.episode_number}: ${activeSourcesCount} fuentes verificadas y enlazadas`,
                detail: `Audios: [${variantLabels}] • Calidades: [${qualities}] • Estado -> DISPONIBLE`,
                timestamp: new Date().toISOString(),
              });
            } else {
              failed++;
              jobLog.push({
                level: 'warn',
                episode_number: ep.episode_number,
                message: `Episodio ${ep.episode_number}: ${validServers.length} fuentes obtenidas pero ninguna pasó la verificación HLS`,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (epErr: unknown) {
          failed++;
          const message = epErr instanceof Error ? epErr.message : 'Error al procesar episodio';
          jobLog.push({
            level: 'error',
            episode_number: ep.episode_number,
            message: `Episodio ${ep.episode_number}: Fallo de extracción: ${message}`,
            error: message,
            timestamp: new Date().toISOString(),
          });
        }

        // Update progress in DB
        await jobsService.updateProgress(job.id, this.workerId, processed, failed, jobLog);
        await this.sleep(250);
      }

      // 6. Determine final job status (completed, partial, or failed)
      let finalStatus: 'completed' | 'partial' | 'failed' = 'failed';
      if (processed > 0 && failed === 0) {
        finalStatus = 'completed';
      } else if (processed > 0 && failed > 0) {
        finalStatus = 'partial';
      } else {
        finalStatus = 'failed';
      }

      jobLog.push({
        level: finalStatus === 'failed' ? 'error' : finalStatus === 'partial' ? 'warn' : 'info',
        timestamp: new Date().toISOString(),
        message: `🏁 Tarea finalizada [${finalStatus.toUpperCase()}]. Procesados: ${processed}/${episodesToProcess.length} • Fallidos: ${failed}`,
      });

      await jobsService.finishJob(job.id, this.workerId, finalStatus, processed, failed, jobLog);

      console.log(
        `[ScrapeWorker] Job ${job.id} finalized with status [${finalStatus}]. (Processed: ${processed}, Failed: ${failed})`
      );
    } catch (jobErr: unknown) {
      const message = jobErr instanceof Error ? jobErr.message : 'Job execution error';
      console.error(`[ScrapeWorker] Critical failure on Job ${job.id}:`, message);
      jobLog.push({
        level: 'error',
        timestamp: new Date().toISOString(),
        message: `💥 Error crítico en la ejecución del job: ${message}`,
        error: message,
      });
      await jobsService.finishJob(job.id, this.workerId, 'failed', processed, failed, jobLog);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

if (process.argv[1]?.includes('scrapeWorker')) {
  const worker = new ScrapeWorker();
  process.on('SIGINT', () => worker.stop());
  process.on('SIGTERM', () => worker.stop());
  worker.start().catch((err) => console.error('[ScrapeWorker] Fatal:', err));
}
