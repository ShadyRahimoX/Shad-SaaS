import { db } from '../client.js';
import { notificationTypes } from '../schema/index.js';
import { eq } from 'drizzle-orm';

export const DEFAULT_NOTIFICATION_TYPES = [
  { key: 'order.created', labelAr: 'تم إنشاء طلب', labelEn: 'Order created' },
  { key: 'order.completed', labelAr: 'اكتمل طلبك', labelEn: 'Order completed' },
  { key: 'order.failed', labelAr: 'فشل طلبك', labelEn: 'Order failed' },
  { key: 'deposit.approved', labelAr: 'تمت الموافقة على الإيداع', labelEn: 'Deposit approved' },
  { key: 'deposit.rejected', labelAr: 'تم رفض الإيداع', labelEn: 'Deposit rejected' },
  { key: 'referral.commission', labelAr: 'عمولة إحالة جديدة', labelEn: 'New referral commission' },
  { key: 'vip.upgraded', labelAr: 'تم ترقيتك لمستوى VIP', labelEn: 'VIP upgraded' },
  { key: 'chat.message', labelAr: 'رسالة محادثة جديدة', labelEn: 'New chat message' },
  { key: 'ticket.created', labelAr: 'تذكرة دعم جديدة', labelEn: 'New support ticket' },
  { key: 'ticket.replied', labelAr: 'رد على تذكرة الدعم', labelEn: 'Ticket replied' },
  { key: 'ticket.status_changed', labelAr: 'تحديث حالة التذكرة', labelEn: 'Ticket status changed' },
];

export async function seedNotificationTypes() {
  let created = 0;
  let updated = 0;

  for (const t of DEFAULT_NOTIFICATION_TYPES) {
    const existing = await db
      .select({ id: notificationTypes.id })
      .from(notificationTypes)
      .where(eq(notificationTypes.key, t.key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(notificationTypes)
        .set({ labelAr: t.labelAr, labelEn: t.labelEn })
        .where(eq(notificationTypes.key, t.key));
      updated++;
    } else {
      await db.insert(notificationTypes).values({
        key: t.key,
        labelAr: t.labelAr,
        labelEn: t.labelEn,
        defaultChannel: 'in_app',
      });
      created++;
    }
  }

  return { created, updated, total: DEFAULT_NOTIFICATION_TYPES.length };
}
