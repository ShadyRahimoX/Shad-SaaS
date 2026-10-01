import { z } from 'zod';

export const createDepositSchema = z.object({
  methodCode: z.string().min(1).max(50),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(2).max(10),
  
  // حقول اختيارية للطرق اليدوية
  transactionRef: z.string().max(200).optional(),
  proofImageUrl: z.string().url().optional(),
  
  // حقول إضافية (flexible)
  extraFields: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type CreateDepositInput = z.infer<typeof createDepositSchema>;

export const MIN_DEPOSIT_USD = 1;
export const MAX_DEPOSIT_USD = 100000;
