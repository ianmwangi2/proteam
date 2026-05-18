import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home'));

const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Account = lazy(() => import('./pages/Account'));
const Support = lazy(() => import('./pages/Support'));
const AdminDash = lazy(() => import('./pages/AdminDash'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Quotations = lazy(() => import('./pages/admin/Quotations'));
const QuotationDetail = lazy(() => import('./pages/admin/QuotationDetail'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const SupportTickets = lazy(() => import('./pages/admin/SupportTickets'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-secondary)' }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Customer App */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Navigate to="/services" replace />} />
          <Route path="/products/:id" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/account" element={<Account />} />
          <Route path="/support" element={<Support />} />

          {/* Admin — protected */}
          <Route path="/admin" element={<AdminRoute><AdminDash /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
          <Route path="/admin/quotations" element={<AdminRoute><Quotations /></AdminRoute>} />
          <Route path="/admin/quotations/:id" element={<AdminRoute><QuotationDetail /></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
