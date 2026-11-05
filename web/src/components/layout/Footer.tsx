import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, Heart, ShieldCheck, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05070a] border-t border-slate-800/80 mt-20 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand & Intro */}
          <div className="sm:col-span-2 space-y-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
                <Tv className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white font-['Outfit']">
                Total<span className="text-indigo-400">Anime</span> 2.0
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm text-xs">
              Plataforma dedicada a organizar información relacionada con el anime y facilitar el descubrimiento de series, episodios y fuentes externas de reproducción.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contacto general:</span>
              <a href="mailto:contacto@totalanime.net" className="text-indigo-400 hover:text-indigo-300 font-medium">
                contacto@totalanime.net
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-['Outfit']">
              Explorar
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
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
                  En Emisión
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="hover:text-indigo-400 transition-colors">
                  Mi Lista
                </Link>
              </li>
              <li>
                <Link to="/history" className="hover:text-indigo-400 transition-colors">
                  Historial
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policies */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-['Outfit']">
              Legal y Políticas
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/terms" className="hover:text-indigo-400 transition-colors">
                  Términos de servicio
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-indigo-400 transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link to="/copyright" className="hover:text-indigo-400 transition-colors">
                  Derechos de autor
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-indigo-400 transition-colors">
                  Reclamaciones (DMCA)
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & About */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider font-['Outfit']">
              Institucional
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link to="/about" className="hover:text-indigo-400 transition-colors">
                  Acerca de TotalAnime
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-indigo-400 transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-indigo-400 transition-colors">
                  Contacto y soporte
                </Link>
              </li>
            </ul>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proyecto independiente</span>
            </div>
          </div>
        </div>

        {/* Disclaimer statement */}
        <div className="pt-6 pb-6 border-t border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
          <p>
            TotalAnime es una plataforma independiente que organiza información sobre anime y facilita el descubrimiento de contenido. Cuando se proporcionan enlaces o reproductores de terceros, estos operan bajo la administración de servicios externos. TotalAnime no pretende ser propietaria ni representante oficial de las obras audiovisuales mencionadas.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 TotalAnime.net. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para la comunidad anime</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
