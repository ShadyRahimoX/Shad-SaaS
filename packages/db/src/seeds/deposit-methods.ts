import { db } from '../client.js';
import { paymentMethods } from '../schema/index.js';
import { eq } from 'drizzle-orm';

type UiLayout = 'invoice' | 'address' | 'account' | 'simple';

interface RequiredField {
  name: string;
  label: string;
  type: 'text' | 'image' | 'number';
  required: boolean;
  placeholder?: string;
}

interface SeedMethod {
  name: string;
  code: string;
  type: 'invoice' | 'manual';
  minAmountUsd: number;
  maxAmountUsd: number | null;
  allowedCurrencies: string[];
  bgColor: string;
  iconUrl: string | null;
  instructions: string;
  uiLayout: UiLayout;
  config: Record<string, unknown>;
  requiredFields: RequiredField[];
  sortOrder: number;
}

const METHODS: SeedMethod[] = [
  // 1. شام كاش — Invoice (SAM API)
  {
    name: 'شام كاش',
    code: 'shamcash',
    type: 'invoice',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'SYP'],
    bgColor: '#0D9488',
    iconUrl: null,
    instructions: 'سيتم إنشاء فاتورة. ادفع المبلغ عبر تطبيق شام كاش، ثم أدخل رقم العملية.',
    uiLayout: 'invoice',
    config: {},  // يُقرأ من .env: SAM_API_KEY, SAM_SHAMCASH_IDENTIFIER
    requiredFields: [],
    sortOrder: 1,
  },

  // 2. USDT (BEP20) — Manual
  {
    name: 'USDT (BEP20)',
    code: 'usdt_bep20',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD'],
    bgColor: '#26A17B',
    iconUrl: null,
    instructions: 'حوّل USDT إلى العنوان الظاهر (شبكة BEP20)، ثم أدخل TX Hash وارفع صورة التحويل.',
    uiLayout: 'address',
    config: {
      walletAddress: 'TBD',
      network: 'BEP20',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية (TX Hash)', type: 'text', required: true, placeholder: '0x...' },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 2,
  },

  // 3. ويش موني
  {
    name: 'ويش موني',
    code: 'wish_money',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD'],
    bgColor: '#E91E63',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الرقم الظاهر، ثم أدخل رقم العملية وارفع صورة التحويل.',
    uiLayout: 'account',
    config: {
      phoneNumber: 'TBD',
      accountHolder: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 3,
  },

  // 4. باي بال
  {
    name: 'باي بال',
    code: 'paypal',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD'],
    bgColor: '#003087',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى حساب PayPal الظاهر (Friends & Family)، ثم أدخل رقم العملية.',
    uiLayout: 'account',
    config: {
      email: 'TBD',
      accountHolder: 'TBD',
      paymentType: 'friends_family',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 4,
  },

  // 5. زراعات بنك تركيا
  {
    name: 'زراعات بنك تركيا',
    code: 'ziraat_bank',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'TRY'],
    bgColor: '#D40000',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى IBAN الظاهر، ثم أدخل رقم العملية وارفع صورة الحوالة.',
    uiLayout: 'account',
    config: {
      iban: 'TBD',
      accountHolder: 'TBD',
      bankName: 'Ziraat Bankası',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة الحوالة', type: 'image', required: true },
    ],
    sortOrder: 5,
  },

  // 6. بنك السعودية
  {
    name: 'بنك السعودية',
    code: 'saudi_bank',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'SAR'],
    bgColor: '#1A6E3E',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى IBAN الظاهر، ثم أدخل رقم العملية وارفع صورة الحوالة.',
    uiLayout: 'account',
    config: {
      iban: 'TBD',
      accountHolder: 'TBD',
      bankName: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة الحوالة', type: 'image', required: true },
    ],
    sortOrder: 6,
  },

  // 7. أورنج موبي الأردن
  {
    name: 'أورنج موبي الأردن',
    code: 'orange_jordan',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'JOD'],
    bgColor: '#FF7900',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الرقم الظاهر، ثم أدخل رقم العملية وارفع صورة التحويل.',
    uiLayout: 'account',
    config: {
      phoneNumber: 'TBD',
      accountHolder: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 7,
  },

  // 8. كازاواليت
  {
    name: 'كازاواليت',
    code: 'kaza_wallet',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD'],
    bgColor: '#00A651',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الحساب الظاهر، ثم أدخل رقم العملية.',
    uiLayout: 'account',
    config: {
      accountNumber: 'TBD',
      accountHolder: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 8,
  },

  // 9. بريد الجزائر
  {
    name: 'بريد الجزائر',
    code: 'algeria_post',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'DZD'],
    bgColor: '#FFD700',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الحساب الظاهر (CCP)، ثم أدخل رقم العملية وارفع صورة الوصل.',
    uiLayout: 'account',
    config: {
      ccpNumber: 'TBD',
      accountHolder: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة الوصل', type: 'image', required: true },
    ],
    sortOrder: 9,
  },

  // 10. سياش بنك المغرب
  {
    name: 'سياش بنك المغرب',
    code: 'cih_bank',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'MAD'],
    bgColor: '#0033A0',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الحساب الظاهر (RIB)، ثم أدخل رقم العملية وارفع صورة الوصل.',
    uiLayout: 'account',
    config: {
      rib: 'TBD',
      accountHolder: 'TBD',
      bankName: 'CIH Bank',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة الوصل', type: 'image', required: true },
    ],
    sortOrder: 10,
  },

  // 11. فودافون كاش
  {
    name: 'فودافون كاش',
    code: 'vodafone_cash',
    type: 'manual',
    minAmountUsd: 1,
    maxAmountUsd: null,
    allowedCurrencies: ['USD', 'EGP'],
    bgColor: '#E60000',
    iconUrl: null,
    instructions: 'حوّل المبلغ إلى الرقم الظاهر، ثم أدخل رقم العملية وارفع صورة التحويل.',
    uiLayout: 'account',
    config: {
      phoneNumber: 'TBD',
      accountHolder: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة التحويل', type: 'image', required: true },
    ],
    sortOrder: 11,
  },

  // 12. تحويل بنكي عام
  {
    name: 'تحويل بنكي',
    code: 'bank_transfer',
    type: 'manual',
    minAmountUsd: 10,
    maxAmountUsd: null,
    allowedCurrencies: ['USD'],
    bgColor: '#475569',
    iconUrl: null,
    instructions: 'تواصل مع الدعم للحصول على تفاصيل الحساب البنكي.',
    uiLayout: 'account',
    config: {
      iban: 'TBD',
      accountHolder: 'TBD',
      bankName: 'TBD',
      requiresProofImage: true,
    },
    requiredFields: [
      { name: 'transactionRef', label: 'رقم العملية', type: 'text', required: true },
      { name: 'proofImage', label: 'صورة الحوالة', type: 'image', required: true },
    ],
    sortOrder: 12,
  },
];

export async function seedDepositMethods() {
  let created = 0;
  let updated = 0;

  for (const m of METHODS) {
    try {
      const existing = await db
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.code, m.code))
        .limit(1);

      const data = {
        name: m.name,
        code: m.code,
        type: m.type,
        minAmountUsd: m.minAmountUsd.toFixed(2),
        maxAmountUsd: m.maxAmountUsd != null ? m.maxAmountUsd.toFixed(2) : null,
        allowedCurrencies: m.allowedCurrencies,
        bgColor: m.bgColor,
        iconUrl: m.iconUrl,
        instructions: m.instructions,
        config: { ui_layout: m.uiLayout, ...m.config },
        requiredFields: m.requiredFields,
        sortOrder: m.sortOrder,
        active: true,
      };

      if (existing.length > 0) {
        await db.update(paymentMethods).set(data).where(eq(paymentMethods.id, existing[0].id));
        updated++;
      } else {
        await db.insert(paymentMethods).values(data);
        created++;
      }
    } catch (err) {
      console.error(`Failed ${m.code}:`, err);
    }
  }

  return { created, updated, total: METHODS.length };
}
