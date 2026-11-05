import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, HelpCircle, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

export const DmcaPage: React.FC = () => {
  return (
    <LegalLayout
      title="Procedimiento de reclamaciones y retirada de contenido"
      subtitle="Guía clara para titulares de derechos y procedimiento de reporte o restauración de enlaces."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            TotalAnime dispone de un procedimiento para recibir y revisar comunicaciones relacionadas con posibles infracciones de derechos de autor.
          </p>
          <p>
            Este procedimiento permite que los titulares de derechos o sus representantes soliciten la revisión de páginas, enlaces u otros elementos disponibles en nuestra plataforma.
          </p>
        </section>

        {/* ¿Cómo presentar una solicitud? */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            ¿Cómo presentar una solicitud?
          </h2>
          <p>Envía un correo electrónico a:</p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 inline-block">
            <div className="flex items-center gap-2 text-white font-bold">
              <Mail className="w-4 h-4 text-indigo-400" />
              <a href="mailto:dmca@totalanime.net" className="hover:text-indigo-300">
                dmca@totalanime.net
              </a>
            </div>
          </div>
          <p className="pt-2 font-medium text-slate-200">Por favor, incluye en tu comunicación:</p>
          <ul className="space-y-2 pl-2">
            {[
              'Tu nombre completo y datos de contacto.',
              'La identificación de la obra protegida por derechos de autor.',
              'La URL exacta de TotalAnime que deseas denunciar (ej. https://totalanime.net/watch/nombre-serie/1).',
              'La ubicación del material o enlace cuestionado.',
              'Una explicación detallada de por qué consideras que existe una infracción.',
              'Una declaración de buena fe.',
              'Una declaración de que estás autorizado para presentar la reclamación en nombre del titular de los derechos.',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ¿Qué sucede después? */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            ¿Qué sucede después?
          </h2>
          <p>
            Revisaremos la solicitud y podremos pedir información adicional si resulta necesario.
          </p>
          <p>
            Cuando corresponda, podremos retirar o deshabilitar el acceso al elemento denunciado que esté bajo nuestro control.
          </p>
          <p>
            Si el material está alojado en una plataforma externa, la eliminación del archivo original puede requerir una solicitud dirigida directamente a dicho proveedor de alojamiento.
          </p>
        </section>

        {/* Solicitudes de restauración */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            Solicitudes de restauración
          </h2>
          <p>
            Si consideras que un elemento fue retirado por error, puedes escribirnos a{' '}
            <a href="mailto:dmca@totalanime.net" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
              dmca@totalanime.net
            </a>
            , indicando la URL afectada y explicando los motivos de tu solicitud.
          </p>
          <p>
            La restauración dependerá de la información disponible, de las circunstancias del caso y de las obligaciones legales aplicables.
          </p>
        </section>

        {/* Importante */}
        <section className="pt-4 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 font-['Outfit'] text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Importante</span>
            </div>
            <p className="leading-relaxed">
              La publicación de este procedimiento no constituye por sí misma una declaración de que TotalAnime esté registrado o reúna los requisitos para acogerse a las limitaciones de responsabilidad previstas en la legislación estadounidense DMCA u otras normas similares.
            </p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
