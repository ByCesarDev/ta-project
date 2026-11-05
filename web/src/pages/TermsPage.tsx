import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, CheckCircle2, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Términos de servicio"
      subtitle="Condiciones generales de uso aplicables al acceso, navegación y servicios de TotalAnime."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            Bienvenido a TotalAnime. Al acceder o utilizar este sitio web (<code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">totalanime.net</code>), aceptas los presentes Términos de servicio. Si no estás de acuerdo con ellos, debes abstenerte de utilizar la plataforma.
          </p>
        </section>

        {/* 1 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            1. Naturaleza del servicio
          </h2>
          <p>
            TotalAnime es una plataforma independiente de software y catálogo que organiza información, metadatos y fichas relacionadas con obras de anime para facilitar su descubrimiento y seguimiento por parte de los aficionados.
          </p>
          <p>
            Determinadas funcionalidades pueden proporcionar enlaces, referencias o acceso a reproductores embebidos y servicios externos de streaming. Dichos servicios operan de manera autónoma e independiente, bajo sus propios términos y condiciones.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            2. Contenido de terceros y enlaces externos
          </h2>
          <p>
            Los enlaces a reproductores y recursos externos enlazados desde TotalAnime son administrados por terceros ajenos a nuestro control directo.
          </p>
          <p>
            TotalAnime no garantiza la disponibilidad ininterrumpida, calidad, legalidad, exactitud o idoneidad de los contenidos provistos por dichos servicios externos.
          </p>
          <p>
            El acceso a cualquier sitio o reproductor de terceros se realiza bajo la exclusiva responsabilidad del usuario y está sujeto a las políticas de uso y privacidad del proveedor correspondiente.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            3. Propiedad intelectual y marcas
          </h2>
          <p>
            Los nombres, títulos, marcas comerciales, personajes, logotipos, imágenes y materiales audiovisuales asociados a las series de anime pertenecen a sus respectivos autores, estudios y titulares legítimos.
          </p>
          <p>
            La mención o indexación de una obra en TotalAnime no implica titularidad de los derechos patrimoniales sobre ella, ni patrocinio, afiliación comercial o autorización oficial de sus respectivos titulares.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            4. Uso permitido y compromisos del usuario
          </h2>
          <p>Al utilizar TotalAnime, el usuario se compromete expresamente a:</p>
          <ul className="space-y-2 pl-2">
            {[
              'Utilizar la plataforma de forma lícita y con fines de disfrute personal.',
              'No intentar alterar, saturar, deshabilitar o eludir la seguridad del servicio.',
              'No emplear herramientas automatizadas de scraping abusivo que degraden el rendimiento para otros usuarios.',
              'No intentar acceder a cuentas, perfiles o bases de datos de otros usuarios sin autorización.',
              'Respetar en todo momento los derechos de propiedad intelectual de terceros.',
            ].map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            5. Disponibilidad y modificaciones del servicio
          </h2>
          <p>
            TotalAnime se reserva la facultad de modificar, actualizar, suspender o retirar contenidos, funcionalidades, enlaces o secciones del sitio web en cualquier momento y sin previo aviso cuando resulte técnicamente necesario.
          </p>
          <p>
            No garantizamos que la plataforma funcione de manera continua, ininterrumpida o libre de incidencias técnicas.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            6. Reclamaciones de derechos de autor y retirada
          </h2>
          <p>
            Los titulares de derechos de autor o sus representantes legales pueden remitir notificaciones fundadas de infracción a través de nuestro{' '}
            <Link to="/dmca" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              procedimiento de reclamaciones y retirada de contenido
            </Link>.
          </p>
          <p>
            Revisamos cada comunicación con la mayor diligencia y, cuando corresponda, procedemos a deshabilitar o eliminar los enlaces o fichas bajo nuestro control técnico directo.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            7. Limitación de responsabilidad
          </h2>
          <p>
            En la máxima medida autorizada por la normativa aplicable, TotalAnime se proporciona «tal cual» («as is») y «según disponibilidad». No ofrecemos garantías implícitas o explícitas sobre la disponibilidad ininterrumpida o exactitud de los servicios externos enlazados.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Nada en los presentes términos tiene por objeto excluir responsabilidades civiles o legales que no sean legalmente renunciables conforme al derecho aplicable.
            </span>
          </div>
        </section>

        {/* 8. Responsable del servicio y marco legal */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            8. Identificación del responsable y resolución de controversias
          </h2>
          <p>
            La plataforma TotalAnime es operada por el equipo independiente de desarrollo de <strong className="text-white">TotalAnime Project</strong> como una iniciativa web sin ánimo de apropiación de contenidos de terceros, disponible a través del sitio web <a href="https://totalanime.net" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline font-semibold">https://totalanime.net</a>.
          </p>
          <p>
            En caso de controversia, discrepancia o duda acerca del cumplimiento de estos términos, las partes acuerdan intentar resolver el asunto de manera amistosa, previa y de buena fe mediante comunicación directa a <a href="mailto:legal@totalanime.net" className="text-indigo-400 underline font-semibold">legal@totalanime.net</a>.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            9. Modificaciones de los términos
          </h2>
          <p>
            Nos reservamos el derecho de actualizar estos términos cuando existan cambios en la plataforma o requerimientos normativos. La versión vigente y su fecha de actualización estarán permanentemente accesibles en esta página.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            10. Canales de comunicación legal
          </h2>
          <p>Para notificaciones formales o consultas jurídicas relativas a estos términos:</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:legal@totalanime.net" className="hover:text-indigo-300">
              legal@totalanime.net
            </a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
