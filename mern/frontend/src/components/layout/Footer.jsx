import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="bg-gray-900 text-white pb-8 px-8 mt-6 pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
         


          {/* Social Media Section */}
          <div className="lg:col-span-1">
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
              SOCIAL MEDIA
            </h3>
            <div className="space-y-4">
              <a 
                href="https://fmpg.vercel.app/" 
                className="block text-xl font-light hover:text-lime-400 transition-colors duration-300"
              >
                WEBSITE..
              </a>
            </div>
          </div>

          {/* Useful Links Section */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6 mt-6">
              USEFUL LINKS
            </h3>
            <div className="space-y-4">
              <a 
                href="https://fmpg.vercel.app/about" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                About Us
              </a>
              <a 
                href="https://fmpg.vercel.app/contact" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Contact
              </a>
              <a 
                href="https://fmpg.vercel.app/service" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Our Services
              </a>
              <a 
                href="https://fmpg.vercel.app/FAQs" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                FAQs
              </a>
              <a 
                href="/verify" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Verify Certificate
              </a>
              <a 
                href="/verify-offer" 
                className="block text-lg font-light hover:text-lime-400 transition-colors duration-300"
              >
                Verify Offer Letter
              </a>
            </div>
          </div>
          </div>

          {/* Contact Info Section */}
          <div className="lg:col-span-1 space-y-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">
                CONTACT INFO
              </h3>
              <div className="space-y-4">
                <a 
                  href="tel:+917321835093" 
                  className="block text-xl font-light hover:text-lime-400 transition-colors duration-300 cursor-pointer"
                >
                  +91 73218-35093
                </a>
                <a 
                  href="mailto:fmpg974@gmail.com" 
                  className="block text-xl font-light hover:text-lime-400 transition-colors duration-300 cursor-pointer"
                >
                  <span className="hidden sm:inline">fmpg974@gmail.com</span>
                  <span className="sm:hidden">Email Us</span>
                </a>
              </div>
            </div>
          </div>
           {/* Logo Section */}
         
          <div className="lg:col-span-1 flex justify-center lg:justify-start">
            <div className="relative">
                <a href="https://fmpg.vercel.app/contact">
              <div 
                className="h-[22rem] w-[22rem] sm:h-[18rem] sm:w-[18rem] md:h-[20rem] md:w-[20rem] lg:h-[22rem] lg:w-[22rem] bg-lime-400 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-lime-400/30 hover:-translate-y-2 transform-gpu"
                onClick={scrollToTop}
              >
                <div className="text-center">
                  <div className="absolute top-16 right-10 sm:top-14 sm:right-8 md:top-16 md:right-10 lg:top-20 lg:right-12 transition-transform duration-300 hover:rotate-45">
                    <ArrowUpRight className="w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-gray-900" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold text-gray-900 tracking-wide">
                    PING US
                  </h2>
                </div>
              </div>
              </a>
            </div>
          </div>
        </div>
        

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              Copyright © 2020-2025 <a href="https://fmpg.vercel.app/" className="text-white">FMPG</a>. All rights reserved.
            </p>
            <div className="flex space-x-8">
              <a 
                href="https://fmpg.vercel.app/TermsAndConditions" 
                className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
              >
                Terms and Conditions
              </a>
              <a 
                href="https://fmpg.vercel.app/privacypolicy" 
                className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;