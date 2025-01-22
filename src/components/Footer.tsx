import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Facebook, Instagram, Twitter, Mail, Shield } from 'lucide-react';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Heart className="w-6 h-6 text-rose-500" />
              <span className="text-xl font-semibold">WeddingHub</span>
            </Link>
            <p className="text-gray-600">
              Connecting couples with their perfect wedding vendors.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:contact@weddinghub.com" className="text-gray-400 hover:text-gray-600">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* For Couples */}
          <div>
            <h3 className="font-semibold mb-4">For Couples</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/vendors" className="text-gray-600 hover:text-primary">
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link to="/couple/register" className="text-gray-600 hover:text-primary">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/saved-vendors" className="text-gray-600 hover:text-primary">
                  Saved Vendors
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-gray-600 hover:text-primary">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/vendor/register" className="text-gray-600 hover:text-primary">
                  List Your Business
                </Link>
              </li>
              <li>
                <Link to="/subscription" className="text-gray-600 hover:text-primary">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/vendor/dashboard" className="text-gray-600 hover:text-primary">
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link to="/vendor/settings" className="text-gray-600 hover:text-primary">
                  Business Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              © {new Date().getFullYear()} WeddingHub. All rights reserved.
            </p>
            <Link 
              to="/admin/dashboard" 
              className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
              title="View Statistics"
            >
              <Shield className="w-4 h-4" />
              <span className="sr-only">View Statistics</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;