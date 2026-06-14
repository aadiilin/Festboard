import QRCode from 'qrcode';

export interface QRPayload {
  id: string;
  chest: string;
  name: string;
  event: string;
  ts: number;
}

export async function generateParticipantQR(
  participant: { id: string; chest_number: string; full_name: string },
  eventSlug: string,
  appUrl: string
): Promise<string> {
  const payload: QRPayload = {
    id: participant.id,
    chest: participant.chest_number,
    name: participant.full_name,
    event: eventSlug,
    ts: Date.now(),
  };

  const verifyUrl = `${appUrl}/results?chest=${participant.chest_number}&event=${eventSlug}`;

  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2,
    color: { dark: '#0F0C29', light: '#FFFFFF' },
  });

  return dataUrl;
}

export async function generateParticipantQRSVG(
  verifyUrl: string
): Promise<string> {
  return await QRCode.toString(verifyUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
  });
}

export async function bulkGenerateQR(
  participants: Array<{ id: string; chest_number: string; full_name: string }>,
  eventSlug: string,
  appUrl: string
): Promise<Array<{ id: string; qr_data_url: string }>> {
  return Promise.all(
    participants.map(async (p) => ({
      id: p.id,
      qr_data_url: await generateParticipantQR(p, eventSlug, appUrl),
    }))
  );
}