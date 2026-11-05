import React, { useState } from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Check, Copy, MessageSquare, ShieldAlert, LifeBuoy, FileText } from 'lucide-react';

interface ContactChannel {
  title: string;
  email: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const channels: ContactChannel[] = [
  {
    title: 'Consultas Generales',
    email: 'contacto@totalanime.net',
    description: 'Preguntas sobre la plataforma, sugerencias, colaboraciones y dudas generales.',
    icon: MessageSquare,
    color: 'from-blue-500/20 to-indigo-500/20 border-indigo-500/30 text-indigo-400',
  },
  {
    title: 'Soporte Técnico',
    email: 'soporte@totalanime.net',
    description: 'Reportes de fallos en el reproductor, problemas con cuentas o bugs en la aplicación.',
    icon: LifeBuoy,
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400',
  },
  {
    title: 'Derechos de Autor y DMCA',
    email: 'dmca@totalanime.net',
    description: 'Reclamaciones de propiedad intelectual, solicitudes de retirada de enlaces y avisos formales.',
    icon: ShieldAlert,
    color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-400',
  },
  {
    title: 'Privacidad y Datos',
    email: 'privacidad@totalanime.net',
    description: 'Consultas sobre tratamiento de datos personales, cookies y ejercicio de derechos ARCO/GDPR.',
    icon: FileText,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
  },
  {
    title: 'Legal y Términos',
    email: 'legal@totalanime.net',
    description: 'Comunicaciones formales, avisos contractuales y cuestiones normativas.',
    icon: FileText,
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400',
  },
];

export const ContactPage: React.FC = () => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  return (
    <LegalLayout
      title="Contacto y soporte"
      subtitle="¿Tienes una pregunta, encontraste un error o necesitas comunicarte con el equipo de TotalAnime?"
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            Estamos disponibles para responder tus inquietudes a través de nuestros canales oficiales. Elige el canal que mejor se adapte a tu consulta para recibir una respuesta más rápida.
          </p>
        </section>

        {/* Contact Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isCopied = copiedEmail === ch.email;

            return (
              <div
                key={ch.email}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white font-['Outfit'] flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${ch.color} border`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{ch.title}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <a
                    href={`mailto:${ch.email}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline break-all"
                  >
                    {ch.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(ch.email)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-medium shrink-0 cursor-pointer"
                    title="Copiar correo"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Guidelines for DMCA / Claims */}
        <section className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-slate-300 space-y-2">
          <span className="font-bold text-white font-['Outfit'] block text-sm">
            Nota para solicitudes relacionadas con derechos de autor
          </span>
          <p className="leading-relaxed text-slate-400">
            Para facilitar y agilizar la revisión de solicitudes relacionadas con derechos de autor, por favor incluye la URL exacta de la página afectada dentro de TotalAnime y una descripción clara del problema.
          </p>
          <p className="text-[11px] text-slate-400">
            Intentaremos revisar todas las comunicaciones recibidas dentro de un plazo razonable.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
