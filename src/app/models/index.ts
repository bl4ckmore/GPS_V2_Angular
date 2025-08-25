// Product Models
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: ProductImage[];
  attributes: ProductAttribute[];
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  isMainImage: boolean;
  displayOrder: number;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  value: string;
}

// Category Models
export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Models
export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Order Models
export interface Order {
  id: string;
  userId?: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentInfo: PaymentInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

export interface PaymentInfo {
  paymentMethod: PaymentMethod;
  cardLastFour?: string;
  transactionId?: string;
}

// Enums
export enum OrderStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Shipped = 'Shipped',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled'
}

export enum PaymentMethod {
  CreditCard = 'CreditCard',
  PayPal = 'PayPal',
  BankTransfer = 'BankTransfer',
  CashOnDelivery = 'CashOnDelivery'
}

// API Response Models
export interface PagedResult<T> {
  data: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// DTOs for API requests
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stockQuantity: number;
  images: CreateProductImageDto[];
  attributes: CreateProductAttributeDto[];
}

export interface CreateProductImageDto {
  imageUrl: string;
  altText: string;
  isMainImage: boolean;
  displayOrder: number;
}

export interface CreateProductAttributeDto {
  name: string;
  value: string;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  parentId?: string;
  imageUrl?: string;
  displayOrder: number;
}

export interface CreateCartItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}