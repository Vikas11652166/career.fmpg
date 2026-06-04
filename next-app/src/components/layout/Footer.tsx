"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, ChevronUp } from "lucide-react";

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-[#fcfdfd] text-slate-600 border-t border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Brand Block */}
        <div className="md:col-span-5 flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/fmpg-logo.png" 
              alt="FMPG Logo" 
              className="h-10 w-auto shrink-0 group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-heading text-2xl font-black tracking-widest text-[#1E293B] uppercase">
              FM<span className="text-[#10B981]">PG</span>
            </span>
          </Link>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
            Your premier luxury choice for hassle-free and premium student & professional hostel/PG accommodations. Enjoy high-standard comfort with absolute structural integrity.
          </p>
          
          {/* MSME Government Emblem */}
          <div className="mt-2">
            <img 
              src="/msme-logo.png" 
              alt="MSME Registered Enterprise - Govt of India" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>

        {/* Quick Links sitemap */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="w-6 h-[2px] bg-[#10B981]"></div>
            <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mt-1">Navigation</h4>
          </div>
          <nav className="flex flex-col gap-2.5 text-sm text-slate-500 font-semibold">
            <Link href="/" className="hover:text-[#10B981] transition-colors">Home</Link>
            <Link href="/jobs" className="hover:text-[#10B981] transition-colors">Career Openings</Link>
            <Link href="/verify" className="hover:text-[#10B981] transition-colors">Verify Certificates</Link>
            <Link href="/verify-offer" className="hover:text-[#10B981] transition-colors">Verify Offer Letters</Link>
            <a href="https://fmpg.in/about" target="_blank" rel="noopener noreferrer" className="hover:text-[#10B981] transition-colors">About Us</a>
            <a href="https://fmpg.in/contact" target="_blank" rel="noopener noreferrer" className="hover:text-[#10B981] transition-colors">Contact Support</a>
          </nav>
        </div>

        {/* Contacts info */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="w-6 h-[2px] bg-[#10B981]"></div>
            <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-[#1E293B] mt-1">Contact Info</h4>
          </div>
          <div className="flex flex-col gap-3.5 text-sm text-slate-500 font-semibold">
            <a
              href="https://maps.app.goo.gl/KJCAo6hSidjYhC5D8"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2.5 hover:text-[#10B981] transition-colors"
            >
              <MapPin className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
              <span className="font-medium">UIET Hoshiarpur, Punjab, India</span>
            </a>
            <a href="tel:+917321835093" className="flex items-center gap-2.5 hover:text-[#10B981] transition-colors">
              <Phone className="h-4 w-4 text-[#10B981] shrink-0" />
              <span className="font-medium">+91 7321835093</span>
            </a>
            <a href="mailto:contact@fmpg.in" className="flex items-center gap-2.5 hover:text-[#10B981] transition-colors">
              <Mail className="h-4 w-4 text-[#10B981] shrink-0" />
              <span className="font-medium">contact@fmpg.in</span>
            </a>
          </div>
        </div>
      </div>

      {/* Corporate bottom labels */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 border-t border-slate-100 text-xs text-slate-500 font-semibold flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Social icons */}
        <div className="flex items-center gap-3">
          {[
            {
              icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.74-8.836L2.25 2.25h6.907l4.262 5.633L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>,
              href: "https://x.com/Find_My_PG"
            },
            {
              icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
              href: "https://www.facebook.com/profile.php?id=61564104987167"
            },
            {
              icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
              href: "https://www.linkedin.com/company/findmypg/"
            },
            {
              icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
              href: "https://www.instagram.com/f_m_pg"
            },
            {
              icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
              href: "http://www.youtube.com/@FMPG"
            }
          ].map((soc, idx) => (
            <a
              key={idx}
              href={soc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 rounded-full border border-slate-200 hover:border-[#10B981] text-slate-400 hover:text-[#10B981] hover:bg-slate-50 flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              {soc.icon}
            </a>
          ))}
        </div>

        {/* Right side copyright & legal */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-slate-400">
          <span>&copy; {new Date().getFullYear()} FMPG. ALL RIGHTS RESERVED.</span>
          <div className="flex items-center gap-6">
            <a href="https://fmpg.in/terms" target="_blank" rel="noopener noreferrer" className="hover:text-[#10B981] transition-colors">Terms of Use</a>
            <a href="https://fmpg.in/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-[#10B981] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>

      {/* Floating scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#10B981] hover:bg-[#0d9488] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-110 z-50 cursor-pointer animate-in fade-in zoom-in"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}
    </footer>
  );
}
