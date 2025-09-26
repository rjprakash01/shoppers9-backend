import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Category from './pages/Category';
import Search from './pages/Search';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderSuccess from './pages/OrderSuccess';
import Support from './pages/Support';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import TrackOrder from './pages/TrackOrder';
import Coupons from './pages/Coupons';
import Contact from './pages/Contact';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isCartOrCheckoutPage = location.pathname === '/cart' || location.pathname === '/checkout';
  const isProductDetailPage = location.pathname.startsWith('/products/') && location.pathname !== '/products';
  const isWishlistPage = location.pathname === '/wishlist';
  const isOrdersPage = location.pathname === '/orders' || location.pathname.startsWith('/orders/');
  const isProfilePage = location.pathname === '/profile' || location.pathname.startsWith('/profile/');
  const isOrderConfirmationPage = location.pathname === '/order-confirmation' || location.pathname === '/order-success';
  const isSupportPage = location.pathname === '/support' || location.pathname.startsWith('/support/');
  const isTrackOrderPage = location.pathname === '/track-order';
  const hideNavbarOnMobile = isCartOrCheckoutPage || isProductDetailPage || isWishlistPage || isOrdersPage || isProfilePage || isOrderConfirmationPage || isSupportPage || isTrackOrderPage;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ScrollToTop />
      {/* Hide Navbar on mobile for cart, checkout, and product detail pages */}
      <div className={hideNavbarOnMobile ? 'hidden lg:block' : ''}>
        <Navbar />
      </div>
      <main className={`flex-1 lg:pt-32 ${hideNavbarOnMobile ? 'pb-20 lg:pb-0' : 'pb-20 lg:pb-0'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/category/:categorySlug" element={<Category />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/new"
            element={
              <ProtectedRoute>
                <NewTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support/:ticketId"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {isHomePage && <Footer />}
      {/* Mobile Bottom Navigation - Always visible on mobile */}
      <MobileBottomNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
