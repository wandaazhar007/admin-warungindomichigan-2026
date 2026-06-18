// ── Shared types between admin UI and backend API ───────────────────────────

export interface Category {
  id:          string;
  name:        string;
  slug:        string;
  icon:        string | null;
  description: string | null;
  isActive:    boolean;
  sortOrder:   number;
  createdAt:   string;
  _count?:     { products: number };
}

export interface ProductImage {
  id:        string;
  url:       string;
  altText:   string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id:           string;
  name:         string;
  slug:         string;
  description:  string | null;
  price:        string;
  comparePrice: string | null;
  unit:         string;
  stock:        number;
  minStock:     number;
  sku:          string | null;
  weightGrams:  number;
  images:       ProductImage[];
  category:     Pick<Category, 'id' | 'name' | 'slug'>;
  categoryId:   string;
  isActive:     boolean;
  isFeatured:   boolean;
  tags:         string[];
  createdAt:    string;
  updatedAt:    string;
}

export interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PROCESSING'
  | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED';

export type FulfillStatus =
  | 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED';

export interface OrderItem {
  id:          string;
  productId:   string | null;
  productName: string;
  productSku:  string | null;
  unitPrice:   string;
  quantity:    number;
  subtotal:    string;
}

export interface OrderStatusHistory {
  id:        string;
  status:    OrderStatus;
  note:      string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Order {
  id:                   string;
  orderNumber:          string;
  email:                string;
  phone:                string;
  isGuestOrder:         boolean;
  status:               OrderStatus;
  paymentStatus:        PaymentStatus;
  fulfillmentStatus:    FulfillStatus;
  subtotal:             string;
  shippingCost:         string;
  tax:                  string;
  discount:             string;
  total:                string;
  shipFirstName:        string;
  shipLastName:         string;
  shipStreet1:          string;
  shipStreet2:          string | null;
  shipCity:             string;
  shipState:            string;
  shipZip:              string;
  shipCountry:          string;
  shippingCarrier:      string | null;
  shippingService:      string | null;
  selectedBoxSize:      string | null;
  trackingNumber:       string | null;
  trackingUrl:          string | null;
  shippingLabelUrl:     string | null;
  stripePaymentIntentId: string | null;
  paidAt:               string | null;
  shippedAt:            string | null;
  estimatedDelivery:    string | null;
  customerNote:         string | null;
  adminNote:            string | null;
  createdAt:            string;
  updatedAt:            string;
  items:                OrderItem[];
  statusHistory:        OrderStatusHistory[];
  customer?: {
    id:        string;
    email:     string;
    firstName: string | null;
    lastName:  string | null;
    isGuest:   boolean;
  } | null;
  _count?: { items: number };
}

export interface OrdersResponse {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface DashboardStats {
  totalRevenue:       number;
  ordersToday:        number;
  pendingOrders:      number;
  lowStockProducts:   number;
  revenueByDay:       { date: string; revenue: number }[];
  topProducts:        { productName: string; revenue: number; quantity: number }[];
}
