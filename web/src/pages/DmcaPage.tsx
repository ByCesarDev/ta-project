import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, HelpCircle, AlertTriangle, CheckCircle2, RotateCcw, Server, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DmcaPage: React.FC = () => {
  return (
    <LegalLayout
      title="Procedimiento de reclamaciones y retirada de contenido"
      subtitle="Protocolo transparente para la notificación de posibles infracciones de derechos de autor y retirada de enlaces."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        {/* Intro */}
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            TotalAnime dispone de un procedimiento formal y de buena fe para recibir, revisar y responder con rapidez ante comunicaciones remitidas por titulares legítimos de derechos de autor o sus representantes debidamente autorizados.
          </p>
          <p>
            A través de este canal, los titulares pueden solicitar la revisión y deshabilitación de enlaces o fichas de contenido presentes en nuestro catálogo web.
          </p>
        </section>

        {/* 1. Alcance técnico: Distinción entre enlaces de TotalAnime y archivos externos */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            1. Alcance técnico y distinción fundamental del servicio
          </h2>
          <p>
            Para que cualquier reclamación sea efectiva, es indispensable comprender la naturaleza técnica de la plataforma:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-xs font-['Outfit']">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Lo que TotalAnime SÍ controla (Enlaces e Índices)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                TotalAnime administra el código de la web, la base de datos de metadatos, los enlaces a reproductores embebidos y las fichas de anime. Tras recibir una notificación válida, <strong className="text-white">retiramos o deshabilitamos de forma inmediata el acceso al enlace o ficha</strong> dentro de <code className="text-indigo-300">totalanime.net</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-300 text-xs font-['Outfit']">
                <Server className="w-4 h-4 text-amber-400" />
                <span>Lo que TotalAnime NO controla (Archivos en servidores externos)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                TotalAnime <strong className="text-slate-200">no aloja archivos de video</strong> en sus propios servidores. Los contenidos multimedia residen en servicios externos de almacenamiento o plataformas de terceros ajenas a nosotros. La retirada de un enlace en TotalAnime impide su visualización desde nuestro sitio, pero la eliminación física del archivo original requiere dirigirse al proveedor de hosting que lo aloja.
              </p>
            </div>
          </div>
        </section>

        {/* 2. ¿Cómo presentar una solicitud? */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            2. ¿Cómo presentar una solicitud de retirada?
          </h2>
          <p>
            Las notificaciones deben enviarse exclusivamente por correo electrónico a nuestro buzón designado:
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 inline-block">
            <div className="flex items-center gap-2 text-white font-bold">
              <Mail className="w-4 h-4 text-indigo-400" />
              <a href="mailto:dmca@totalanime.net" className="hover:text-indigo-300">
                dmca@totalanime.net
              </a>
            </div>
          </div>
          <p className="pt-2 font-medium text-slate-200">Para tramitar la solicitud con la mayor diligencia, por favor incluye:</p>
          <ul className="space-y-2 pl-2">
            {[
              'Nombre completo, entidad o titular representado y datos de contacto verificables (correo, teléfono o dirección).',
              'Identificación de la obra protegida por derechos de autor que se alega infringida.',
              'La URL o enlace exacto dentro de TotalAnime donde se localiza el elemento cuestionado (ejemplo: https://totalanime.net/watch/nombre-serie/1).',
              'Descripción suficiente del problema y justificación de la titularidad o representación de los derechos.',
              'Declaración de buena fe en la que manifiestes que el uso del material denunciado no cuenta con la debida autorización del titular o de la ley.',
              'Declaración bajo fe de juramento de que la información facilitada es veraz y de que dispones de autorización legal para actuar en representación del titular.',
              'Firma física o electrónica del titular de los derechos o de su representante autorizado.',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Qué sucede después */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            3. Revisión y medidas adoptadas
          </h2>
          <p>
            Al recibir una solicitud con la información requerida, nuestro equipo revisa el reporte en el menor plazo posible. Si se verifica la existencia de un enlace o elemento cuestionado, procedemos a:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-xs">
            <li>Deshabilitar de forma inmediata el acceso al reproductor o enlace reportado en nuestra web.</li>
            <li>Retirar el episodio o la ficha del catálogo en TotalAnime si procede.</li>
            <li>Notificar al remitente la resolución adoptada respecto a los enlaces bajo nuestro control directo.</li>
          </ul>
        </section>

        {/* 4. Solicitudes de restauración */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-emerald-400" />
            4. Solicitudes de contranotificación o restauración
          </h2>
          <p>
            Si consideras que un enlace o elemento fue retirado por un error de identificación o una reclamación no fundada, puedes remitir una contranotificación a <a href="mailto:dmca@totalanime.net" className="text-indigo-400 underline font-semibold">dmca@totalanime.net</a> especificando la URL afectada, la fundamentación legal de tu alegación y tus datos de contacto.
          </p>
        </section>

        {/* 5. Cláusula de no inmunidad / Aclaración legal sobre Safe Harbor */}
        <section className="pt-4 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-300 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-amber-300 font-['Outfit'] text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Aviso legal importante sobre la denominación DMCA</span>
            </div>
            <p className="leading-relaxed">
              La utilización del término referencial «DMCA» o la habilitación de este procedimiento de notificación y retirada responde al objetivo de ofrecer un canal de comunicación transparente y ágil para la comunidad y los titulares de derechos, de conformidad con las mejores prácticas internacionales de buena fe.
            </p>
            <p className="leading-relaxed text-amber-200/80 font-medium">
              La publicación de este procedimiento no constituye una afirmación de que TotalAnime esté formalmente registrada como agente designado ante la Oficina de Derechos de Autor de los Estados Unidos (US Copyright Office) ni garantiza inmunidad automática frente a eventuales acciones legales. TotalAnime no asume titularidad ni autoría sobre contenidos de terceros.
            </p>
          </div>
        </section>

        {/* Related link */}
        <section className="pt-2 text-xs text-slate-400 flex items-center gap-2">
          <span>Consulta también nuestra</span>
          <Link to="/copyright" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
            Política general de derechos de autor
          </Link>
          <span>y nuestros</span>
          <Link to="/terms" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
            Términos de servicio
          </Link>.
        </section>
      </div>
    </LegalLayout>
  );
};
