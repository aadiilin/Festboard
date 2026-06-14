'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  participantId: string;
  chestNumber: string;
  size?: number;
}

export function QRCodeDisplay({ participantId, chestNumber, size = 160 }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/qr/${participantId}`)
      .then(r => r.json())
      .then(data => { setQr(data.qr); setLoading(false); })
      .catch(() => setLoading(false));
  }, [participantId]);

  if (loading) return (
    <div style={{ width: size, height: size }}
         className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-xs text-gray-400">Generating QR...</span>
    </div>
  );

  if (!qr) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <Image src={qr} alt={`QR for ${chestNumber}`} width={size} height={size} />
      <span className="text-xs font-mono font-bold tracking-wider">{chestNumber}</span>
    </div>
  );
}