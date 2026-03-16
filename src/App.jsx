import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { SessionExpiredModal } from './components/auth/SessionExpiredModal';
import { AppShell } from './components/layout/AppShell';
import { MenuBoard } from './features/menu/MenuBoard';
import { PublicMenu } from './features/menu/PublicMenu';
import { CatalogManager } from './features/catalog/CatalogManager';
import { ProductFormModal } from './features/catalog/ProductFormModal';
import { CategoryFormModal } from './features/catalog/CategoryFormModal';
import { ReportsDashboard } from './features/reports/ReportsDashboard';
import { OrderHistoryPage } from './features/reports/OrderHistoryPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { ClientesPage } from './features/clientes/ClientesPage';
import { IptvAccountsPage } from './features/iptv-accounts/IptvAccountsPage';
import { DemosPage } from './features/demos/DemosPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { PaymentMethodsPage } from './features/payment-methods/PaymentMethodsPage';
import { UsersPage } from './features/users/UsersPage';
import { PlataformasPage } from './features/plataformas/PlataformasPage';
import { OfflineBanner } from './components/OfflineBanner';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { ReloadPrompt } from './components/common/ReloadPrompt';

// ─── AppContent (needs AuthContext) ──────────────────────────────────────────
function AppContent() {
  const { isAuthenticated } = useAuthContext();

  const [productModalOpen,   setProductModalOpen]   = useState(false);
  const [editingProduct,     setEditingProduct]     = useState(null);
  const [categoryModalOpen,  setCategoryModalOpen]  = useState(false);
  const [editingCategory,    setEditingCategory]    = useState(null);
  const [onSavedCallback,    setOnSavedCallback]    = useState(null);
  
  const handleOpenProductForm = (product = null, callback = null) => {
    setEditingProduct(product);
    setOnSavedCallback(() => callback);
    setProductModalOpen(true);
  };

  const handleOpenCategoryForm = (category = null, callback = null) => {
    setEditingCategory(category);
    setOnSavedCallback(() => callback);
    setCategoryModalOpen(true);
  };

  const handleSaved = (data) => {
    if (onSavedCallback) onSavedCallback(data);
  };

  return (
    <>
    <OfflineBanner />
    <SessionExpiredModal />
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/menu-publico" element={<PublicMenu />} />

        {/* Protected Routes */}
        {!isAuthenticated ? (
          <Route path="*" element={
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100]"
            >
              <LoginPage />
            </motion.div>
          } />
        ) : (
          <Route path="*" element={
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-screen"
            >
              <AppShell>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<ReportsDashboard />} />
                  <Route path="/dashboard/history" element={<OrderHistoryPage />} />
                  <Route path="/pos"      element={<Navigate to="/dashboard/history" replace />} />
                  <Route path="/catalog"  element={
                    <CatalogManager
                      onOpenProductForm={handleOpenProductForm}
                      onOpenCategoryForm={handleOpenCategoryForm}
                    />
                  } />
                  <Route path="/menu"     element={<MenuBoard />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/subscriptions" element={<Navigate to="/iptv-accounts" replace />} />
                  <Route path="/iptv-accounts" element={<IptvAccountsPage />} />
                  <Route path="/demos"    element={<DemosPage />} />
                  <Route path="/orders"          element={<OrdersPage />} />
                  <Route path="/payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/plataformas" element={<PlataformasPage />} />
                  <Route path="/users"    element={<UsersPage />} />
                  <Route path="*"         element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppShell>
     
              <ProductFormModal
                isOpen={productModalOpen}
                onClose={() => { setProductModalOpen(false); setOnSavedCallback(null); }}
                initialData={editingProduct}
                onSaved={handleSaved}
              />
              <CategoryFormModal
                isOpen={categoryModalOpen}
                onClose={() => { setCategoryModalOpen(false); setOnSavedCallback(null); }}
                initialData={editingCategory}
                onSaved={handleSaved}
              />
            </motion.div>
          } />
        )}
      </Routes>
    </AnimatePresence>
    </>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
        <ReloadPrompt />
      </AuthProvider>
    </ToastProvider>
  );
}
