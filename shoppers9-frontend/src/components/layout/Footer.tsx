import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-elite-cta-purple text-elite-base-white mb-20 lg:mb-8">
      {/* Elite Divider */}
      <div className="h-0.5 bg-elite-gold-highlight"></div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-8">
        {/* Mobile Layout - Compact */}
        <div className="block lg:hidden space-y-4">
          {/* Company Info - Mobile */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 bg-elite-gold-highlight flex items-center justify-center shadow-premium">
                <div className="relative">
                  <ShoppingCart className="h-4 w-4 text-elite-base-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-elite-base-white text-elite-cta-purple font-bold text-xs h-3 w-3 flex items-center justify-center font-inter">
                    9
                  </span>
                </div>
              </div>
              <span className="text-lg font-bold font-playfair text-elite-base-white">Shoppers9</span>
            </div>
            <p className="text-elite-base-white/80 text-xs font-inter leading-relaxed max-w-xs mx-auto">
              Elite Shopping Experience. Your premium destination for luxury and convenience.
            </p>
            <div className="flex justify-center space-x-4">
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links Grid - Mobile */}
          <div className="grid grid-cols-2 gap-4">
            {/* Quick Links - Mobile */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold font-playfair text-elite-gold-highlight">Quick Links</h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link to="/" className="text-elite-base-white/80 hover:text-elite-gold-highlight transition-colors font-inter">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Products
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Orders
                  </Link>
                </li>
              </ul>
            </div>

            {/* Help & Support - Mobile */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold font-playfair text-elite-gold-highlight">Support</h3>
              <ul className="space-y-1 text-xs">
                <li>
                  <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Shipping
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Returns
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                    Track Order
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info - Mobile */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-playfair text-elite-gold-highlight text-center">Contact Us</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-center space-x-2">
                <Phone className="h-3 w-3 text-elite-gold-highlight" />
                <span className="text-white font-inter">+91 9266765833</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Mail className="h-3 w-3 text-elite-gold-highlight" />
                <span className="text-white font-inter">support@shoppers9.com</span>
              </div>
              <div className="flex items-start justify-center space-x-2">
                <MapPin className="h-3 w-3 text-elite-gold-highlight mt-0.5" />
                <span className="text-white font-inter text-center">
                  Sri Sai Prakash Auto Works<br />
                  Lamba Line, Port Blair-744103
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Company Info - Desktop */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-elite-gold-highlight flex items-center justify-center shadow-premium">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 text-elite-base-white" />
                  <span className="absolute -bottom-1 -right-1 bg-elite-base-white text-elite-cta-purple font-bold text-xs h-4 w-4 flex items-center justify-center font-inter">
                    9
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold font-playfair text-elite-base-white">Shoppers9</span>
            </div>
            <p className="text-elite-base-white/80 text-sm font-inter leading-relaxed">
              Elite Shopping Experience. Your premium destination for luxury and convenience.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links - Desktop */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-elite-gold-highlight">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-elite-base-white/80 hover:text-elite-gold-highlight transition-colors font-inter">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support - Desktop */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-elite-gold-highlight">Help & Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-inter">
                  Track Your Order
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info - Desktop */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold font-playfair text-elite-gold-highlight">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-elite-gold-highlight" />
                <span className="text-white font-inter">+91 9266765833</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-elite-gold-highlight" />
                <span className="text-white font-inter">support@shoppers9.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-elite-gold-highlight mt-0.5" />
                <span className="text-white font-inter">
                  Sri Sai Prakash Auto Works<br />
                  Lamba Line<br />
                  Port Blair-744103
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-elite-gold-highlight/20 mt-3 lg:mt-4 pt-2 lg:pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
            <div className="text-xs text-white font-poppins">
              © 2024 Shoppers9. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center space-x-3 text-xs">
              <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-poppins">
                Privacy Policy
              </a>
              <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-poppins">
                Terms of Service
              </a>
              <a href="#" className="text-white hover:text-elite-gold-highlight transition-colors font-poppins">
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