export type BusinessType = 'retail' | 'service' | 'wholesale' | 'freelance' | 'hybrid';

export interface EnabledModules {
  inventory: boolean;
  suppliers: boolean;
  customers: boolean;
  sales: boolean;
  expenses: boolean;
  aiAssistant: boolean;
}

export interface BusinessProfile {
  name: string;
  type: BusinessType;
  currency: string;
  currencySymbol: string;
  ownerName: string;
  ownerAvatarUrl?: string;
  email: string;
  phone: string;
  address: string;
  taxRatePercent: number;
  isSetupCompleted: boolean;
  enabledModules: EnabledModules;
}

export type ItemType = 'product' | 'service';

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minThreshold: number;
  unit: string;
  description: string;
  active: boolean;
}

export type CustomerType = 'Individual' | 'Business' | 'Wholesale' | 'Other';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerType?: CustomerType;
  company?: string;
  address?: string;
  outstandingBalance: number;
  totalSpent: number;
  createdAt: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  category: string;
  paymentTerms: string;
  address?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export type PurchaseOrderStatus = 'Draft' | 'Ordered' | 'Received' | 'Paid' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
}

export interface SaleLineItem {
  itemId: string;
  itemName: string;
  type: ItemType;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentMethod = 'Credit Card' | 'Cash' | 'Bank Transfer' | 'Online';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface SalePaymentRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  date: string;
  items: SaleLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount?: number;
  paymentHistory?: SalePaymentRecord[];
  dueDate?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Salaries'
  | 'Marketing'
  | 'Utilities'
  | 'Transport'
  | 'Other'
  | 'Rent & Facilities'
  | 'Payroll & Contractors'
  | 'Inventory & Raw Materials'
  | 'Marketing & Ads'
  | 'Software & Subscriptions'
  | 'Equipment'
  | 'Office & Shipping'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  payee: string;
  paymentMethod: string;
  isTaxDeductible: boolean;
  notes?: string;
}

export interface AIInsightItem {
  id: string;
  title: string;
  category: 'inventory' | 'cashflow' | 'pricing' | 'growth';
  summary: string;
  priority: 'High' | 'Medium' | 'Low';
  actionableStep: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}
