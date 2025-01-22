import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
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
import SavedVendors from './pages/SavedVendors';
import VendorCalendar from './pages/VendorCalendar';
import VendorReviews from './pages/VendorReviews';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
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
            <Route path="/saved-vendors" element={<SavedVendors />} />
            <Route path="/calendar" element={<VendorCalendar />} />
            <Route path="/reviews" element={<VendorReviews />} />
            <Route path="/get-started" element={<UserTypeSelection />} />
            <Route path="/signin" element={<SignInSelection />} />
            <Route path="/vendor/register" element={<VendorRegister />} />
            <Route path="/vendor/signin" element={<VendorSignIn />} />
            <Route path="/couple/register" element={<CoupleRegister />} />
            <Route path="/couple/signin" element={<CoupleSignIn />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;