'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Wifi, ChevronDown } from 'lucide-react'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [partnerDropdown, setPartnerDropdown] = useState(false)
  const { user } = useUser()

  // Check if user is approved
  const isApproved = () => {
    if (!user) return false
    const status = (user.unsafeMetadata as any)?.status
    return status === 'approved'
  }

  // Determine dashboard URL based on user type and approval status
  const getDashboardUrl = () => {
    if (!user) return '/dashboard'
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    // If not approved, always go to pending approval
    if (status !== 'approved') {
      return '/pending-approval'
    }
    
    const userType = (user.unsafeMetadata as any)?.userType || ''
    
    switch (userType) {
      case 'Administrator':
      case 'Employee':
        return '/portals/admin'
      case 'Referral Partner':
        return '/portals/referral'
      case 'Location Partner':
        return '/portals/location'
      case 'Channel Partner':
        return '/portals/channel'
      case 'Relationship Partner':
        return '/portals/relationship'
      case 'Contractor':
        return '/portals/contractor'
      case 'Calculator Access':
        return '/portals/calculator'
      case 'Customer':
        return '/portals/customer'
      default:
        return '/pending-approval'
    }
  }

  // Get the label for the dashboard button
  const getDashboardLabel = () => {
    if (!user) return 'Dashboard'
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    
    if (status !== 'approved') {
      return 'Pending'
    }
    
    return 'Dashboard'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0F2C]/95 backdrop-blur-md border-b border-[#2D3B5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SkyYield</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            
            {/* Partner Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setPartnerDropdown(true)}
              onMouseLeave={() => setPartnerDropdown(false)}
            >
              <button className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors py-4">
                Partners <ChevronDown className={`w-4 h-4 transition-transform ${partnerDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {partnerDropdown && (
                <div className="absolute top-full left-0 pt-2">
                  <div className="w-56 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg shadow-xl py-2">
                    <Link 
                      href="/work-with-us" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2D3B5F] transition-colors"
                    >
                      Become a Partner
                    </Link>
                    <Link 
                      href="/work-with-us#referral" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2D3B5F] transition-colors"
                    >
                      Referral Partner
                    </Link>
                    <Link 
                      href="/work-with-us#location" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2D3B5F] transition-colors"
                    >
                      Location Partner
                    </Link>
                    <Link 
                      href="/work-with-us#channel" 
                      className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-[#2D3B5F] transition-colors"
                    >
                      Channel Partner
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link href="/investment" className="text-gray-300 hover:text-white transition-colors">
              Invest
            </Link>
            <Link href="/store" className="text-gray-300 hover:text-white transition-colors">
              Store
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
              Blog
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <Link 
                href="/sign-in"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
              >
                Get Started
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link 
                href={getDashboardUrl()}
                className={`transition-colors ${isApproved() ? 'text-gray-300 hover:text-white' : 'text-yellow-400 hover:text-yellow-300'}`}
              >
                {getDashboardLabel()}
              </Link>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[#2D3B5F]">
            <div className="flex flex-col gap-4">
              <Link 
                href="/" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/work-with-us" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Become a Partner
              </Link>
              <Link 
                href="/investment" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Invest
              </Link>
              <Link 
                href="/store" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Store
              </Link>
              <Link 
                href="/blog" 
                className="text-gray-300 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Blog
              </Link>
              
              <SignedOut>
                <Link 
                  href="/sign-in" 
                  className="text-gray-300 hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/sign-up"
                  className="px-4 py-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-lg font-medium text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </SignedOut>
              
              <SignedIn>
                <Link 
                  href={getDashboardUrl()} 
                  className={`transition-colors ${isApproved() ? 'text-gray-300 hover:text-white' : 'text-yellow-400 hover:text-yellow-300'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {getDashboardLabel()}
                </Link>
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-gray-300">My Account</span>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}