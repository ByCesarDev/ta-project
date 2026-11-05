import React from 'react';
import { NavLink } from 'react-router-dom';
import { PageContainer } from './PageContainer.js';
import {
  Info,
  FileText,
  ShieldCheck,
  Copyright,
  AlertOctagon,
  HelpCircle,
  Mail,
  Calendar,
} from 'lucide-react';

interface LegalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
}

const navItems = [
  { to: '/about', label: 'Acerca de TotalAnime', icon: Info },
  { to: '/terms', label: 'Términos de servicio', icon: FileText },
  { to: '/privacy', label: 'Política de privacidad', icon: ShieldCheck },
  { to: '/copyright', label: 'Derechos de autor', icon: Copyright },
  { to: '/dmca', label: 'Reclamaciones y retirada', icon: AlertOctagon },
  { to: '/faq', label: 'Preguntas frecuentes', icon: HelpCircle },
  { to: '/contact', label: 'Contacto y soporte', icon: Mail },
];

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  children,
  title,
  subtitle,
  lastUpdated = '4 de noviembre de 2026',
}) => {
  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0c101c]/90 to-indigo-950/40 border border-slate-800/80 p-6 sm:p-10 shadow-2xl">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Centro de Información y Políticas</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Última actualización: {lastUpdated}</span>
              </div>
            )}
          </div>
          {/* Subtle decoration glow */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Content with Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 items-start">
          {/* Sticky Sidebar Navigation */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="p-3 rounded-2xl bg-[#0c101c] border border-slate-800/80 shadow-lg">
              <span className="block px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit']">
                Secciones
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Quick Contact Box */}
            <div className="p-4 rounded-2xl bg-[#0c101c]/70 border border-slate-800/60 text-xs text-slate-400 space-y-2">
              <span className="block font-bold text-white font-['Outfit'] text-xs">
                ¿Reclamación o consulta?
              </span>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Para avisos de copyright o asistencia legal directa:
              </p>
              <a
                href="mailto:dmca@totalanime.net"
                className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] break-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>dmca@totalanime.net</span>
              </a>
            </div>
          </aside>

          {/* Main Legal Content Container */}
          <div className="min-w-0 bg-[#0c101c] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-xl prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
