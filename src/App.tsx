import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import VendorSearch from './pages/VendorSearch';
import VendorProfile from './pages/VendorProfile';
import Dashboard from './pages/Dashboard';
import VendorSubscription from './pages/VendorSubscription';
import Messages from './pages/Messages';
import VendorRegister from './pages/VendorRegister';
import VendorSignIn from './pages/VendorSignIn';
import CoupleRegister from './pages/CoupleRegister';
import CoupleSignIn from './pages/CoupleSignIn';
import SignInSelection from './pages/SignInSelection';
import UserTypeSelection from './pages/UserTypeSelection';
import Checkout from './pages/Checkout';
import CheckoutProcess from './pages/CheckoutProcess';
import Settings from './pages/Settings';
import VendorSettings from './pages/VendorSettings';
import SavedVendors from './pages/SavedVendors';
import VendorCalendar from './pages/VendorCalendar';
import VendorReviews from './pages/VendorReviews';
import VendorLeads from './pages/VendorLeads';
import AdminDashboard from './pages/admin/Dashboard';
import AdminVendors from './pages/admin/Vendors';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vendors" element={<VendorSearch />} />
            <Route path="/vendors/:id" element={<VendorProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/subscription" element={<VendorSubscription />} />
            <Route path="/subscription/checkout" element={<Checkout />} />
            <Route path="/subscription/process" element={<CheckoutProcess />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/vendor/settings" element={<VendorSettings />} />
            <Route path="/saved-vendors" element={<SavedVendors />} />
            <Route path="/calendar" element={<VendorCalendar />} />
            <Route path="/reviews" element={<VendorReviews />} />
            <Route path="/leads" element={<VendorLeads />} />
            <Route path="/get-started" element={<UserTypeSelection />} />
            <Route path="/signin" element={<SignInSelection />} />
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/signin" element={<VendorSignIn />} />
            <Route path="/couple/register" element={<CoupleRegister />} />
            <Route path="/couple/signin" element={<CoupleSignIn />} />
            
            {/* Public Admin Dashboard */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/vendors" element={<AdminVendors />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;