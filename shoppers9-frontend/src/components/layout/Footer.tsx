import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ShoppingCart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-elite-cta-purple text-elite-base-white">
      {/* Elite Divider */}
      <div className="h-0.5 bg-elite-gold-highlight"></div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 lg:py-4">
        {/* Mobile Layout - Compact */}
        <div className="block lg:hidden space-y-2">
          {/* Company Info - Mobile */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-elite-gold-highlight flex items-center justify-center shadow-premium">
                <div className="relative">
                  <ShoppingCart className="h-3 w-3 text-elite-base-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-elite-base-white text-elite-cta-purple font-bold text-xs h-2 w-2 flex items-center justify-center font-inter">
                    9
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold font-playfair text-elite-base-white">Shoppers9</span>
            </div>
            <p className="text-elite-base-white/80 text-xs font-inter leading-relaxed max-w-xs mx-auto">
              Shopping Made Simple
            </p>
            <div className="flex justify-center space-x-3">
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Facebook className="h-3 w-3" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Twitter className="h-3 w-3" />
              </a>
              <a href="#" className="text-elite-base-white/60 hover:text-elite-gold-highlight transition-colors">
                <Instagram className="h-3 w-3" />
              </a>
            </div>
          </div>


        </div>

        {/* Desktop Layout - Grid */}
        <div className="hidden lg:block">
          {/* Company Info - Desktop */}
          <div className="space-y-2 text-center">
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
            <p className="text-elite-base-white/80 text-xs font-inter leading-relaxed max-w-md mx-auto">
              Shopping Made Simple
            </p>
            <div className="flex justify-center space-x-3">
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
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-elite-gold-highlight/20 mt-2 lg:mt-3 pt-1 lg:pt-2">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-0.5 md:space-y-0">
            <div className="text-xs text-white font-poppins">
              © 2025 Shoppers9. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center space-x-2 text-xs">
              <Link to="/contact" className="text-white hover:text-elite-gold-highlight transition-colors font-poppins">
                Contact Us
              </Link>
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