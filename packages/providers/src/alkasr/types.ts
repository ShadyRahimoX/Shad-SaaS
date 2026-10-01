export interface AlkasrProfile {
  balance: string;
  email: string;
}

export interface AlkasrQtyValues {
  min: number | string;
  max: number | string;
}

export interface AlkasrProduct {
  id: number;
  name: string;
  price: number;
  params: string[];
  category_name: string;
  available: boolean;
  qty_values: AlkasrQtyValues | string[] | null;
  product_type: 'amount' | 'package';
  parent_id: number;
  base_price: number;
  category_img: string;
}

export interface AlkasrCategory {
  id: number;
  name: string;
  image?: string;
  parent_id?: number;
}

export interface AlkasrContent {
  categories?: AlkasrCategory[];
  products?: AlkasrProduct[];
  [key: string]: unknown;
}

export interface AlkasrOrderResponse {
  status: 'OK' | 'ERROR';
  data?: {
    order_id: string;
    status: 'accept' | 'reject' | 'wait';
    price: number;
    data: Record<string, unknown>;
    replay_api: unknown;
  };
  error?: string;
}
