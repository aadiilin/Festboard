'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { QRCodeDisplay } from './QRCodeDisplay';

interface Participant {
  id: string;
  full_name: string;
  chest_number: string;
  photo_url?: string | null;
  team?: { name: string; color: string };
  category?: { name: string };
  event?: { name: string; logo_url?: string | null };
}

export function IDCard({ participant }: { participant: Participant }) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="w-[300px] rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="h-2 w-full"
        style={{ background: participant.team?.color ?? '#7C3AED' }}
      />

      <div className="bg-gray-900 text-white text-center text-xs py-2 font-medium tracking-wide">
        {participant.event?.name ?? 'FestBoard Event'}
      </div>

      <div className="p-4 flex flex-col items-center gap-3 bg-white">
        {participant.photo_url ? (
          <Image
            src={participant.photo_url}
            alt={participant.full_name}
            width={80} height={80}
            className="rounded-full border-4 object-cover"
            style={{ borderColor: participant.team?.color ?? '#7C3AED' }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4"
            style={{
              background: participant.team?.color ?? '#7C3AED',
              borderColor: participant.team?.color ?? '#7C3AED',
            }}
          >
            {participant.full_name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="text-center">
          <p className="font-bold text-gray-900 text-base leading-tight">
            {participant.full_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {participant.category?.name} · {participant.team?.name}
          </p>
        </div>

        <div
          className="px-5 py-1.5 rounded-full text-white font-mono font-bold text-lg tracking-widest"
          style={{ background: participant.team?.color ?? '#7C3AED' }}
        >
          {participant.chest_number}
        </div>

        <QRCodeDisplay
          participantId={participant.id}
          chestNumber={participant.chest_number}
          size={120}
        />

        <p className="text-[10px] text-gray-400 text-center">
          Scan to view results
        </p>
      </div>

      <div className="bg-gray-50 border-t border-gray-100 text-center text-[10px] text-gray-400 py-2">
        festboard.app
      </div>
    </div>
  );
}