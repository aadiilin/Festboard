import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateParticipantQR } from '@/lib/utils/qr-generator';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { participantId } = await params;

  const { data: participant, error } = await supabase
    .from('participants')
    .select('id, chest_number, full_name, event_id, events(slug)')
    .eq('id', participantId)
    .single();

  if (error || !participant) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
  }

  const eventSlug = (participant.events as any)?.slug ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const qrDataUrl = await generateParticipantQR(
    {
      id: participant.id,
      chest_number: participant.chest_number,
      full_name: participant.full_name,
    },
    eventSlug,
    appUrl
  );

  await supabase
    .from('participants')
    .update({ qr_image_url: qrDataUrl })
    .eq('id', participant.id);

  return NextResponse.json({ qr: qrDataUrl, chest: participant.chest_number });
}