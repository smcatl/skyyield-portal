import { TrendingUp, Shield, Clock, DollarSign, Users, BarChart3, Lock, ArrowRight, Bell, CheckCircle, Building, Zap, PieChart } from 'lucide-react'

export default function InvestmentPage() {
  const investmentTiers = [
    {
      name: 'Starter',
      minInvestment: '$5,000',
      expectedReturn: '12-15%',
      term: '12 months',
      features: [
        'Monthly distributions',
        'Quarterly investor reports',
        'Investor portal access',
        'Email support',
        'Pro-rata profit sharing'
      ],
      color: 'from-[#3B82F6] to-[#2563EB]'
    },
    {
      name: 'Growth',
      minInvestment: '$25,000',
      expectedReturn: '15-20%',
      term: '24 months',
      features: [
        'Monthly distributions',
        'Weekly performance reports',
        'Priority investor portal',
        'Dedicated account manager',
        'Early access to new markets',
        'Quarterly investor calls',
        'Tax document preparation'
      ],
      popular: true,
      color: 'from-[#0EA5E9] to-[#06B6D4]'
    },
    {
      name: 'Enterprise',
      minInvestment: '$100,000+',
      expectedReturn: '20-25%',
      term: '36 months',
      features: [
        'Monthly distributions',
        'Real-time reporting dashboard',
        'White-glove concierge service',
        'Board observer rights',
        'Co-investment opportunities',
        'Custom investment structures',
        'Direct line to leadership',
        'Annual investor summit access'
      ],
      color: 'from-[#10F981] to-[#00FF66]'
    }
  ]

  const highlights = [
    { icon: TrendingUp, label: 'Avg. Annual Return', value: '18%', description: 'Historical performance' },
    { icon: Users, label: 'Active Investors', value: '150+', description: 'Growing community' },
    { icon: DollarSign, label: 'Total Distributions', value: '$2.5M+', description: 'Paid to investors' },
    { icon: BarChart3, label: 'Assets Under Mgmt', value: '$15M+', description: 'Infrastructure deployed' }
  ]

  const investmentProcess = [
    {
      step: '01',
      title: 'Application',
      description: 'Complete our investor qualification form and submit required documentation for accreditation verification.'
    },
    {
      step: '02',
      title: 'Review & Approval',
      description: 'Our team reviews your application and schedules a call to discuss investment options and answer questions.'
    },
    {
      step: '03',
      title: 'Fund & Deploy',
      description: 'Execute investment documents, fund your account, and watch your capital get deployed into revenue-generating assets.'
    },
    {
      step: '04',
      title: 'Earn & Track',
      description: 'Receive monthly distributions and track your portfolio performance through our investor portal.'
    }
  ]

  const portfolioBreakdown = [
    { category: 'Restaurant & Hospitality', percentage: 35, color: '#0EA5E9' },
    { category: 'Retail & Shopping Centers', percentage: 25, color: '#10F981' },
    { category: 'Entertainment Venues', percentage: 20, color: '#F59E0B' },
    { category: 'Transportation Hubs', percentage: 15, color: '#A855F7' },
    { category: 'Other High-Traffic', percentage: 5, color: '#EC4899' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10F981]/10 border border-[#10F981]/30 rounded-full mb-6">
            <TrendingUp className="w-4 h-4 text-[#10F981]" />
            <span className="text-[#10F981] text-sm font-medium">Investment Opportunity</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Invest in the Future of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0EA5E9] to-[#10F981]">
              Wireless Infrastructure
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            Join our network of investors earning passive income from WiFi hotspot deployments 
            across high-traffic locations nationwide. Asset-backed investments with predictable, 
            recurring revenue streams.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {highlights.map((item, index) => (
              <div key={index} className="bg-[#1A1F3A]/50 border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9]/50 transition-colors">
                <item.icon className="w-8 h-8 text-[#0EA5E9] mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                <div className="text-white font-medium text-sm">{item.label}</div>
                <div className="text-gray-500 text-xs mt-1">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#0EA5E9]/20 to-[#10F981]/20 border border-[#0EA5E9]/30 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0EA5E9]/20 rounded-full mb-4">
              <Bell className="w-8 h-8 text-[#0EA5E9]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Investment Portal Launching Soon
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              We're putting the finishing touches on our investor platform. Join the waitlist 
              to get early access and be first in line when opportunities become available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:invest@skyyield.io?subject=Investment%20Waitlist%20-%20Early%20Access"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
              >
                <Bell className="w-5 h-5" />
                Join the Waitlist
              </a>
              <a
                href="tel:+16782035517"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2D3B5F] text-white rounded-xl font-semibold hover:bg-[#1A1F3A] transition-all"
              >
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Tiers */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Investment Tiers
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Choose the investment level that matches your goals. All tiers include access 
              to our diversified portfolio of revenue-generating WiFi infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {investmentTiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative bg-[#1A1F3A] border rounded-2xl p-8 ${
                  tier.popular 
                    ? 'border-[#0EA5E9] shadow-lg shadow-[#0EA5E9]/20' 
                    : 'border-[#2D3B5F]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 bg-[#0A0F2C]/70 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                  <div className="bg-[#1A1F3A] border border-[#0EA5E9]/50 px-6 py-3 rounded-full shadow-lg">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#0EA5E9]" />
                      <span className="text-white font-medium">Coming Soon</span>
                    </div>
                  </div>
                </div>

                <div className="opacity-60">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="mb-2">
                    <span className="text-gray-400">Minimum: </span>
                    <span className="text-white font-semibold text-xl">{tier.minInvestment}</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-gray-400">Term: </span>
                    <span className="text-white">{tier.term}</span>
                  </div>
                  
                  <div className={`inline-block px-4 py-2 bg-gradient-to-r ${tier.color} rounded-lg mb-6`}>
                    <span className="text-white font-bold text-lg">{tier.expectedReturn}</span>
                    <span className="text-white/80 text-sm ml-1">Target Annual Return</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-[#10F981] flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled
                    className="w-full py-3 bg-[#2D3B5F] text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Investment Works
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              A straightforward process to start earning passive income from WiFi infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {investmentProcess.map((item, index) => (
              <div key={index} className="relative">
                {index < investmentProcess.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#0EA5E9] to-transparent" />
                )}
                <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 relative z-10">
                  <div className="text-4xl font-bold text-[#0EA5E9]/30 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Breakdown */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Diversified Portfolio
              </h2>
              <p className="text-gray-400 mb-8">
                Your investment is spread across multiple high-traffic location categories, 
                reducing risk while maximizing revenue potential. Our strategic deployment 
                focuses on venues with proven foot traffic patterns.
              </p>

              <div className="space-y-4">
                {portfolioBreakdown.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white font-medium">{item.category}</span>
                      <span className="text-gray-400">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-[#1A1F3A] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Investment Highlights</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">500+ Active Locations</h4>
                    <p className="text-gray-400 text-sm">Deployed across 50+ cities nationwide with proven revenue generation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#10F981]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-[#10F981]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">99.9% Uptime</h4>
                    <p className="text-gray-400 text-sm">Enterprise-grade infrastructure ensures consistent revenue streams.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PieChart className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Monthly Distributions</h4>
                    <p className="text-gray-400 text-sm">Regular income deposits directly to your account every month.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-[#A855F7]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-[#A855F7]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Asset-Backed Security</h4>
                    <p className="text-gray-400 text-sm">Investments secured by physical infrastructure and long-term agreements.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Invest Section */}
      <section className="py-20 px-4 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Invest with SkyYield?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our investment model is designed to provide consistent, attractive returns 
              backed by real infrastructure assets in a rapidly growing market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9]/50 transition-colors">
              <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-[#0EA5E9]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">High-Growth Market</h3>
              <p className="text-gray-400">
                WiFi infrastructure demand is growing 25% annually as connectivity becomes essential for businesses and consumers.
              </p>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#10F981]/50 transition-colors">
              <div className="w-12 h-12 bg-[#10F981]/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#10F981]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Asset-Backed</h3>
              <p className="text-gray-400">
                Investments are secured by physical infrastructure with long-term location agreements and predictable cash flows.
              </p>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#F59E0B]/50 transition-colors">
              <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Predictable Returns</h3>
              <p className="text-gray-400">
                Recurring revenue model from data usage and subscriptions provides consistent, predictable monthly distributions.
              </p>
            </div>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#A855F7]/50 transition-colors">
              <div className="w-12 h-12 bg-[#A855F7]/20 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-[#A855F7]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Passive Income</h3>
              <p className="text-gray-400">
                Earn monthly distributions without any active management responsibilities. We handle all operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join our investor waitlist and be the first to know when investment 
            opportunities become available. Limited spots for early investors.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:invest@skyyield.io?subject=Investment%20Inquiry%20-%20Priority%20Access"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#0EA5E9]/25 transition-all"
            >
              Contact Investment Team
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/work-with-us"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2D3B5F] text-white rounded-xl font-semibold hover:bg-[#1A1F3A] transition-all"
            >
              Explore Partner Options
            </a>
          </div>

          <p className="text-gray-500 text-sm mt-8">
            Questions? Call us at <a href="tel:+16782035517" className="text-[#0EA5E9] hover:underline">(678) 203-5517</a> or 
            email <a href="mailto:invest@skyyield.io" className="text-[#0EA5E9] hover:underline">invest@skyyield.io</a>
          </p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4 border-t border-[#2D3B5F]">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500 text-sm text-center">
            <strong className="text-gray-400">Investment Disclaimer:</strong> All investments involve risk 
            and may result in partial or total loss. Past performance is not indicative of future results. 
            The information presented is for informational purposes only and does not constitute an offer 
            to sell or a solicitation of an offer to buy any securities. Investment opportunities are 
            available only to accredited investors as defined by SEC regulations. Prospective investors 
            should consult with their own legal, tax, and financial advisors before making any investment decisions.
          </p>
        </div>
      </section>
    </div>
  )
}
