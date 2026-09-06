import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070a] border-t border-slate-800/80 mt-20 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                <Tv className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white font-['Outfit']">
                Total<span className="text-indigo-400">Anime</span> 2.0
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-md text-xs">
              Tu portal moderno de anime streaming. Disfruta del catálogo completo en alta calidad,
              con múltiples opciones de servidores, subtítulos al día y seguimiento de reproducción sincronizado.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-['Outfit']">
              Navegación
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <Link to="/" className="hover:text-indigo-400 transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-indigo-400 transition-colors">
                  Directorio de Animes
                </Link>
              </li>
              <li>
                <Link to="/directory?status=RELEASING" className="hover:text-indigo-400 transition-colors">
                  Animes en Emisión
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-indigo-400 transition-colors">
                  Mi Lista de Favoritos
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-['Outfit']">
              Aviso Legal
            </h4>
            <p className="text-[11px] text-slate-500 leading-normal">
              Ningún archivo de video se encuentra alojado en nuestros servidores. Todo el contenido es
              proporcionado por servicios externos y terceros no afiliados.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Plataforma segura y sin anuncios intrusivos
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 TotalAnime 2.0. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para la comunidad otaku</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
