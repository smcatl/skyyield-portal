import Link from "next/link";
import { 
  Users, 
  Briefcase, 
  Handshake, 
  Share2, 
  ArrowRight, 
  DollarSign, 
  CheckCircle2,
  Wrench,
  Building2,
  TrendingUp,
  Shield,
  Clock,
  Headphones
} from "lucide-react";

export default function WorkWithUsPage() {
  const partnerTypes = [
    {
      id: "referral",
      title: "Referral Partner",
      subtitle: "Earn by introducing",
      description: "Know businesses that could benefit from our network? Earn generous commissions just for making introductions.",
      icon: <Share2 className="w-10 h-10" />,
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      revenueShare: "10%",
      revenueLabel: "of Revenue",
      clientOwnership: "No",
      equipment: "None required",
      installation: "SkyYield handles",
      maintenance: "SkyYield handles",
      payouts: "SkyYield handles",
      benefits: [
        "No upfront investment needed",
        "Simple introduction model",
        "Monthly commission payouts",
        "Marketing materials provided",
        "Real-time referral tracking",
        "No ongoing responsibilities"
      ],
      formUrl: "https://form.jotform.com/251408819176160"
    },
    {
      id: "relationship",
      title: "Relationship Partner",
      subtitle: "Manage & grow together",
      description: "Build strategic partnerships by managing client relationships. Higher revenue share for deeper involvement.",
      icon: <Handshake className="w-10 h-10" />,
      color: "from-green-500 to-emerald-600",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
      revenueShare: "20%",
      revenueLabel: "of Revenue",
      clientOwnership: "Shared",
      equipment: "Partner purchases",
      installation: "SkyYield handles",
      maintenance: "SkyYield handles",
      payouts: "SkyYield handles",
      benefits: [
        "Higher revenue share",
        "Client relationship ownership",
        "Joint marketing initiatives",
        "Priority access to new markets",
        "Dedicated partner manager",
        "Co-branded opportunities"
      ],
      formUrl: "https://form.jotform.com/251410887909162"
    },
    {
      id: "channel",
      title: "Channel Partner",
      subtitle: "Build your own network",
      description: "Full autonomy with maximum rewards. Own your clients, manage operations, and earn the highest revenue share.",
      icon: <Users className="w-10 h-10" />,
      color: "from-orange-500 to-amber-600",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
      revenueShare: "30%",
      revenueLabel: "of Revenue",
      clientOwnership: "Yes",
      equipment: "Partner owns",
      installation: "Partner handles",
      maintenance: "Partner handles",
      payouts: "Partner handles",
      benefits: [
        "Highest revenue share available",
        "Full client ownership",
        "White-label or co-branded options",
        "Exclusive territory rights",
        "Complete business autonomy",
        "Technical certification included"
      ],
      formUrl: "https://form.jotform.com/251410977794164"
    },
    {
      id: "contractor",
      title: "Contractor",
      subtitle: "Technical services",
      description: "Join our certified contractor network. Handle installations and maintenance for steady project income.",
      icon: <Wrench className="w-10 h-10" />,
      color: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      revenueShare: "Service",
      revenueLabel: "Based Fees",
      clientOwnership: "No",
      equipment: "None required",
      installation: "You perform",
      maintenance: "You perform",
      payouts: "Per job",
      benefits: [
        "Steady stream of projects",
        "Competitive compensation",
        "Training & certification",
        "Technical support provided",
        "Flexible scheduling",
        "No equipment investment"
      ],
      formUrl: "https://form.jotform.com/251410958602151"
    }
  ];

  const comparisonData = [
    { label: "Key Role", referral: "Introductions", relationship: "Manages relationships", channel: "Full lifecycle" },
    { label: "Client Ownership", referral: "No", relationship: "Shared", channel: "Yes" },
    { label: "Equipment", referral: "None", relationship: "Partner buys", channel: "Partner owns" },
    { label: "Installation", referral: "SkyYield", relationship: "SkyYield", channel: "Partner" },
    { label: "Maintenance", referral: "SkyYield", relationship: "SkyYield", channel: "Partner" },
    { label: "Revenue Share", referral: "10%", relationship: "20%", channel: "30%" },
  ];

  const whyPartner = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Growing Market",
      description: "Be part of the rapidly expanding decentralized wireless infrastructure market"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Proven Technology",
      description: "Work with cutting-edge 6G technology and reliable blockchain-based systems"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Strong Support",
      description: "Comprehensive training, marketing materials, and ongoing assistance"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Fast Onboarding",
      description: "Get started quickly with our streamlined partner onboarding process"
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#10F981]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-full mb-8">
            <Users className="w-4 h-4 text-[#10F981]" />
            <span className="text-[#94A3B8] text-sm">Join our partner ecosystem</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Work with <span className="bg-gradient-to-r from-[#0EA5E9] to-[#10F981] bg-clip-text text-transparent">SkyYield</span>
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-3xl mx-auto mb-8">
            Choose the partnership model that fits your goals. From simple referrals to full channel partnerships, 
            there's an opportunity for everyone.
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 bg-[#1A1F3A]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Quick Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[#2D3B5F]">
                  <th className="py-4 px-4 text-left text-[#94A3B8] font-medium">Feature</th>
                  <th className="py-4 px-4 text-center text-purple-400 font-semibold">Referral</th>
                  <th className="py-4 px-4 text-center text-green-400 font-semibold">Relationship</th>
                  <th className="py-4 px-4 text-center text-orange-400 font-semibold">Channel</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-[#2D3B5F]/50">
                    <td className="py-4 px-4 text-[#94A3B8] font-medium">{row.label}</td>
                    <td className="py-4 px-4 text-center text-white">{row.referral}</td>
                    <td className="py-4 px-4 text-center text-white">{row.relationship}</td>
                    <td className="py-4 px-4 text-center text-white">{row.channel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Partner Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {partnerTypes.map((partner) => (
              <div
                key={partner.id}
                id={partner.id}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl overflow-hidden hover:border-[#0EA5E9]/30 transition-all group"
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-r ${partner.color} p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm mb-1">{partner.subtitle}</p>
                      <h3 className="text-2xl font-bold text-white">{partner.title}</h3>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white">
                      {partner.icon}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <p className="text-[#94A3B8] mb-6">{partner.description}</p>

                  {/* Revenue Share Highlight */}
                  <div className="flex items-center justify-center bg-[#0A0F2C] rounded-xl p-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-[#10F981]">{partner.revenueShare}</span>
                        <span className="text-[#94A3B8] ml-2">{partner.revenueLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-3 mb-6">
                    {partner.benefits.slice(0, 4).map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-[#10F981] flex-shrink-0 mt-0.5" />
                        <span className="text-[#94A3B8] text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={partner.formUrl}
                    target="_blank"
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r ${partner.color} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
                  >
                    <span>Apply as {partner.title}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="py-20 bg-[#1A1F3A]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Partner with SkyYield?</h2>
            <p className="text-[#94A3B8] max-w-2xl mx-auto">
              Join a growing ecosystem backed by proven technology and dedicated support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyPartner.map((item, index) => (
              <div key={index} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 text-center hover:border-[#0EA5E9]/30 transition-all">
                <div className="w-12 h-12 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-[#0EA5E9]">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[#94A3B8] text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Have Questions?</h2>
          <p className="text-[#94A3B8] mb-8">
            Our partnership team is here to help you find the right opportunity.
          </p>
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-[#64748B] text-sm mb-1">Email</p>
                <a href="mailto:info@skyyield.io" className="text-[#0EA5E9] font-medium hover:text-white transition-colors">
                  info@skyyield.io
                </a>
              </div>
              <div>
                <p className="text-[#64748B] text-sm mb-1">Phone</p>
                <a href="tel:+16782035517" className="text-[#0EA5E9] font-medium hover:text-white transition-colors">
                  (678) 203-5517
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
