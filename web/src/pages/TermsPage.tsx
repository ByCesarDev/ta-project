import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Términos de servicio"
      subtitle="Condiciones generales de uso aplicables al acceso y navegación en TotalAnime."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            Bienvenido a TotalAnime. Al acceder o utilizar este sitio web, aceptas los presentes Términos de servicio. Si no estás de acuerdo con ellos, debes dejar de utilizar la plataforma.
          </p>
        </section>

        {/* 1 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            1. Naturaleza del servicio
          </h2>
          <p>
            TotalAnime es una plataforma independiente que organiza información relacionada con anime y facilita su descubrimiento.
          </p>
          <p>
            Algunas funcionalidades pueden proporcionar enlaces, referencias o acceso a reproductores y servicios externos. Estos servicios pueden operar de manera independiente y estar sujetos a sus propias condiciones.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            2. Contenido de terceros
          </h2>
          <p>
            Los enlaces, reproductores y recursos externos pueden ser administrados por terceros sobre los cuales TotalAnime no tiene control directo.
          </p>
          <p>
            TotalAnime no garantiza la disponibilidad, continuidad, calidad, legalidad o exactitud del contenido proporcionado por dichos servicios externos.
          </p>
          <p>
            El acceso a sitios de terceros se realiza bajo la responsabilidad del usuario y está sujeto a las condiciones y políticas de privacidad de cada proveedor.
          </p>
        </section>

        {/* 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            3. Propiedad intelectual
          </h2>
          <p>
            Los nombres, logotipos, personajes, imágenes, series y demás elementos relacionados con obras de anime pertenecen a sus respectivos titulares.
          </p>
          <p>
            La aparición de una obra en TotalAnime no implica que TotalAnime sea propietaria de ella ni que tenga una relación comercial o autorización oficial de sus titulares.
          </p>
          <p>
            No reclamamos la propiedad de materiales pertenecientes a terceros.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            4. Uso permitido
          </h2>
          <p>El usuario se compromete a:</p>
          <ul className="space-y-2 pl-2">
            {[
              'Utilizar la plataforma de forma lícita.',
              'No intentar alterar, interrumpir o comprometer el funcionamiento del servicio.',
              'No utilizar el sitio para realizar actividades fraudulentas o perjudiciales.',
              'No intentar acceder sin autorización a sistemas, cuentas o información restringida.',
              'Respetar los derechos de propiedad intelectual de terceros.',
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
            5. Disponibilidad
          </h2>
          <p>
            TotalAnime puede modificar, suspender o retirar funcionalidades, enlaces o secciones del sitio cuando resulte necesario.
          </p>
          <p>
            No garantizamos que el servicio esté disponible de forma ininterrumpida ni libre de errores.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            6. Servicios externos
          </h2>
          <p>
            TotalAnime puede contener enlaces a sitios, reproductores o servicios de terceros. No controlamos sus políticas, contenido, disponibilidad ni prácticas de tratamiento de datos.
          </p>
          <p>
            Recomendamos consultar las condiciones y políticas correspondientes antes de utilizar dichos servicios.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            7. Reclamaciones de derechos de autor
          </h2>
          <p>
            Los titulares de derechos o sus representantes autorizados pueden presentar reclamaciones mediante nuestro{' '}
            <Link to="/dmca" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              procedimiento de derechos de autor
            </Link>.
          </p>
          <p>
            Las reclamaciones serán revisadas y, cuando corresponda, podremos retirar o deshabilitar el acceso a los elementos que estén bajo nuestro control.
          </p>
        </section>

        {/* 8 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            8. Limitación de responsabilidad
          </h2>
          <p>
            En la medida permitida por la legislación aplicable, TotalAnime no garantiza que la información o los servicios externos estén siempre disponibles, actualizados o libres de errores.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Nada de lo establecido en estos términos pretende excluir responsabilidades que no puedan excluirse legalmente.
            </span>
          </div>
        </section>

        {/* 9 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            9. Modificaciones
          </h2>
          <p>
            Podemos actualizar estos términos cuando sea necesario. La versión vigente estará disponible en esta página e indicará su fecha de actualización.
          </p>
        </section>

        {/* 10 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            10. Contacto
          </h2>
          <p>Para consultas relacionadas con estos términos:</p>
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
