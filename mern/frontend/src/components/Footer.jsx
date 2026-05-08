import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-slate-300 py-8 mt-6">
      <div className="container mx-auto px-4">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold text-white mb-4">FMPG</h3>
            <p className="text-sm mb-4 text-slate-400">
              Your property management partner for innovative solutions and career opportunities.
            </p>
            <div className="flex space-x-4 mt-4">
              {/* Social Media Icons */}
              <a href="https://linkedin.com/company/fmpg" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-lime-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="https://twitter.com/fmpg" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-lime-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.035 10.035 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-lime-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/jobs" className="text-slate-400 hover:text-lime-400 transition-colors">Jobs</Link>
              </li>
              <li>
                <Link to="/verify" className="text-slate-400 hover:text-lime-400 transition-colors">Verify Certificate</Link>
              </li>
              <li>
                <Link to="/TermsAndConditions" className="text-slate-400 hover:text-lime-400 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacypolicy" className="text-slate-400 hover:text-lime-400 transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <address className="not-italic text-sm text-slate-400 space-y-3">
              <p className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                FMPG Headquarters<br />Melbourne, Australia
              </p>
              <p className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                fmpg974@gmail.com
              </p>
            </address>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-6"></div>

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <p>&copy; {currentYear} FMPG. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <Link to="/privacypolicy" className="text-slate-400 hover:text-lime-400 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/TermsAndConditions" className="text-slate-400 hover:text-lime-400 transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
