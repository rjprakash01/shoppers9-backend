import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import CustomerManagement from './pages/CustomerManagement';
import SellerManagement from './pages/SellerManagement';
import CustomerProfile from './pages/CustomerProfile';
import SellerProfile from './pages/SellerProfile';
import ProductManagement from './pages/ProductManagement';
import Orders from './pages/Orders';
import CategoryManagement from './components/CategoryManagement';
import FilterManagement from './pages/FilterManagement';
import BannerManagement from './components/BannerManagement';
import FilterOptionManagement from './components/FilterOptionManagement';
import Support from './pages/Support';
import SupportDetail from './pages/SupportDetail';
import Inventory from './pages/Inventory';
import Shipping from './pages/Shipping';
import Coupons from './pages/Coupons';
import EnhancedAnalytics from './pages/EnhancedAnalytics';
import Settings from './pages/Settings';
import Testimonials from './pages/Testimonials';
import AdminManagement from './pages/AdminManagement';
import PermissionManagement from './pages/PermissionManagement';
import TestOrders from './pages/TestOrders';
import ProductReviewQueue from './pages/ProductReviewQueue';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/customer-management" element={
              <ProtectedRoute>
                <Layout>
                  <CustomerManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/seller-management" element={
              <ProtectedRoute>
                <Layout>
                  <SellerManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/customer/:customerId" element={
              <ProtectedRoute>
                <Layout>
                  <CustomerProfile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/seller/:sellerId" element={
              <ProtectedRoute>
                <Layout>
                  <SellerProfile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute>
                <Layout>
                  <ProductManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/product-review-queue" element={
              <ProtectedRoute>
                <Layout>
                  <ProductReviewQueue />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/orders" element={
              <ProtectedRoute>
                <Layout>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/test-orders" element={
              <ProtectedRoute>
                <Layout>
                  <TestOrders />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <Layout>
                  <Support />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/support/:ticketId" element={
              <ProtectedRoute>
                <Layout>
                  <SupportDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <Layout>
                  <CategoryManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/filters" element={
              <ProtectedRoute>
                <Layout>
                  <FilterManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/banners" element={
              <ProtectedRoute>
                <Layout>
                  <BannerManagement />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/filter-options/:filterId" element={
              <ProtectedRoute>
                <Layout>
                  <FilterOptionManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout>
                  <Inventory />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/shipping" element={
              <ProtectedRoute>
                <Layout>
                  <Shipping />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/coupons" element={
              <ProtectedRoute>
                <Layout>
                  <Coupons />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Layout>
                  <EnhancedAnalytics />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/testimonials" element={
              <ProtectedRoute>
                <Layout>
                  <Testimonials />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin-management" element={
              <ProtectedRoute>
                <Layout>
                  <AdminManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/permission-management" element={
              <ProtectedRoute>
                <Layout>
                  <PermissionManagement />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
