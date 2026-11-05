import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, Copyright, FileWarning, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CopyrightPage: React.FC = () => {
  return (
    <LegalLayout
      title="Política de derechos de autor"
      subtitle="Compromiso de protección de propiedad intelectual y directrices para titulares de derechos."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            TotalAnime respeta los derechos de propiedad intelectual y reconoce la importancia de proteger las obras de sus autores y titulares legítimos.
          </p>
          <p>
            No pretendemos apropiarnos de obras, personajes, marcas o materiales protegidos pertenecientes a terceros.
          </p>
        </section>

        {/* 1 */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Copyright className="w-5 h-5 text-indigo-400" />
            1. Presentación de reclamaciones
          </h2>
          <p>
            Si eres titular de derechos de autor o representante autorizado y consideras que algún elemento disponible en TotalAnime infringe tus derechos, puedes enviarnos una reclamación a:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:dmca@totalanime.net" className="hover:text-indigo-300">
              dmca@totalanime.net
            </a>
          </div>
          <p className="pt-2">La solicitud debe incluir los siguientes puntos:</p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-300">
            <li>Identificación de la obra protegida por derechos de autor.</li>
            <li>Identificación de la URL o ubicación específica del elemento denunciado dentro de TotalAnime.</li>
            <li>Explicación de los derechos que consideras infringidos.</li>
            <li>Tu nombre completo y datos de contacto.</li>
            <li>Declaración de que consideras, de buena fe, que el uso denunciado no está autorizado por el titular, su representante o la legislación aplicable.</li>
            <li>Declaración de que la información proporcionada es exacta y de que estás autorizado para presentar la reclamación.</li>
            <li>Firma física o electrónica del titular o representante autorizado.</li>
          </ol>
          <p className="text-xs text-slate-400 italic">
            Las reclamaciones incompletas pueden requerir información adicional antes de ser procesadas.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            2. Revisión y medidas
          </h2>
          <p>Una vez recibida una reclamación suficientemente detallada, podremos:</p>
          <ul className="space-y-2 pl-2">
            {[
              'Revisar el elemento denunciado.',
              'Retirar o deshabilitar el acceso a páginas, enlaces o materiales que estén bajo nuestro control.',
              'Solicitar información adicional cuando sea necesario.',
              'Contactar con el proveedor externo correspondiente cuando el material esté alojado fuera de TotalAnime.',
              'Adoptar otras medidas razonables según las circunstancias y la legislación aplicable.',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 pt-1">
            La recepción de una reclamación no implica que la infracción esté confirmada automáticamente.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            3. Contenido alojado por terceros
          </h2>
          <p>
            Algunos reproductores o recursos pueden ser proporcionados por plataformas externas.
          </p>
          <p>
            Cuando el material denunciado esté alojado en un servicio externo, es posible que TotalAnime no tenga capacidad técnica para eliminar el archivo original.
          </p>
          <p>
            En esos casos, podremos revisar y, cuando corresponda, retirar el enlace o acceso desde las páginas que administramos. El titular también puede necesitar presentar una reclamación directamente ante el proveedor que aloja el material.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-400" />
            4. Reclamaciones fraudulentas
          </h2>
          <p>
            Las reclamaciones deben presentarse de buena fe y contener información veraz.
          </p>
          <p>
            El envío deliberado de información falsa o engañosa puede generar consecuencias legales conforme a la legislación aplicable.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            5. Contacto
          </h2>
          <p>Todas las reclamaciones de derechos de autor deben enviarse a:</p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 max-w-md">
            <div className="flex items-center gap-2 text-white font-bold">
              <Mail className="w-4 h-4 text-indigo-400" />
              <a href="mailto:dmca@totalanime.net" className="hover:text-indigo-300">
                dmca@totalanime.net
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Asunto recomendado: <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">Reclamación de derechos de autor – TotalAnime</code>
            </p>
          </div>
          <p className="text-xs text-slate-400 pt-2">
            Para más información técnica sobre los pasos de retirada, consulta nuestro{' '}
            <Link to="/dmca" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              procedimiento de retirada
            </Link>.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
