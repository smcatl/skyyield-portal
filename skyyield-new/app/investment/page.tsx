import Link from "next/link";
import { 
  TrendingUp, 
  Shield, 
  DollarSign, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Globe,
  Zap
} from "lucide-react";

export default function InvestmentPage() {
  const investmentTiers = [
    {
      name: "Starter",
      minInvestment: "$5,000",
      expectedReturn: "12-15%",
      term: "12 months",
      features: [
        "Quarterly distributions",
        "Basic investor dashboard",
        "Email updates",
        "Standard support"
      ],
      popular: false
    },
    {
      name: "Growth",
      minInvestment: "$25,000",
      expectedReturn: "15-20%",
      term: "24 months",
      features: [
        "Monthly distributions",
        "Advanced analytics dashboard",
        "Priority support",
        "Quarterly investor calls",
        "Early access to new markets"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      minInvestment: "$100,000+",
      expectedReturn: "20-25%",
      term: "36 months",
      features: [
        "Weekly distributions",
        "Custom reporting",
        "Dedicated account manager",
        "Board observer rights",
        "Co-investment opportunities",
        "Strategic input"
      ],
      popular: false
    }
  ];

  const highlights = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: "18%",
      label: "Average Annual Return"
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: "150+",
      label: "Active Investors"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      value: "500+",
      label: "Deployed Hotspots"
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      value: "$2.5M+",
      label: "Total Distributions"
    }
  ];

  const reasons = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "High-Growth Market",
      description: "The decentralized wireless market is projected to grow 40% annually through 2030."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Asset-Backed",
      description: "Your investment is backed by physical infrastructure generating real revenue."
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Predictable Returns",
      description: "Consistent monthly revenue from network usage provides stable, predictable returns."
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Passive Income",
      description: "We handle operations. You receive regular distributions without active management."
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#10F981]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-full mb-8">
            <TrendingUp className="w-4 h-4 text-[#10F981]" />
            <span className="text-[#94A3B8] text-sm">Investment opportunities</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Invest in the Future of
            <span className="block bg-gradient-to-r from-[#0EA5E9] to-[#10F981] bg-clip-text text-transparent">
              Wireless Infrastructure
            </span>
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-3xl mx-auto mb-12">
            Earn consistent returns by investing in our growing network of 6G hotspots. 
            Real assets, real revenue, real returns.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {highlights.map((item, index) => (
              <div key={index} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#0EA5E9]/10 rounded-lg flex items-center justify-center mx-auto mb-3 text-[#0EA5E9]">
                  {item.icon}
                </div>
                <div className="text-2xl font-bold text-white mb-1">{item.value}</div>
                <div className="text-[#64748B] text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Tiers */}
      <section className="py-20 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Investment Options</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto">
              Choose the tier that matches your investment goals and risk profile.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {investmentTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-[#1A1F3A] border rounded-2xl overflow-hidden ${
                  tier.popular ? 'border-[#0EA5E9]' : 'border-[#2D3B5F]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${tier.popular ? 'pt-14' : ''}`}>
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">{tier.minInvestment}</span>
                    <span className="text-[#64748B] text-sm ml-2">minimum</span>
                  </div>

                  <div className="bg-[#0A0F2C] rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#94A3B8] text-sm">Expected Return</span>
                      <span className="text-[#10F981] font-bold">{tier.expectedReturn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#94A3B8] text-sm">Term</span>
                      <span className="text-white font-medium">{tier.term}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-[#10F981] flex-shrink-0" />
                        <span className="text-[#94A3B8] text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/contact?type=investment"
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white hover:shadow-lg hover:shadow-cyan-500/25'
                        : 'bg-[#2D3B5F] text-white hover:bg-[#3D4B6F]'
                    }`}
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Invest with SkyYield?</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto">
              A unique opportunity to participate in the wireless infrastructure revolution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {reasons.map((reason, index) => (
              <div key={index} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 hover:border-[#0EA5E9]/30 transition-all">
                <div className="w-14 h-14 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center mb-4 text-[#0EA5E9]">
                  {reason.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{reason.title}</h3>
                <p className="text-[#94A3B8]">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0EA5E9]/10 to-[#10F981]/10 border border-[#2D3B5F] rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Investing?
            </h2>
            <p className="text-[#94A3B8] mb-8 max-w-xl mx-auto">
              Schedule a call with our investment team to learn more about opportunities and get your questions answered.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="mailto:invest@skyyield.io"
                className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
              >
                <span>Contact Investment Team</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/docs/investor-deck"
                className="flex items-center space-x-2 px-8 py-4 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-xl font-semibold hover:border-[#0EA5E9] transition-all"
              >
                <span>Download Deck</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-[#2D3B5F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#64748B] text-xs text-center">
            Investment involves risk. Past performance is not indicative of future results. 
            Please review all offering documents carefully before investing. 
            SkyYield investments are available only to accredited investors.
          </p>
        </div>
      </section>
    </div>
  );
}
