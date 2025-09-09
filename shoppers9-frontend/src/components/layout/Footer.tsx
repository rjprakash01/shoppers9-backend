import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-indigo text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-gold rounded-2xl flex items-center justify-center shadow-lg">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 text-brand-indigo" />
                  <span className="absolute -bottom-1 -right-1 bg-brand-indigo text-brand-gold font-bold text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    9
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold font-playfair text-brand-gold">Shoppers9</span>
            </div>
            <p className="text-brand-slate text-sm font-poppins leading-relaxed">
              Your trusted shopping destination for quality products at great prices. 
              Shop with confidence and enjoy fast, reliable delivery.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-brand-gold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-brand-gold">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                  Track Your Order
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-brand-gold">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-brand-gold" />
                <span className="text-brand-slate font-poppins">+91 9266765833</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-brand-gold" />
                <span className="text-brand-slate font-poppins">support@shoppers9.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-brand-gold mt-0.5" />
                <span className="text-brand-slate font-poppins">
                  Sri Sai Prakash Auto Works<br />
                  Lamba Line<br />
                  Port Blair-744103
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brand-gold/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-brand-slate font-poppins">
              © 2024 Shoppers9. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                Privacy Policy
              </a>
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                Terms of Service
              </a>
              <a href="#" className="text-brand-slate hover:text-brand-gold transition-colors font-poppins">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;