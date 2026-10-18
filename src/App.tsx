import React, { useState, useEffect } from 'react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/pages/DashboardView';
import { InventoryView } from './components/pages/InventoryView';
import { CustomersView } from './components/pages/CustomersView';
import { SuppliersView } from './components/pages/SuppliersView';
import { SalesView } from './components/pages/SalesView';
import { ExpensesView } from './components/pages/ExpensesView';
import { ReportsView } from './components/pages/ReportsView';
import { AIAssistantView } from './components/pages/AIAssistantView';

// Modals
import { ProductModal } from './components/modals/ProductModal';
import { StockAdjustModal } from './components/modals/StockAdjustModal';
import { SaleModal } from './components/modals/SaleModal';
import { CustomerModal } from './components/modals/CustomerModal';
import { SupplierModal } from './components/modals/SupplierModal';
import { PurchaseOrderModal } from './components/modals/PurchaseOrderModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { InvoiceReceiptModal } from './components/modals/InvoiceReceiptModal';
import { CustomerPaymentModal } from './components/modals/CustomerPaymentModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { BusinessSetupScreen } from './components/setup/BusinessSetupScreen';

import { ProductItem, Customer, Supplier, Expense } from './types';
import { CheckCircle2, X } from 'lucide-react';

const BusinessBuddyMain: React.FC = () => {
  const { profile, notification, dismissNotification } = useBusiness();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Setup Wizard State
  const [setupScreenOpen, setSetupScreenOpen] = useState(false);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductItem | null>(null);

  const [stockAdjustOpen, setStockAdjustOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<ProductItem | null>(null);

  const [saleModalOpen, setSaleModalOpen] = useState(false);

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [viewingSaleId, setViewingSaleId] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Redirect if current tab was disabled by module toggle
  useEffect(() => {
    const enabled = profile.enabledModules;
    if (enabled) {
      if (currentTab === 'inventory' && !enabled.inventory) setCurrentTab('dashboard');
      if (currentTab === 'suppliers' && !enabled.suppliers) setCurrentTab('dashboard');
      if (currentTab === 'customers' && !enabled.customers) setCurrentTab('dashboard');
      if (currentTab === 'sales' && !enabled.sales) setCurrentTab('dashboard');
      if (currentTab === 'expenses' && !enabled.expenses) setCurrentTab('dashboard');
      if (currentTab === 'ai-assistant' && !enabled.aiAssistant) setCurrentTab('dashboard');
    }
  }, [profile.enabledModules, currentTab]);

  // Quick Action Handler from Header or shortcuts
  const handleQuickAction = (action: 'sale' | 'product' | 'expense' | 'customer' | 'ai') => {
    if (action === 'sale') {
      setSaleModalOpen(true);
    } else if (action === 'product') {
      setProductToEdit(null);
      setProductModalOpen(true);
    } else if (action === 'expense') {
      setExpenseModalOpen(true);
    } else if (action === 'customer') {
      setCustomerToEdit(null);
      setCustomerModalOpen(true);
    } else if (action === 'ai') {
      setCurrentTab('ai-assistant');
    }
  };

  const handleOpenEditProduct = (prod?: ProductItem) => {
    setProductToEdit(prod || null);
    setProductModalOpen(true);
  };

  const handleOpenStockAdjust = (prod: ProductItem) => {
    setStockAdjustProduct(prod);
    setStockAdjustOpen(true);
  };

  const handleOpenEditCustomer = (cust?: Customer) => {
    setCustomerToEdit(cust || null);
    setCustomerModalOpen(true);
  };

  const handleOpenCustomerPayment = (cust: Customer) => {
    setPaymentCustomer(cust);
    setPaymentModalOpen(true);
  };

  const handleOpenEditSupplier = (supp?: Supplier) => {
    setSupplierToEdit(supp || null);
    setSupplierModalOpen(true);
  };

  const handleOpenEditExpense = (expense?: Expense) => {
    setExpenseToEdit(expense || null);
    setExpenseModalOpen(true);
  };

  const handleViewInvoice = (saleId: string) => {
    setViewingSaleId(saleId);
    setInvoiceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setGlobalSearch('');
        }}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenSetup={() => setSetupScreenOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onQuickAction={handleQuickAction}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
        />

        {/* Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => {
                setCurrentTab(tab);
                setGlobalSearch('');
              }}
              onQuickAction={handleQuickAction}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              onOpenProductModal={handleOpenEditProduct}
              onOpenStockAdjust={handleOpenStockAdjust}
              searchQuery={globalSearch}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              onOpenCustomerModal={handleOpenEditCustomer}
              onOpenPaymentModal={handleOpenCustomerPayment}
              onViewInvoice={handleViewInvoice}
              searchQuery={globalSearch}
            />
          )}

          {currentTab === 'suppliers' && (
            <SuppliersView
              onOpenSupplierModal={handleOpenEditSupplier}
              onOpenPOModal={() => setPoModalOpen(true)}
              searchQuery={globalSearch}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              onOpenSaleModal={() => setSaleModalOpen(true)}
              onViewInvoice={handleViewInvoice}
              searchQuery={globalSearch}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              onOpenExpenseModal={handleOpenEditExpense}
              searchQuery={globalSearch}
            />
          )}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'ai-assistant' && <AIAssistantView />}
        </main>
      </div>

      {/* First-Time Setup Wizard / Reconfigure Modal */}
      <BusinessSetupScreen
        isOpen={!profile.isSetupCompleted || setupScreenOpen}
        onClose={() => setSetupScreenOpen(false)}
        isInitial={!profile.isSetupCompleted}
      />

      {/* Interactive Modals */}
      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        productToEdit={productToEdit}
      />

      <StockAdjustModal
        isOpen={stockAdjustOpen}
        onClose={() => setStockAdjustOpen(false)}
        product={stockAdjustProduct}
      />

      <SaleModal
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
      />

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        customerToEdit={customerToEdit}
      />

      <CustomerPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        customer={paymentCustomer}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        supplierToEdit={supplierToEdit}
      />

      <PurchaseOrderModal
        isOpen={poModalOpen}
        onClose={() => setPoModalOpen(false)}
      />

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <InvoiceReceiptModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        saleId={viewingSaleId}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenSetupWizard={() => setSetupScreenOpen(true)}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
          <button
            onClick={dismissNotification}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BusinessProvider>
      <BusinessBuddyMain />
    </BusinessProvider>
  );
}
