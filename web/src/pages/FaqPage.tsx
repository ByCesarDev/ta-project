import React from 'react';
import { LegalLayout } from '../components/layout/LegalLayout.js';
import { ChevronRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const faqs: FaqItem[] = [
  {
    q: '¿Qué es TotalAnime?',
    a: 'TotalAnime es una plataforma independiente dedicada a organizar información relacionada con anime y facilitar el descubrimiento de series y episodios de manera moderna y organizada.',
  },
  {
    q: '¿TotalAnime produce o distribuye anime?',
    a: 'No nos presentamos como productores ni distribuidores oficiales de las obras mencionadas. Los derechos de cada obra pertenecen exclusivamente a sus respectivos titulares y creadores.',
  },
  {
    q: '¿Los vídeos están alojados en TotalAnime?',
    a: 'La disponibilidad y procedencia de los reproductores depende de la implementación de cada funcionalidad. Cuando se utilizan servicios externos, estos pueden alojar y administrar el contenido de forma independiente.',
  },
  {
    q: '¿Por qué algunos reproductores pueden dejar de funcionar?',
    a: 'Los servicios externos pueden modificar, eliminar o restringir sus recursos sin previo aviso. Por ello, TotalAnime no puede garantizar la disponibilidad permanente de todos los reproductores externos.',
  },
  {
    q: '¿Cómo puedo denunciar una obra?',
    a: (
      <span>
        Puedes presentar una reclamación formal mediante nuestro{' '}
        <Link to="/dmca" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
          procedimiento de derechos de autor
        </Link>
        , enviando la URL específica y la información detallada a{' '}
        <a href="mailto:dmca@totalanime.net" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
          dmca@totalanime.net
        </a>
        .
      </span>
    ),
  },
  {
    q: 'Soy titular de derechos. ¿Puedo solicitar la retirada de un enlace?',
    a: 'Sí. Revisaremos las solicitudes suficientemente detalladas y podremos retirar o deshabilitar los elementos que estén bajo nuestro control cuando corresponda.',
  },
  {
    q: '¿TotalAnime está afiliado a estudios de anime?',
    a: 'TotalAnime es un proyecto independiente y no está afiliado oficialmente a estudios, editoriales o distribuidores, salvo que se indique expresamente.',
  },
  {
    q: '¿Cómo puedo contactar con TotalAnime?',
    a: (
      <span>
        Puedes escribirnos en cualquier momento a{' '}
        <a href="mailto:contacto@totalanime.net" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
          contacto@totalanime.net
        </a>{' '}
        o visitar nuestra{' '}
        <Link to="/contact" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
          página de contacto
        </Link>
        .
      </span>
    ),
  },
];

export const FaqPage: React.FC = () => {
  return (
    <LegalLayout
      title="Preguntas frecuentes"
      subtitle="Respuestas claras a las dudas más comunes sobre TotalAnime, el contenido y la plataforma."
      lastUpdated="4 de noviembre de 2026"
    >
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
          >
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{faq.q}</span>
            </h3>
            <div className="text-sm text-slate-300 leading-relaxed pl-6">
              {faq.a}
            </div>
          </div>
        ))}

        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-400">
            ¿Tienes otra pregunta que no aparece aquí?
          </p>
          <a
            href="mailto:contacto@totalanime.net"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Escríbenos a contacto@totalanime.net</span>
          </a>
        </div>
      </div>
    </LegalLayout>
  );
};
