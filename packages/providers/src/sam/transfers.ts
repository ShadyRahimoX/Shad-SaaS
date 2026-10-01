import { samFetch } from './client.js';
import type {
  SamShamcashTransferInput,
  SamSyriatelTransferInput,
  SamTransferResponse,
} from './types.js';

export async function shamcashTransfer(
  input: SamShamcashTransferInput
): Promise<SamTransferResponse> {
  const { walletAddress, ...body } = input;
  return samFetch<SamTransferResponse>(
    `/v1/wallets/shamcash/${walletAddress}/transfer`,
    { method: 'POST', body }
  );
}

export async function syriatelTransfer(
  input: SamSyriatelTransferInput
): Promise<SamTransferResponse> {
  const { phoneOrCode, ...body } = input;
  return samFetch<SamTransferResponse>(
    `/v1/wallets/syriatel/${phoneOrCode}/transfer`,
    { method: 'POST', body }
  );
}
