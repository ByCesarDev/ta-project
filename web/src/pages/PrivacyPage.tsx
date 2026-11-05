import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, Shield, Lock, Eye, Users, Database, Trash2, Server } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Política de privacidad"
      subtitle="Explicación detallada y transparente de los datos recopilados, los proveedores tecnológicos involucrados y el ejercicio de tus derechos en TotalAnime."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        {/* Intro */}
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            En TotalAnime respetamos la privacidad y la autonomía de nuestros usuarios. Esta Política de Privacidad describe de forma transparente qué información recopilamos, cómo se procesa a nivel técnico, qué proveedores de infraestructura intervienen y cómo puedes ejercer el control total sobre tus datos personales.
          </p>
        </section>

        {/* 1. Responsable del tratamiento */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            1. Responsable del tratamiento
          </h2>
          <p>
            El responsable del tratamiento de los datos recabados a través de la plataforma es el equipo de desarrollo independiente de <strong className="text-white">TotalAnime</strong> (en adelante, «TotalAnime»), disponible a través del dominio oficial <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">totalanime.net</code>.
          </p>
          <p>
            Para cualquier cuestión, consulta o ejercicio de derechos relativos a la privacidad de datos, puedes dirigirte directamente a nuestro buzón específico:
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium">
            <Mail className="w-4 h-4 text-indigo-400" />
            <a href="mailto:privacidad@totalanime.net" className="hover:text-indigo-300">
              privacidad@totalanime.net
            </a>
          </div>
        </section>

        {/* 2. Qué datos específicos recopilamos y cómo */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            2. Datos específicos recopilados en la plataforma
          </h2>
          <p>
            TotalAnime recopila únicamente los datos estrictamente necesarios para prestar el servicio de descubrimiento, personalización y seguimiento de series. De forma precisa, se gestionan las siguientes categorías:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white text-xs font-['Outfit'] block">
                A. Cuenta y autenticación
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dirección de correo electrónico y contraseña protegida mediante hash criptográfico (gestionada por Supabase Auth). No almacenamos contraseñas en texto plano.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white text-xs font-['Outfit'] block">
                B. Perfiles de visualización (Viewer Profiles)
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nombre del perfil, nombre visible (<code className="text-slate-300">display_name</code>), identificador público único (<code className="text-indigo-300">@username</code>), avatar elegido y biografía breve opcional.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white text-xs font-['Outfit'] block">
                C. Progreso e historial de reproducción
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Para cada perfil: episodio visualizado, segundos de avance (<code className="text-slate-300">progress_seconds</code>), duración total del video y marca de episodio completado, permitiendo reanudar la reproducción con precisión.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <span className="font-bold text-white text-xs font-['Outfit'] block">
                D. Listas, interacciones y comentarios
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Series añadidas a favoritos (<code className="text-slate-300">watchlist</code>), valoraciones (likes/dislikes) y comentarios públicos o respuestas publicadas en episodios.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Infraestructura y proveedores tecnológicos */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            3. Proveedores tecnológicos y tratamiento de datos
          </h2>
          <p>
            Para garantizar el funcionamiento seguro y la sincronización en tiempo real, TotalAnime se apoya en los siguientes proveedores tecnológicos:
          </p>

          <ul className="space-y-3 pl-1 text-slate-300">
            <li className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <strong className="text-white block mb-0.5">Supabase (PostgreSQL & Supabase Auth)</strong>
              <span className="text-xs text-slate-400 leading-relaxed block">
                Gestiona el sistema de autenticación de usuarios, tokens de sesión seguros (JWT), la base de datos principal del catálogo de animes, perfiles de usuario y sincronización de historial con Row Level Security (RLS).
              </span>
            </li>
            <li className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <strong className="text-white block mb-0.5">Turso / libSQL (Bases de datos en el borde)</strong>
              <span className="text-xs text-slate-400 leading-relaxed block">
                Almacena de forma ultra-rápida y distribuida el sistema de comentarios, recuentos de reacciones, perfiles públicos de comunidad y caché de sesión local de perfiles.
              </span>
            </li>
            <li className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <strong className="text-white block mb-0.5">Servicios externos de reproducción e imágenes</strong>
              <span className="text-xs text-slate-400 leading-relaxed block">
                Cuando accedes a un reproductor embebido o cargas portadas desde servicios externos de streaming o metadatos (como AniList), tu navegador conecta con dichos servidores terceros. Dichos servicios pueden recibir tu dirección IP y se rigen por sus propias políticas de privacidad.
              </span>
            </li>
          </ul>
        </section>

        {/* 4. Cookies y almacenamiento local */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            4. Cookies y almacenamiento local (localStorage)
          </h2>
          <p>
            TotalAnime <strong className="text-white">no utiliza cookies de seguimiento comercial ni redes publicitarias invasivas</strong>.
          </p>
          <p>
            Utilizamos el almacenamiento local del navegador (<code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">localStorage</code>) exclusivamente con fines técnicos y de experiencia de usuario:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
            <li><code className="text-slate-200">ta_active_viewer_profile</code>: Identificador del perfil de visualización seleccionado actualmente.</li>
            <li><code className="text-slate-200">ta_player_audio_variant</code> y <code className="text-slate-200">ta_player_language</code>: Preferencia de audio (ej. Japonés con subtítulos o Doblaje latino).</li>
            <li><code className="text-slate-200">ta_player_quality</code>: Calidad preferida del video (ej. Auto, 1080p, 720p).</li>
          </ul>
          <p className="text-xs text-slate-400">
            Puedes borrar estos datos en cualquier momento desde las herramientas de tu navegador sin que ello impida el acceso general a la web.
          </p>
        </section>

        {/* 5. Conservación de datos */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            5. Plazos de conservación de la información
          </h2>
          <p>
            Los datos vinculados a tu cuenta y perfiles se conservan mientras mantengas tu cuenta activa en TotalAnime. Si solicitas la eliminación de tu cuenta, los datos se eliminarán o anonimizarán de forma irreversible en un plazo máximo de treinta (30) días, salvo obligación legal estricta que exija su retención temporal.
          </p>
        </section>

        {/* 6. Seguridad */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            6. Seguridad de la información
          </h2>
          <p>
            Aplicamos políticas estrictas de seguridad técnica: comunicaciones cifradas mediante HTTPS/TLS, contraseñas protegidas por funciones criptográficas unidireccionales robustas, políticas de aislamiento a nivel de fila (Row Level Security en Supabase) y verificación de pertenencia de cuenta en todas las peticiones a la API.
          </p>
        </section>

        {/* 7. Derechos de los usuarios y procedimiento de eliminación */}
        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            7. Tus derechos y procedimiento de supresión / olvido
          </h2>
          <p>
            Tienes derecho a acceder a tus datos personales, rectificarlos cuando sean inexactos, solicitar su supresión (derecho al olvido) y oponerte o limitar su tratamiento.
          </p>
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider block font-['Outfit']">
              ¿Cómo solicitar la eliminación total de tus datos?
            </span>
            <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-300">
              <li>Envía un mensaje desde la dirección de correo con la que te registraste en TotalAnime a <a href="mailto:privacidad@totalanime.net" className="text-indigo-400 underline font-semibold">privacidad@totalanime.net</a>.</li>
              <li>Indica como asunto: <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">Solicitud de Supresión de Cuenta y Datos</code>.</li>
              <li>En el cuerpo del mensaje, confirma tu nombre de usuario o perfil principal.</li>
            </ol>
            <p className="text-[11px] text-slate-400 pt-1">
              Una vez verificada la titularidad, procederemos a borrar tu cuenta, historial, perfiles secundarios y listas asociadas de forma completa y sin costes.
            </p>
          </div>
        </section>

        {/* 8. Menores */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            8. Menores de edad
          </h2>
          <p>
            TotalAnime no recaba de manera deliberada información personal de menores de edad que no cuenten con la edad legal requerida en su jurisdicción para consentir el tratamiento de datos en servicios de la sociedad de la información. Si detectamos que se han recopilado datos de un menor sin el consentimiento debido, procederemos a su eliminación inmediata tras recibir el aviso correspondiente.
          </p>
        </section>

        {/* 9. Contacto */}
        <section className="space-y-3 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit']">
            9. Contacto de privacidad
          </h2>
          <p>Para cualquier duda o gestión relativa a esta política:</p>
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
