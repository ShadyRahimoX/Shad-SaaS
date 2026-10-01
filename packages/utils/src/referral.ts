/**
 * يولّد كود إحالة فريد بصيغة REF-XXXXXX
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون O, 0, I, 1 للوضوح
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `REF-${code}`;
}
