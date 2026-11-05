import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, Shield, Lock, Eye, Users } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Política de privacidad"
      subtitle="Explicación detallada de cómo se recopila, utiliza y protege la información en TotalAnime."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            En TotalAnime respetamos la privacidad de nuestros usuarios. Esta política explica qué información puede recopilarse durante el uso de la plataforma y cómo puede utilizarse.
          </p>
        </section>

        {/* 1 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            1. Información que podemos recopilar
          </h2>
          <p>
            Dependiendo de las funcionalidades disponibles y de los servicios utilizados, podemos recopilar información como:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
            <li>Información técnica del navegador y dispositivo.</li>
            <li>Dirección IP y datos generales de conexión.</li>
            <li>Registros técnicos necesarios para mantener la seguridad y funcionamiento del sitio.</li>
            <li>Información que el usuario proporciona voluntariamente (como credenciales de cuenta y perfil de visualización).</li>
            <li>Datos relacionados con preferencias o funcionalidades del sitio (como historial de reproducción y lista de seguimiento), cuando estas estén habilitadas.</li>
          </ul>
          <p className="text-xs text-slate-400 italic">
            La información efectivamente recopilada dependerá de las funcionalidades y herramientas activas en TotalAnime.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            2. Finalidad del tratamiento
          </h2>
          <p>La información puede utilizarse para:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
            <li>Mantener y operar la plataforma.</li>
            <li>Detectar errores y resolver problemas técnicos.</li>
            <li>Prevenir abusos y actividades maliciosas.</li>
            <li>Mejorar la experiencia de navegación.</li>
            <li>Responder consultas y solicitudes de los usuarios.</li>
            <li>Cumplir obligaciones legales aplicables.</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            3. Cookies y almacenamiento local
          </h2>
          <p>
            TotalAnime puede utilizar cookies, almacenamiento local del navegador (`localStorage`) u otras tecnologías similares para conservar preferencias (como idioma de audio preferido, servidor de video seleccionado o sesión activa) y permitir el funcionamiento de determinadas funcionalidades.
          </p>
          <p>
            El usuario puede administrar o eliminar estos datos mediante la configuración de su navegador. Algunas funcionalidades podrían dejar de funcionar correctamente si se deshabilitan.
          </p>
        </section>

        {/* 4 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            4. Servicios de terceros
          </h2>
          <p>
            Algunas funcionalidades pueden depender de proveedores externos, como servicios de alojamiento, bases de datos, reproductores, herramientas de análisis o plataformas de terceros.
          </p>
          <p>
            Estos proveedores pueden recopilar información conforme a sus propias políticas de privacidad.
          </p>
          <p>
            TotalAnime no controla directamente las prácticas de privacidad de servicios externos. Recomendamos revisar sus políticas antes de utilizarlos.
          </p>
        </section>

        {/* 5 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            5. Conservación de información
          </h2>
          <p>
            La información se conservará durante el tiempo necesario para cumplir las finalidades descritas en esta política, atender obligaciones legales o resolver incidentes de seguridad, según corresponda.
          </p>
          <p>
            Los períodos concretos de conservación pueden variar dependiendo del tipo de información y del proveedor involucrado.
          </p>
        </section>

        {/* 6 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            6. Seguridad
          </h2>
          <p>
            Adoptamos medidas razonables destinadas a proteger la información frente a accesos, alteraciones o divulgaciones no autorizadas.
          </p>
          <p>
            Sin embargo, ningún sistema de transmisión o almacenamiento electrónico puede garantizar seguridad absoluta.
          </p>
        </section>

        {/* 7 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            7. Derechos de los usuarios
          </h2>
          <p>
            Dependiendo de la legislación aplicable, los usuarios pueden tener derecho a solicitar acceso, corrección, eliminación u otras acciones relacionadas con su información personal.
          </p>
          <p>Para presentar una solicitud, puedes escribirnos a:</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:privacidad@totalanime.net" className="hover:text-indigo-300">
              privacidad@totalanime.net
            </a>
          </div>
        </section>

        {/* 8 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            8. Menores de edad
          </h2>
          <p>
            TotalAnime no pretende recopilar deliberadamente información personal de menores cuando dicha recopilación no esté permitida por la legislación aplicable.
          </p>
          <p>
            Si consideras que un menor ha proporcionado información personal de forma indebida, puedes contactarnos para solicitar su revisión.
          </p>
        </section>

        {/* 9 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            9. Cambios en esta política
          </h2>
          <p>
            Podemos actualizar esta política para reflejar cambios en nuestras funcionalidades, proveedores o requisitos legales.
          </p>
          <p>La versión vigente estará disponible en esta página.</p>
        </section>

        {/* 10 */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            10. Contacto
          </h2>
          <p>Para consultas sobre privacidad:</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:privacidad@totalanime.net" className="hover:text-indigo-300">
              privacidad@totalanime.net
            </a>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
