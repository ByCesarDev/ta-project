import React, { useState, useEffect } from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal.js';
import { Button } from '../common/Button.js';
import { apiClient } from '../../lib/api.js';
import { Series } from '../../types/index.js';

interface SeriesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesToEdit: Series | null;
  onSuccess?: () => void;
}

export const SeriesFormModal: React.FC<SeriesFormModalProps> = ({
  isOpen,
  onClose,
  seriesToEdit,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [status, setStatus] = useState('finalizado');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (seriesToEdit) {
      setName(seriesToEdit.name || '');
      setSlug(seriesToEdit.slug || '');
      setDescription(seriesToEdit.description || '');
      setCoverImage(seriesToEdit.cover_image || '');
      setBannerImage(seriesToEdit.banner_image || '');
      setStatus(seriesToEdit.status || 'finalizado');
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setCoverImage('');
      setBannerImage('');
      setStatus('finalizado');
    }
    setErrorMsg(null);
  }, [seriesToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (seriesToEdit) {
        await apiClient.put(`/series/${seriesToEdit.id}`, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
          cover_image: coverImage.trim() || null,
          banner_image: bannerImage.trim() || null,
          status,
        });
      } else {
        await apiClient.post('/series', {
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || null,
          cover_image: coverImage.trim() || null,
          banner_image: bannerImage.trim() || null,
          status,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar serie';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          {seriesToEdit ? `Editar Serie: ${seriesToEdit.name}` : 'Crear Nueva Serie'}
        </span>
      }
      subtitle="La Serie es la entidad principal que agrupa todas las temporadas y entregas."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nombre Oficial de la Serie *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Demon Slayer: Kimetsu no Yaiba"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Slug URL (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: demon-slayer-kimetsu-no-yaiba"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="glass-input w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="glass-input w-full text-xs bg-[#0b0f19]"
            >
              <option value="emision">En Emisión (emision)</option>
              <option value="finalizado">Finalizado (finalizado)</option>
              <option value="proximamente">Próximamente (proximamente)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Póster / Cover Image (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="glass-input w-full text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Banner Image (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="glass-input w-full text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Sinopsis General
            </label>
            <textarea
              rows={3}
              placeholder="Descripción general de la serie..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full text-xs resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {seriesToEdit ? 'Guardar Cambios' : 'Crear Serie'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
