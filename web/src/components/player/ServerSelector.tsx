import React from 'react';
import { EpisodeSourceRow, StreamLanguage } from '../../types/index.js';
import { Server, Languages } from 'lucide-react';

interface ServerSelectorProps {
  sources: EpisodeSourceRow[];
  selectedSourceId: number | null;
  onSelectSource: (source: EpisodeSourceRow) => void;
  selectedLanguage: StreamLanguage;
  onSelectLanguage: (lang: StreamLanguage) => void;
}

export const ServerSelector: React.FC<ServerSelectorProps> = ({
  sources,
  selectedSourceId,
  onSelectSource,
  selectedLanguage,
  onSelectLanguage,
}) => {
  // Available languages in these sources
  const hasSub = sources.some((s) => s.language === 'sub');
  const hasDub = sources.some((s) => s.language === 'dub');

  // Filter sources by currently selected language
  const filteredSources = sources.filter((s) => s.language === selectedLanguage);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c101c] border border-slate-800/80 mb-6">
      {/* Server Options */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-2 font-['Outfit']">
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          Servidor:
        </div>

        {filteredSources.length === 0 ? (
          <span className="text-xs text-slate-500 italic">No hay servidores para este idioma</span>
        ) : (
          filteredSources.map((source) => {
            const isSelected = source.id === selectedSourceId;
            return (
              <button
                key={source.id}
                onClick={() => onSelectSource(source)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-400/40 shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {source.server_name || source.provider}
                {source.quality && (
                  <span className="ml-1.5 text-[10px] px-1 py-0.2 rounded bg-black/40 text-slate-300">
                    {source.quality}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Language Switcher */}
      <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
        <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
        <button
          onClick={() => onSelectLanguage('sub')}
          disabled={!hasSub}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            selectedLanguage === 'sub'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400'
          }`}
        >
          SUB
        </button>
        <button
          onClick={() => onSelectLanguage('dub')}
          disabled={!hasDub}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            selectedLanguage === 'dub'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400'
          }`}
        >
          DOB
        </button>
      </div>
    </div>
  );
};
