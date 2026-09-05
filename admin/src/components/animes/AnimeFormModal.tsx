import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { Anime, AnimeStatus } from '../../types/index.js';
import { supabase } from '../../lib/supabase.js';

interface AnimeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeToEdit?: Anime | null;
  onSuccess: () => void;
}

export const AnimeFormModal: React.FC<AnimeFormModalProps> = ({
  isOpen,
  onClose,
  animeToEdit,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    title_romaji: '',
    title_english: '',
    title_native: '',
    slug: '',
    status: 'emision' as AnimeStatus,
    episodes: 12,
    format: 'TV',
    season_year: new Date().getFullYear(),
    cover_image: '',
    banner_image: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (animeToEdit) {
      setFormData({
        name: animeToEdit.name || '',
        title_romaji: animeToEdit.title_romaji || '',
        title_english: animeToEdit.title_english || '',
        title_native: animeToEdit.title_native || '',
        slug: animeToEdit.slug || '',
        status: animeToEdit.status || 'emision',
        episodes: animeToEdit.episodes || 0,
        format: animeToEdit.format || 'TV',
        season_year: animeToEdit.season_year || new Date().getFullYear(),
        cover_image: animeToEdit.cover_image || '',
        banner_image: animeToEdit.banner_image || '',
        description: animeToEdit.description || '',
      });
    } else {
      setFormData({
        name: '',
        title_romaji: '',
        title_english: '',
        title_native: '',
        slug: '',
        status: 'emision',
        episodes: 12,
        format: 'TV',
        season_year: new Date().getFullYear(),
        cover_image: '',
        banner_image: '',
        description: '',
      });
    }
  }, [animeToEdit, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: animeToEdit ? prev.slug : generatedSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setErrorMsg('El nombre y el slug son campos obligatorios.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (animeToEdit) {
        const { error } = await supabase
          .from('animes')
          .update({
            name: formData.name,
            title_romaji: formData.title_romaji || null,
            title_english: formData.title_english || null,
            title_native: formData.title_native || null,
            slug: formData.slug,
            status: formData.status,
            episodes: formData.episodes,
            format: formData.format,
            season_year: formData.season_year,
            cover_image: formData.cover_image || 'https://totalanime.com/placeholder-cover.webp',
            banner_image: formData.banner_image || null,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', animeToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('animes').insert({
          name: formData.name,
          title_romaji: formData.title_romaji || null,
          title_english: formData.title_english || null,
          title_native: formData.title_native || null,
          slug: formData.slug,
          status: formData.status,
          episodes: formData.episodes,
          format: formData.format,
          season_year: formData.season_year,
          cover_image: formData.cover_image || 'https://totalanime.com/placeholder-cover.webp',
          banner_image: formData.banner_image || null,
          description: formData.description,
        });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar el anime';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={animeToEdit ? 'Editar Anime' : 'Crear Nuevo Anime Manualmente'}
      subtitle="Define los metadatos de la serie en el catálogo oficial."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Título Principal *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Ej: Jujutsu Kaisen"
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Slug URL *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="jujutsu-kaisen"
              className="glass-input w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estado</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as AnimeStatus })
              }
              className="glass-input w-full bg-[#0b0f19]"
            >
              <option value="emision">En Emisión (emision)</option>
              <option value="finalizado">Finalizado (finalizado)</option>
              <option value="proximamente">Próximamente (proximamente)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total de Episodios
            </label>
            <input
              type="number"
              min="0"
              value={formData.episodes}
              onChange={(e) =>
                setFormData({ ...formData, episodes: parseInt(e.target.value, 10) || 0 })
              }
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Formato</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              className="glass-input w-full bg-[#0b0f19]"
            >
              <option value="TV">TV Serie</option>
              <option value="MOVIE">Película (Movie)</option>
              <option value="OVA">OVA</option>
              <option value="ONA">ONA</option>
              <option value="SPECIAL">Especial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Año de Temporada
            </label>
            <input
              type="number"
              value={formData.season_year}
              onChange={(e) =>
                setFormData({ ...formData, season_year: parseInt(e.target.value, 10) || 0 })
              }
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL Portada (Cover)
            </label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://..."
              className="glass-input w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              URL Banner (Opcional)
            </label>
            <input
              type="url"
              value={formData.banner_image}
              onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
              placeholder="https://..."
              className="glass-input w-full"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sinopsis</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Escribe la sinopsis oficial de la serie..."
              className="glass-input w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {animeToEdit ? 'Guardar Cambios' : 'Crear Anime'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
