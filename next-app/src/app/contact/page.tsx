"use client";

import React, { useState, useTransition } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { submitContactInquiryAction } from "@/app/actions/contact";
import { MapPin, Mail, Phone, Globe, Send, User, MessageSquare, Building, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });

  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitContactInquiryAction(formData);
        if (res.success) {
          toast.success(res.message);
          setFormData({
            name: "",
            email: "",
            phone: "",
            company: "",
            message: ""
          });
        } else {
          toast.error(res.message || "Failed to submit message.");
        }
      } catch (err) {
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Decorative gradient glow panels for dark theme aesthetic */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-grow pt-28 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          
          {/* Headline Card */}
          <div className="w-full py-16 bg-card/40 border border-border/30 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <span className="text-primary font-black text-xs tracking-widest uppercase mb-3 relative pl-8 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[2px] before:w-6 before:bg-primary">
              Connect With Us
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl font-black text-foreground tracking-tight leading-none uppercase">
              Get In Touch
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm font-semibold max-w-md mt-4 leading-relaxed">
              Have questions about career paths, internships, or digital co-living engineering at FMPG? Reach out to our HR and support desk instantly.
            </p>
          </div>

          {/* Contact Details Grid & Form Wrapper */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Info Columns */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Location Card */}
              <div className="glass-panel p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-border/40 flex flex-col gap-4 text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-1 uppercase tracking-wide">FMPG Punjab HQ</h3>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    #51, Bhakra Road, Nangal,<br />
                    Punjab - 140124, India
                  </p>
                </div>
              </div>

              {/* Support Contacts Card */}
              <div className="glass-panel p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-border/40 flex flex-col gap-4 text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-3 uppercase tracking-wide">General Inquiries</h3>
                  <div className="flex flex-col gap-3 text-xs text-muted-foreground font-semibold">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:contact@fmpg.in" className="hover:text-primary transition-colors">contact@fmpg.in</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href="tel:+917321835093" className="hover:text-primary transition-colors">+91 73218-35093</a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Channels Card */}
              <div className="glass-panel p-8 rounded-3xl bg-card/60 backdrop-blur-md border border-border/40 flex flex-col gap-4 text-left">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2 uppercase tracking-wide">Digital Presence</h3>
                  <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                    Follow FMPG developments, internship highlights, and property additions:
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-primary mt-4 uppercase tracking-widest">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
                    <span className="text-muted-foreground/30">•</span>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>
                    <span className="text-muted-foreground/30">•</span>
                    <a href="https://fmpg.in" target="_blank" rel="noopener noreferrer" className="hover:underline">FMPG.in</a>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Contact Form Column */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-8 sm:p-10 rounded-[32px] bg-card/60 backdrop-blur-md border border-border/40 text-left relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <h2 className="font-heading text-2xl font-black text-foreground mb-2 uppercase tracking-wide">
                  Send A Message
                </h2>
                <p className="text-xs text-muted-foreground font-semibold leading-relaxed mb-8">
                  Share your ideas or specific employment questions. We receive and review submissions within 24 business hours.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  
                  {/* Name and Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                        Your Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <input
                          id="name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <input
                          id="email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Skype/Phone and Company Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phone" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                        Skype / Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <input
                          id="phone"
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 99999-99999"
                          className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="company" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                        Company Name
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <input
                          id="company"
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Your Organization"
                          className="w-full h-11 pl-10 pr-4 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-[10px] font-black uppercase text-muted-foreground tracking-wider pl-1">
                      Your Message *
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-4 h-4 w-4 text-muted-foreground/60" />
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Hello, I would like to inquire about..."
                        className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border/40 focus:border-primary/60 rounded-xl text-xs font-semibold focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-12 w-full mt-2 rounded-2xl bg-primary text-white hover:bg-primary/95 font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Inquiry
                      </>
                    )}
                  </button>

                </form>
              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
