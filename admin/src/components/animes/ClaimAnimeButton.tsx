import React, { useState } from 'react';
import { Shield, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../common/Button.js';

interface ClaimAnimeButtonProps {
  animeId: number;
  claimedBy?: string | null;
  onSuccess?: () => void;
}

export const ClaimAnimeButton: React.FC<ClaimAnimeButtonProps> = ({
  animeId,
  claimedBy,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  const isClaimedByMe = claimedBy === user?.id;
  const isClaimedByOther = Boolean(claimedBy && !isClaimedByMe);

  const handleClaim = async () => {
    if (!user || isClaimedByMe) return;

    // Non-admins cannot reassign an anime claimed by another moderator
    if (isClaimedByOther && !isAdmin) {
      alert('Solo un administrador puede reasignar una serie reclamada por otro moderador.');
      return;
    }

    setLoading(true);
    try {
      // Call Supabase RPC claim_anime(p_anime_id INT)
      const { error } = await supabase.rpc('claim_anime', {
        p_anime_id: animeId,
      });

      if (error) {
        alert(`Error al reclamar serie: ${error.message}`);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      alert(`Error al reclamar serie: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isClaimedByMe) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
        <Check className="w-3.5 h-3.5" /> Asignada a ti
      </span>
    );
  }

  // If claimed by another moderator and current user is NOT admin, do not offer reassign
  if (isClaimedByOther && !isAdmin) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-700/60"
        title="Esta serie ya está asignada a otro moderador. Solo administradores pueden reasignarla."
      >
        <Shield className="w-3.5 h-3.5 text-slate-500" /> Asignada
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      isLoading={loading}
      icon={<Shield className="w-3.5 h-3.5 text-indigo-400" />}
      onClick={handleClaim}
      title={isClaimedByOther ? 'Reclamar y reasignar a tu perfil (Admin)' : 'Reclamar moderación de esta serie'}
    >
      {isClaimedByOther ? 'Reasignar' : 'Reclamar Serie'}
    </Button>
  );
};
