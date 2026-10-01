import { samFetch } from './client.js';
import type {
  SamCreateInvoiceInput,
  SamCreateInvoiceResponse,
  SamInvoice,
  SamVerifyInvoiceInput,
  SamVerifyInvoiceResponse,
} from './types.js';

/**
 * POST /v1/invoices — يتطلب auth
 */
export async function createInvoice(
  input: SamCreateInvoiceInput
): Promise<SamCreateInvoiceResponse> {
  return samFetch<SamCreateInvoiceResponse>('/v1/invoices', {
    method: 'POST',
    body: input,
  });
}

/**
 * GET /pay/{invoiceId} — بدون auth
 */
export async function getInvoice(invoiceId: string): Promise<SamInvoice> {
  return samFetch<SamInvoice>(`/pay/${invoiceId}`, {
    useAuth: false,
    usePayBase: true,
  });
}

/**
 * POST /pay/{invoiceId}/verify — بدون auth
 */
export async function verifyInvoice(
  invoiceId: string,
  input: SamVerifyInvoiceInput
): Promise<SamVerifyInvoiceResponse> {
  return samFetch<SamVerifyInvoiceResponse>(`/pay/${invoiceId}/verify`, {
    method: 'POST',
    body: input,
    useAuth: false,
    usePayBase: true,
  });
}
