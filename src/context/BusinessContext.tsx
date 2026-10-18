import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  BusinessProfile,
  ProductItem,
  Customer,
  Supplier,
  PurchaseOrder,
  PurchaseOrderStatus,
  SaleTransaction,
  Expense,
} from '../types';
import {
  initialBusinessProfile,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialPurchaseOrders,
  initialSales,
  initialExpenses,
} from '../data/mockData';
import { formatCurrency } from '../utils/currency';

interface BusinessContextType {
  profile: BusinessProfile;
  products: ProductItem[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  sales: SaleTransaction[];
  expenses: Expense[];
  
  // Computed metrics
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  outstandingReceivables: number;
  lowStockItems: ProductItem[];
  overdueSales: SaleTransaction[];
  pendingSales: SaleTransaction[];

  // CRUD Actions
  updateProfile: (profile: Partial<BusinessProfile>) => void;
  addProduct: (product: Omit<ProductItem, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<ProductItem>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, note?: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'outstandingBalance'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerPayment: (customerId: string, amount: number, method: string, reference?: string) => boolean;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>) => void;
  updatePurchaseOrderStatus: (poId: string, status: PurchaseOrderStatus) => void;

  createSale: (sale: Omit<SaleTransaction, 'id' | 'invoiceNumber'>) => boolean;
  updateSaleStatus: (saleId: string, status: 'Paid' | 'Pending' | 'Overdue') => void;
  deleteSale: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  resetToDemoData: () => void;
  notification: string | null;
  dismissNotification: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const STORAGE_KEY = 'businessbuddy_state_v1';

const normalizeExpenseCategory = (category: Expense['category']): Expense['category'] => {
  switch (category) {
    case 'Rent & Facilities': return 'Rent';
    case 'Payroll & Contractors': return 'Salaries';
    case 'Marketing & Ads': return 'Marketing';
    case 'Office & Shipping': return 'Transport';
    case 'Utilities':
    case 'Rent':
    case 'Salaries':
    case 'Marketing':
    case 'Transport':
    case 'Other': return category;
    default: return 'Other';
  }
};

const readStoredArray = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
};

const getSalePaidAmount = (sale: SaleTransaction) =>
  Math.min(sale.total, Math.max(0, sale.paidAmount ?? (sale.paymentStatus === 'Paid' ? sale.total : 0)));

const getSaleOutstandingAmount = (sale: SaleTransaction) =>
  Math.max(0, sale.total - getSalePaidAmount(sale));

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return initialBusinessProfile;
        return {
          ...initialBusinessProfile,
          ...parsed,
          enabledModules: {
            ...initialBusinessProfile.enabledModules,
            ...(parsed.enabledModules || {}),
          },
        };
      } catch (e) {
        return initialBusinessProfile;
      }
    }
    return initialBusinessProfile;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    return readStoredArray(`${STORAGE_KEY}_products`, initialProducts);
  });
  const productsRef = useRef(products);
  const nextInvoiceSequenceRef = useRef<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    return readStoredArray(`${STORAGE_KEY}_customers`, initialCustomers);
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    return readStoredArray(`${STORAGE_KEY}_suppliers`, initialSuppliers);
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    return readStoredArray(`${STORAGE_KEY}_pos`, initialPurchaseOrders);
  });

  const [sales, setSales] = useState<SaleTransaction[]>(() => {
    return readStoredArray(`${STORAGE_KEY}_sales`, initialSales);
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const loadedExpenses = readStoredArray(`${STORAGE_KEY}_expenses`, initialExpenses);
    return loadedExpenses.map((expense) => ({
      ...expense,
      category: normalizeExpenseCategory(expense.category),
    }));
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const dismissNotification = () => setNotification(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pos`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  // Computed metrics
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const outstandingReceivables = sales
    .filter((sale) => sale.paymentStatus === 'Pending' || sale.paymentStatus === 'Overdue')
    .reduce((sum, sale) => sum + getSaleOutstandingAmount(sale), 0);

  const lowStockItems = products.filter(
    (p) => p.type === 'product' && p.active && p.stockQuantity <= p.minThreshold
  );

  const overdueSales = sales.filter((s) => s.paymentStatus === 'Overdue');
  const pendingSales = sales.filter((s) => s.paymentStatus === 'Pending');

  // Actions
  const updateProfile = (updates: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    showNotification('Business profile updated successfully');
  };

  const addProduct = (newProd: Omit<ProductItem, 'id'>) => {
    const item: ProductItem = {
      ...newProd,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const updatedProducts = [item, ...productsRef.current];
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    showNotification(`Added ${item.type === 'service' ? 'service' : 'product'}: "${item.name}"`);
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    const updatedProducts = productsRef.current.map((item) => item.id === id ? { ...item, ...updates } : item);
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    showNotification('Item updated');
  };

  const deleteProduct = (id: string) => {
    const item = productsRef.current.find((product) => product.id === id);
    const updatedProducts = productsRef.current.filter((product) => product.id !== id);
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    showNotification(`Deleted item "${item?.name || id}"`);
  };

  const adjustStock = (id: string, delta: number, note?: string) => {
    const updatedProducts = productsRef.current.map((item) => item.id === id
      ? { ...item, stockQuantity: Math.max(0, item.stockQuantity + delta) }
      : item
    );
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    showNotification(`Adjusted stock by ${delta > 0 ? `+${delta}` : delta} ${note ? `(${note})` : ''}`);
  };

  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'totalSpent' | 'outstandingBalance'>) => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      totalSpent: 0,
      outstandingBalance: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    showNotification(`Added customer "${newCust.name}"`);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    showNotification('Customer details updated');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showNotification('Customer removed');
  };

  const recordCustomerPayment = (customerId: string, amount: number, method: string, reference?: string): boolean => {
    const customer = customers.find((record) => record.id === customerId);
    if (!customer || !Number.isFinite(amount) || amount <= 0 || amount > customer.outstandingBalance) {
      showNotification('Payment must be greater than zero and no more than the customer balance.');
      return false;
    }

    let unappliedAmount = amount;
    const updatedSales = [...sales];
    const outstandingInvoices = sales
      .filter((sale) => sale.customerId === customerId && sale.paymentStatus !== 'Paid' && getSaleOutstandingAmount(sale) > 0)
      .sort((first, second) => (first.dueDate || first.date).localeCompare(second.dueDate || second.date));

    outstandingInvoices.forEach((invoice) => {
      if (unappliedAmount <= 0) return;
      const invoiceBalance = getSaleOutstandingAmount(invoice);
      const appliedAmount = Math.min(invoiceBalance, unappliedAmount);
      unappliedAmount -= appliedAmount;
      const paidAmount = getSalePaidAmount(invoice) + appliedAmount;
      const saleIndex = updatedSales.findIndex((sale) => sale.id === invoice.id);
      if (saleIndex >= 0) {
        updatedSales[saleIndex] = {
          ...invoice,
          paidAmount,
          paymentStatus: paidAmount >= invoice.total ? 'Paid' : invoice.paymentStatus,
          paymentHistory: [
            ...(invoice.paymentHistory || []),
            {
              id: `payment-${Date.now()}-${saleIndex}-${Math.random().toString(36).slice(2, 6)}`,
              amount: appliedAmount,
              date: new Date().toISOString().split('T')[0],
              method,
              reference: reference?.trim() || undefined,
            },
          ],
        };
      }
    });

    setSales(updatedSales);
    setCustomers((prev) => prev.map((record) => record.id === customerId
      ? {
          ...record,
          outstandingBalance: Math.max(0, record.outstandingBalance - amount),
          totalSpent: record.totalSpent + amount,
        }
      : record
    ));
    showNotification(`Recorded payment of ${formatCurrency(amount, profile.currency, profile.currencySymbol)}`);
    return true;
  };

  const addSupplier = (data: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...data,
      id: `supp-${Date.now()}`,
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    showNotification(`Added supplier "${newSupplier.name}"`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    showNotification('Supplier updated');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showNotification('Supplier removed');
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>) => {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      poNumber,
      status: 'Ordered',
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    showNotification(`Created purchase order ${poNumber}`);
  };

  const updatePurchaseOrderStatus = (poId: string, newStatus: PurchaseOrderStatus) => {
    const target = purchaseOrders.find((po) => po.id === poId);
    if (!target) return;

    // Automated inventory receipt!
    if (newStatus === 'Received' && target.status !== 'Received') {
      // Increase product stock levels
      const updatedProducts = productsRef.current.map((prod) => {
          const matchItem = target.items.find((item) => item.productId === prod.id);
          if (matchItem) {
            return {
              ...prod,
              stockQuantity: prod.stockQuantity + matchItem.quantity,
            };
          }
          return prod;
      });
      productsRef.current = updatedProducts;
      setProducts(updatedProducts);
      showNotification(`Received PO ${target.poNumber}: Added items to stock!`);
    } else {
      showNotification(`PO ${target.poNumber} status marked as ${newStatus}`);
    }

    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: newStatus } : po))
    );
  };

  const createSale = (saleData: Omit<SaleTransaction, 'id' | 'invoiceNumber'>): boolean => {
    if (
      !saleData.items.length ||
      !Number.isFinite(saleData.total) ||
      saleData.total < 0 ||
      !saleData.customerName.trim() ||
      (saleData.customerId && !customers.some((customer) => customer.id === saleData.customerId)) ||
      saleData.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)
    ) {
      showNotification('Sale could not be created. Check the customer, items, quantities, and prices.');
      return false;
    }

    const productQuantities = new Map<string, number>();
    for (const item of saleData.items) {
      const product = productsRef.current.find((candidate) => candidate.id === item.itemId);
      if (!product || !product.active || product.type !== item.type) {
        showNotification(`Sale could not be created. "${item.itemName}" is no longer available.`);
        return false;
      }
      if (item.type === 'product') {
        productQuantities.set(item.itemId, (productQuantities.get(item.itemId) || 0) + item.quantity);
      }
    }

    const unavailableProduct = Array.from(productQuantities.entries()).find(([productId, quantity]) => {
      const product = productsRef.current.find((candidate) => candidate.id === productId);
      return !product || quantity > product.stockQuantity;
    });
    if (unavailableProduct) {
      const product = productsRef.current.find((candidate) => candidate.id === unavailableProduct[0]);
      showNotification(`Not enough stock for "${product?.name || 'this product'}". Sale was not created.`);
      return false;
    }

    const highestExistingInvoice = sales.reduce((highestNumber, sale) => {
      const match = sale.invoiceNumber.match(/^INV-(\d+)$/);
      return match ? Math.max(highestNumber, Number(match[1])) : highestNumber;
    }, 1094);
    const nextInvoiceNumber = Math.max(highestExistingInvoice, nextInvoiceSequenceRef.current ?? 1094) + 1;
    nextInvoiceSequenceRef.current = nextInvoiceNumber;
    const invoiceNumber = `INV-${nextInvoiceNumber}`;
    const newSale: SaleTransaction = {
      ...saleData,
      id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      invoiceNumber,
      paidAmount: saleData.paymentStatus === 'Paid' ? saleData.total : 0,
      paymentHistory: [],
    };

    // Deduct stock for physical products
    const updatedProducts = productsRef.current.map((p) => {
        const quantitySold = productQuantities.get(p.id) || 0;
        return quantitySold > 0 ? { ...p, stockQuantity: p.stockQuantity - quantitySold } : p;
    });
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);

    // Update customer spending or balance
    if (saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            const isUnpaid = saleData.paymentStatus === 'Pending' || saleData.paymentStatus === 'Overdue';
            return {
              ...c,
              totalSpent: isUnpaid ? c.totalSpent : c.totalSpent + saleData.total,
              outstandingBalance: isUnpaid ? c.outstandingBalance + saleData.total : c.outstandingBalance,
            };
          }
          return c;
        })
      );
    }

    setSales((prev) => [newSale, ...prev]);
    showNotification(`Recorded sale ${invoiceNumber} (${formatCurrency(newSale.total, profile.currency, profile.currencySymbol)})`);
    return true;
  };

  const updateSaleStatus = (saleId: string, status: 'Paid' | 'Pending' | 'Overdue') => {
    const sale = sales.find((item) => item.id === saleId);
    if (!sale || sale.paymentStatus === status) return;

    const previousPaidAmount = getSalePaidAmount(sale);
    const nextPaidAmount = status === 'Paid' ? sale.total : sale.paymentStatus === 'Paid' ? 0 : previousPaidAmount;
    const previousOutstanding = getSaleOutstandingAmount(sale);
    const nextOutstanding = Math.max(0, sale.total - nextPaidAmount);

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, paymentStatus: status, paidAmount: nextPaidAmount } : s))
    );

    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((customer) => customer.id === sale.customerId
          ? {
              ...customer,
              outstandingBalance: Math.max(0, customer.outstandingBalance + nextOutstanding - previousOutstanding),
              totalSpent: Math.max(0, customer.totalSpent + nextPaidAmount - previousPaidAmount),
            }
          : customer
        )
      );
    }
    showNotification(`Sale status updated to ${status}`);
  };

  const deleteSale = (id: string) => {
    const sale = sales.find((item) => item.id === id);
    if (!sale) return;

    setSales((prev) => prev.filter((s) => s.id !== id));
    const updatedProducts = productsRef.current.map((product) => {
        if (product.type !== 'product') return product;
        const returnedQuantity = sale.items.reduce(
          (total, item) => item.type === 'product' && item.itemId === product.id ? total + item.quantity : total,
          0
        );
        return returnedQuantity ? { ...product, stockQuantity: product.stockQuantity + returnedQuantity } : product;
    });
    productsRef.current = updatedProducts;
    setProducts(updatedProducts);

    if (sale.customerId) {
      const paidAmount = getSalePaidAmount(sale);
      const outstandingAmount = getSaleOutstandingAmount(sale);
      setCustomers((prev) =>
        prev.map((customer) => customer.id === sale.customerId
          ? {
              ...customer,
              totalSpent: Math.max(0, customer.totalSpent - paidAmount),
              outstandingBalance: Math.max(0, customer.outstandingBalance - outstandingAmount),
            }
          : customer
        )
      );
    }
    showNotification('Sale transaction removed');
  };

  const addExpense = (data: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    showNotification(`Logged expense: ${newExp.title} (${formatCurrency(newExp.amount, profile.currency, profile.currencySymbol)})`);
  };

  const updateExpense = (id: string, data: Omit<Expense, 'id'>) => {
    setExpenses((prev) => prev.map((expense) => expense.id === id ? { ...data, id } : expense));
    showNotification('Expense updated');
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showNotification('Expense entry removed');
  };

  const resetToDemoData = () => {
    setProfile(initialBusinessProfile);
    productsRef.current = initialProducts;
    nextInvoiceSequenceRef.current = null;
    setProducts(initialProducts);
    setCustomers(initialCustomers);
    setSuppliers(initialSuppliers);
    setPurchaseOrders(initialPurchaseOrders);
    setSales(initialSales);
    setExpenses(initialExpenses);
    [
      `${STORAGE_KEY}_profile`,
      `${STORAGE_KEY}_products`,
      `${STORAGE_KEY}_customers`,
      `${STORAGE_KEY}_suppliers`,
      `${STORAGE_KEY}_pos`,
      `${STORAGE_KEY}_sales`,
      `${STORAGE_KEY}_expenses`,
    ].forEach((key) => localStorage.removeItem(key));
    showNotification('Reset all records to initial demonstration data');
  };

  return (
    <BusinessContext.Provider
      value={{
        profile,
        products,
        customers,
        suppliers,
        purchaseOrders,
        sales,
        expenses,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMarginPercent,
        outstandingReceivables,
        lowStockItems,
        overdueSales,
        pendingSales,
        updateProfile,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerPayment,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        createSale,
        updateSaleStatus,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
        setProducts,
        resetToDemoData,
        notification,
        dismissNotification,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
