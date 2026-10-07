import React, { useEffect } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';

interface DisqusCommentsProps {
  animeSlug: string;
  episodeNumber: number;
  animeTitle: string;
}

declare global {
  interface Window {
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config: () => void;
      }) => void;
    };
    disqus_config?: () => void;
  }
}

export const DisqusComments: React.FC<DisqusCommentsProps> = ({
  animeSlug,
  episodeNumber,
  animeTitle,
}) => {
  const shortname = import.meta.env.VITE_DISQUS_SHORTNAME || 'totalanime';
  const pageIdentifier = `anime-${animeSlug}-ep-${episodeNumber}`;
  const pageTitle = `${animeTitle} - Episodio ${episodeNumber} | TotalAnime`;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    // Configuration callback for Disqus
    const configCallback = function (this: any) {
      this.page.identifier = pageIdentifier;
      this.page.url = pageUrl;
      this.page.title = pageTitle;
    };

    if (window.DISQUS) {
      // If Disqus is already loaded, reset for the new episode
      window.DISQUS.reset({
        reload: true,
        config: configCallback,
      });
    } else {
      // Inject Disqus script
      window.disqus_config = configCallback;
      const script = document.createElement('script');
      script.src = `https://${shortname}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(+new Date()));
      script.async = true;
      (document.head || document.body).appendChild(script);
    }
  }, [animeSlug, episodeNumber, animeTitle, pageIdentifier, pageUrl, shortname]);

  return (
    <div className="w-full rounded-3xl bg-[#0c101c] border border-slate-800/80 p-6 md:p-8 shadow-xl mb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base font-['Outfit']">Comentarios del Episodio</h3>
            <p className="text-xs text-slate-400">Comparte tus teorías y opiniones con la comunidad</p>
          </div>
        </div>

        <a
          href="https://disqus.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 transition-colors"
        >
          Disqus <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Disqus Target Container */}
      <div id="disqus_thread" className="min-h-[160px] text-slate-300" />
    </div>
  );
};
