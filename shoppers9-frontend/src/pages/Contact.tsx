import React from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Contact Us</h1>
            <p className="text-sm text-gray-600 text-center max-w-2xl mx-auto">
              We're here to help! Get in touch with us for any questions, support, or feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Get in Touch</h2>
              <div className="space-y-3">
                {/* Phone */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Phone</h3>
                    <a 
                      href="tel:+919266765833" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block"
                    >
                      +91 9266765833
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Email</h3>
                    <a 
                      href="mailto:support@shoppers9.com" 
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm inline-block"
                    >
                      support@shoppers9.com
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Address</h3>
                    <div className="text-gray-700 text-sm">
                      <p>Sri Sai Prakash Auto Works</p>
                      <p>Lamba Line</p>
                      <p>Port Blair-744103</p>
                      <p>Andaman and Nicobar Islands, India</p>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Business Hours</h3>
                    <div className="text-gray-700 text-sm space-y-0">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                      <p>Saturday: 9:00 AM - 4:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Find Us</h2>
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="aspect-w-16 aspect-h-12">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3942.5234567890123!2d92.7234567890123!3d11.6234567890123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30863a4648a1c5c3:0x7e5c9b5c5c5c5c5c!2sPort%20Blair%2C%20Andaman%20and%20Nicobar%20Islands%20744103!5e0!3m2!1sen!2sin!4v1640995200000!5m2!1sen!2sin"
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Shoppers9 Location - Port Blair, Andaman and Nicobar Islands"
                  ></iframe>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600">
                    Click on the map to get directions to our store location.
                  </p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;