import Link from "next/link";
import { Signal, Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Contact", href: "/contact" },
    ],
    partners: [
      { name: "Work with Us", href: "/work-with-us" },
      { name: "Partner Portal", href: "/login" },
      { name: "Contractor Program", href: "/work-with-us#contractor" },
      { name: "Referral Program", href: "/work-with-us#referral" },
    ],
    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "Coverage Map", href: "/#coverage" },
      { name: "FAQ", href: "/faq" },
      { name: "Support", href: "/support" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  };

  return (
    <footer className="bg-[#0A0F2C] border-t border-[#2D3B5F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0EA5E9] to-[#06B6D4] rounded-lg flex items-center justify-center">
                <Signal className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SkyYield</span>
            </Link>
            <p className="text-[#94A3B8] text-sm mb-6 max-w-xs">
              Power the people's network. Deploy 6G hotspots and earn USD rewards for expanding decentralized wireless coverage.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/skyyield" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1A1F3A] rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0EA5E9] hover:bg-[#2D3B5F] transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com/company/skyyield" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1A1F3A] rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0EA5E9] hover:bg-[#2D3B5F] transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://github.com/skyyield" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1A1F3A] rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#0EA5E9] hover:bg-[#2D3B5F] transition-all">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[#94A3B8] hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Partners</h4>
            <ul className="space-y-3">
              {footerLinks.partners.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[#94A3B8] hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-[#94A3B8] hover:text-white text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-[#94A3B8] text-sm">
                <Mail className="w-4 h-4 text-[#0EA5E9]" />
                <span>info@skyyield.io</span>
              </li>
              <li className="flex items-center space-x-3 text-[#94A3B8] text-sm">
                <Phone className="w-4 h-4 text-[#0EA5E9]" />
                <span>(678) 203-5517</span>
              </li>
              <li className="flex items-start space-x-3 text-[#94A3B8] text-sm">
                <MapPin className="w-4 h-4 text-[#0EA5E9] mt-0.5" />
                <span>Atlanta, GA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#2D3B5F] flex flex-col md:flex-row justify-between items-center">
          <p className="text-[#64748B] text-sm">
            © {currentYear} SkyYield. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {footerLinks.legal.map((link) => (
              <Link key={link.name} href={link.href} className="text-[#64748B] hover:text-[#94A3B8] text-sm transition-colors">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
