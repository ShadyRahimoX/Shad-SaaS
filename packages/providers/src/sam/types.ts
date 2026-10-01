// ===== Wallets =====
export interface SamWallet {
  id: string;
  provider: 'shamcash' | 'syriatel';
  providerDisplayName: string;
  label: string;
  phone?: string;
  walletAddress?: string;   // ShamCash
  accountNumber?: string;   // ShamCash
  region?: string;          // ShamCash
  cashCode?: string;        // Syriatel
  status: string;
}

// ===== Balances =====
export interface SamBalance {
  currency: 'USD' | 'SYP' | 'EUR';
  amount: number;
  label: string | null;
}

// ===== Transactions =====
export interface SamTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  counterparty: string | null;
  description: string | null;
  status: string | null;
  occurredAt: string;
}

// ===== Transfers =====
export interface SamShamcashTransferInput {
  walletAddress: string;
  recipientAddress: string;
  currencyId: 1 | 2 | 3;  // 1=USD, 2=SYP, 3=EUR
  amount: number;
  note?: string;
}

export interface SamSyriatelTransferInput {
  phoneOrCode: string;
  toGsmOrCode: string;
  amount: number;
  pinCode: string;
}

export interface SamTransferResponse {
  success: boolean;
  message: string;
}

// ===== Invoices =====
export interface SamCreateInvoiceInput {
  method: 'shamcash' | 'syriatel';
  identifier: string;
  amount: string;
  currency: 'USD' | 'SYP' | 'EUR';
  webhookUrl: string;
}

export interface SamCreateInvoiceResponse {
  invoiceId: string;
  paymentUrl: string;
  expiresAt: string;
}

export interface SamInvoice {
  id: string;
  method: string;
  identifier: string;
  amount: string;
  currency: string;
  status: 'pending' | 'paid' | 'expired';
  expiresAt: string;
  createdAt: string;
  paidAt: string | null;
}

export interface SamVerifyInvoiceInput {
  transactionRef: string;
}

export interface SamVerifyInvoiceResponse {
  verified: boolean;
  message: string;
  code?: string;  // EXPIRED
}

// ===== Webhooks =====
export interface SamWebhookPayload {
  event: 'invoice.paid' | 'invoice.expired';
  invoiceId: string;
  method: string;
  identifier: string;
  amount: string;
  currency: string;
  transactionRef?: string;
  paidAmount?: number;
  counterparty?: string;
  paidAt?: string;
  expiredAt?: string;
}

// ===== Errors =====
export type SamErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'VALIDATION_ERROR'
  | 'INVALID_IDENTIFIER'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'WALLET_SESSION_EXPIRED'
  | 'WALLET_UPSTREAM_ERROR'
  | 'PROVIDER_ERROR';
