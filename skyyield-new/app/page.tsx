import Link from "next/link";
import { 
  Wifi, 
  DollarSign, 
  Shield, 
  Zap, 
  Users, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Rocket,
  BarChart3,
  Building2,
  Handshake
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: <Wifi className="w-8 h-8" />,
      title: "Expand Coverage",
      description: "Help build the future of decentralized wireless networks by deploying hotspots in high-traffic areas.",
      color: "text-[#0EA5E9]",
      bgColor: "bg-[#0EA5E9]/10",
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Earn USD Rewards",
      description: "Get rewarded in real USD for providing network coverage. No crypto volatility - just steady income.",
      color: "text-[#10F981]",
      bgColor: "bg-[#10F981]/10",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with blockchain transparency. Your earnings are protected and verifiable.",
      color: "text-[#A855F7]",
      bgColor: "bg-[#A855F7]/10",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Easy Deployment",
      description: "Simple plug-and-play setup. We handle the technical complexity so you can focus on earning.",
      color: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
    },
  ];

  const stats = [
    { value: "500+", label: "Active Hotspots" },
    { value: "$2.5M+", label: "Rewards Paid" },
    { value: "50+", label: "Cities Covered" },
    { value: "99.9%", label: "Uptime" },
  ];

  const partnerTypes = [
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "Location Partners",
      description: "Own a venue? Host our equipment and earn passive income from network usage.",
      revenue: "Up to $500/month",
      link: "https://form.jotform.com/251408977316161",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Referral Partners",
      description: "Know potential locations? Earn 10% commission on every successful referral.",
      revenue: "10% Commission",
      link: "/work-with-us#referral",
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "Channel Partners",
      description: "Build your own network. Get white-label solutions and 30% revenue share.",
      revenue: "30% Revenue Share",
      link: "/work-with-us#channel",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Apply",
      description: "Fill out our simple application form. We'll review your location and get back to you within 48 hours.",
    },
    {
      number: "02",
      title: "Install",
      description: "Our certified technicians handle the complete installation. No technical knowledge required.",
    },
    {
      number: "03",
      title: "Earn",
      description: "Start earning immediately. Track your rewards in real-time through our partner portal.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0EA5E9]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#10F981]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-full mb-8">
              <span className="w-2 h-2 bg-[#10F981] rounded-full animate-pulse"></span>
              <span className="text-[#94A3B8] text-sm">Now accepting partners nationwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Power The People's
              <span className="block mt-2 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">
                Network
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-[#94A3B8] mb-10 max-w-2xl mx-auto leading-relaxed">
              Deploy 6G hotspots and earn <span className="text-[#10F981] font-semibold">USD rewards</span> for providing coverage to the world's first decentralized wireless network.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="https://form.jotform.com/251408977316161"
                target="_blank"
                className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/25 transition-all"
              >
                <Rocket className="w-5 h-5" />
                <span>Deploy Your Hotspot</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/work-with-us"
                className="flex items-center space-x-2 px-8 py-4 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-xl font-semibold text-lg hover:border-[#0EA5E9] transition-all"
              >
                <Users className="w-5 h-5" />
                <span>Partner with Us</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[#64748B] text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose SkyYield?
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
              Join thousands of partners earning consistent rewards while building the future of connectivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-6 hover:border-[#0EA5E9]/50 transition-all group"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
              Get started in three simple steps. We've made it easy for you to start earning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#0EA5E9] to-transparent -translate-x-1/2 z-0"></div>
                )}
                
                <div className="relative bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8 hover:border-[#0EA5E9]/50 transition-all">
                  <div className="text-6xl font-bold text-[#0EA5E9]/20 mb-4">{step.number}</div>
                  <h3 className="text-2xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-[#94A3B8] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types Section */}
      <section className="py-20 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Multiple Ways to Earn
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
              Choose the partnership model that fits your situation. Everyone can participate in the network.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {partnerTypes.map((partner, index) => (
              <div
                key={index}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8 hover:border-[#10F981]/50 transition-all group"
              >
                <div className="w-12 h-12 bg-[#10F981]/10 rounded-xl flex items-center justify-center mb-6 text-[#10F981] group-hover:scale-110 transition-transform">
                  {partner.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{partner.title}</h3>
                <p className="text-[#94A3B8] text-sm mb-4 leading-relaxed">{partner.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#10F981] font-semibold">{partner.revenue}</span>
                  <Link
                    href={partner.link}
                    className="text-[#0EA5E9] hover:text-white text-sm font-medium flex items-center space-x-1 transition-colors"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Map Placeholder */}
      <section id="coverage" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Network Coverage
            </h2>
            <p className="text-[#94A3B8] text-lg max-w-2xl mx-auto">
              Our network is growing every day. See where we're currently active and where we're expanding next.
            </p>
          </div>

          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8 h-[500px] flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-16 h-16 text-[#0EA5E9] mx-auto mb-4 animate-pulse" />
              <p className="text-[#94A3B8]">Interactive coverage map coming soon</p>
              <p className="text-[#64748B] text-sm mt-2">Currently active in 50+ cities across the US</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0EA5E9]/10 to-[#10F981]/10 border border-[#2D3B5F] rounded-3xl p-12 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0EA5E9]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10F981]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-[#94A3B8] text-lg mb-8 max-w-xl mx-auto">
                Join our network today and start earning rewards for helping build the future of connectivity.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="https://form.jotform.com/251408977316161"
                  target="_blank"
                  className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-cyan-500/25 transition-all"
                >
                  <span>Get Started Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/work-with-us"
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#10F981] to-[#059669] text-[#0A0F2C] rounded-xl font-semibold hover:shadow-2xl hover:shadow-green-500/25 transition-all"
                >
                  <span>Explore Partnerships</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
