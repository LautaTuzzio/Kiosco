export type UserRole = 'ciclo_basico' | 'ciclo_superior' | 'kiosquero' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  customizable?: boolean;
  ingredients?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: {
    ingredients?: string[];
    condiments?: string[];
  };
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  scheduledTime: string;
  paymentMethod: 'tarjeta' | 'mercadopago' | 'efectivo';
  status: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
  createdAt: string;
  userCycle?: 'ciclo_basico' | 'ciclo_superior';
}

export type BreakTime = '9:35' | '11:55' | '14:55' | '17:15' | '19:35';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Review {
  id: string;
  order_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  order_total?: number;
}