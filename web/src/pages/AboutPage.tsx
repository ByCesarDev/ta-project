import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { Mail, Globe, Tv, ShieldCheck, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPage: React.FC = () => {
  return (
    <LegalLayout
      title="Acerca de TotalAnime"
      subtitle="Conoce el propósito, la misión y el funcionamiento de nuestra plataforma de descubrimiento de anime."
      lastUpdated="Noviembre 2026"
    >
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-3">
          <p className="text-base text-slate-200 leading-relaxed font-medium">
            TotalAnime es una plataforma dedicada a facilitar el descubrimiento, la organización y el seguimiento de contenido relacionado con el anime.
          </p>
          <p>
            Nuestro objetivo es ofrecer a los usuarios una experiencia sencilla para explorar series, consultar información, descubrir episodios y acceder a fuentes externas de reproducción cuando estén disponibles.
          </p>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            ¿Cómo funciona?
          </h2>
          <p>
            TotalAnime organiza información relacionada con series y episodios de anime. Cuando se ofrecen enlaces o reproductores proporcionados por terceros, estos pueden estar alojados y administrados por servicios externos que no pertenecen ni están bajo el control de TotalAnime.
          </p>
          <p>
            TotalAnime no debe interpretarse como propietario, productor, distribuidor o representante oficial de las obras audiovisuales mencionadas, salvo que se indique expresamente lo contrario.
          </p>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Derechos de autor
          </h2>
          <p>
            Respetamos los derechos de propiedad intelectual de autores, estudios, distribuidores y demás titulares de derechos.
          </p>
          <p>
            Si consideras que algún contenido, enlace o elemento disponible en TotalAnime infringe tus derechos, puedes comunicarte con nosotros mediante nuestro{' '}
            <Link to="/dmca" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
              procedimiento de reclamaciones de derechos de autor
            </Link>.
          </p>
        </section>

        <section className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Tv className="w-5 h-5 text-indigo-400" />
            Independencia
          </h2>
          <p>
            TotalAnime es un proyecto independiente y no está afiliado, patrocinado ni respaldado oficialmente por los estudios de animación, editoriales, distribuidores o titulares de las obras mencionadas, salvo indicación expresa.
          </p>
        </section>

        <section className="pt-6 border-t border-slate-800/80">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-['Outfit'] block">
                Canales oficiales
              </span>
              <div className="flex items-center gap-2 text-sm text-white font-semibold">
                <Mail className="w-4 h-4 text-indigo-400" />
                <a href="mailto:contacto@totalanime.net" className="hover:text-indigo-300">
                  contacto@totalanime.net
                </a>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-['Outfit'] block">
                Sitio web
              </span>
              <div className="flex items-center gap-2 text-sm text-indigo-400 font-semibold">
                <Globe className="w-4 h-4 text-indigo-400" />
                <a href="https://totalanime.net" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  totalanime.net
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};
