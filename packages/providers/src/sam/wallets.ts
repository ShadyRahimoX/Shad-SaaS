import { samFetch } from './client.js';
import type { SamWallet, SamBalance, SamTransaction } from './types.js';

export async function getSamWallets(): Promise<SamWallet[]> {
  return samFetch<SamWallet[]>('/v1/wallets');
}

export async function getShamcashBalance(walletAddress: string): Promise<SamBalance[]> {
  return samFetch<SamBalance[]>(`/v1/wallets/shamcash/${walletAddress}/balance`);
}

export async function getShamcashTransactions(
  walletAddress: string,
  direction: 'in' | 'out' | 'all' = 'all'
): Promise<SamTransaction[]> {
  return samFetch<SamTransaction[]>(
    `/v1/wallets/shamcash/${walletAddress}/transactions?direction=${direction}`
  );
}

export async function getSyriatelBalance(phoneOrCode: string): Promise<SamBalance[]> {
  return samFetch<SamBalance[]>(`/v1/wallets/syriatel/${phoneOrCode}/balance`);
}

export async function getSyriatelTransactions(
  phoneOrCode: string,
  direction: 'in' | 'out' | 'all' = 'all'
): Promise<SamTransaction[]> {
  return samFetch<SamTransaction[]>(
    `/v1/wallets/syriatel/${phoneOrCode}/transactions?direction=${direction}`
  );
}
