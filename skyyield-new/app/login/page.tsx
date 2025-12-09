"use client";

import { useState } from "react";
import Link from "next/link";
import { Signal, Mail, Lock, ArrowRight, Eye, EyeOff, Users } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("referral");
  const [isLoading, setIsLoading] = useState(false);

  const userTypes = [
    { id: "referral", label: "Referral Partner", color: "from-purple-500 to-purple-600" },
    { id: "location", label: "Location Partner", color: "from-blue-500 to-cyan-600" },
    { id: "relationship", label: "Relationship Partner", color: "from-green-500 to-emerald-600" },
    { id: "channel", label: "Channel Partner", color: "from-orange-500 to-amber-600" },
    { id: "contractor", label: "Contractor", color: "from-cyan-500 to-blue-600" },
    { id: "admin", label: "Admin", color: "from-red-500 to-rose-600" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Connect to Base44 authentication
    console.log("Login attempt:", { email, password, userType });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For now, redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10F981]/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-xl flex items-center justify-center">
              <Signal className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SkyYield</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Partner Portal</h1>
          <p className="text-[#94A3B8]">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                {userTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      userType === type.id
                        ? `bg-gradient-to-r ${type.color} text-white`
                        : 'bg-[#0A0F2C] text-[#94A3B8] hover:text-white border border-[#2D3B5F]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl text-white placeholder-[#64748B] focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-[#0A0F2C] border border-[#2D3B5F] rounded-xl text-white placeholder-[#64748B] focus:border-[#0EA5E9] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9] focus:ring-offset-0"
                />
                <span className="text-sm text-[#94A3B8]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#0EA5E9] hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2D3B5F]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1A1F3A] text-[#64748B]">New to SkyYield?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/work-with-us"
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-[#0A0F2C] border border-[#2D3B5F] text-white rounded-xl font-semibold hover:border-[#10F981] transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Become a Partner</span>
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-[#64748B] text-sm mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:support@skyyield.io" className="text-[#0EA5E9] hover:text-white transition-colors">
            support@skyyield.io
          </a>
        </p>
      </div>
    </div>
  );
}
