"use client";

import { useState } from "react";
import Link from "next/link";
import { Signal, Menu, X, Users, Rocket } from "lucide-react";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Coverage", href: "/#coverage" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Investment", href: "/investment" },
    { name: "Store", href: "/store" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F2C]/95 backdrop-blur-md border-b border-[#2D3B5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center">
              <Signal className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SkyYield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[#94A3B8] hover:text-white transition-colors text-sm font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/work-with-us"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#10F981] to-[#059669] text-[#0A0F2C] rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-green-500/25 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Work with Us</span>
            </Link>
            <Link
              href="https://form.jotform.com/251408977316161"
              target="_blank"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              <Rocket className="w-4 h-4" />
              <span>Deploy Now</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#2D3B5F]">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[#94A3B8] hover:text-white transition-colors text-sm font-medium px-4 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-[#2D3B5F]">
                <Link
                  href="/work-with-us"
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#10F981] to-[#059669] text-[#0A0F2C] rounded-lg font-semibold text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="w-4 h-4" />
                  <span>Work with Us</span>
                </Link>
                <Link
                  href="https://form.jotform.com/251408977316161"
                  target="_blank"
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-semibold text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Rocket className="w-4 h-4" />
                  <span>Deploy Now</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
