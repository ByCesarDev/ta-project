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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const isClaimedByMe = claimedBy === user?.id;

  const handleClaim = async () => {
    if (!user || isClaimedByMe) return;

    setLoading(true);
    try {
      // Call Supabase RPC claim_anime(anime_id)
      const { error } = await supabase.rpc('claim_anime', {
        target_anime_id: animeId,
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

  return (
    <Button
      variant="outline"
      size="sm"
      isLoading={loading}
      icon={<Shield className="w-3.5 h-3.5 text-indigo-400" />}
      onClick={handleClaim}
      title={claimedBy ? 'Reclamar y reasignar a tu perfil' : 'Reclamar moderación de esta serie'}
    >
      {claimedBy ? 'Reasignar' : 'Reclamar Serie'}
    </Button>
  );
};
