import Link from "next/link";
import { 
  ShoppingCart, 
  Wifi, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Star,
  Package,
  Truck,
  Headphones
} from "lucide-react";

export default function StorePage() {
  const products = [
    {
      id: "sky-6g-pro",
      name: "Sky 6G Pro",
      description: "Our flagship hotspot for maximum coverage and earning potential.",
      price: "$599",
      originalPrice: "$799",
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400",
      features: [
        "6G capable hardware",
        "Up to 500m coverage radius",
        "Weather-resistant enclosure",
        "PoE powered",
        "Real-time monitoring"
      ],
      specs: {
        coverage: "500m radius",
        power: "PoE (802.3at)",
        connectivity: "6G / 5G / LTE",
        enclosure: "IP67"
      },
      badge: "Best Seller",
      rating: 4.9,
      reviews: 127
    },
    {
      id: "sky-6g-lite",
      name: "Sky 6G Lite",
      description: "Perfect entry-level option for smaller venues and residential areas.",
      price: "$349",
      originalPrice: "$449",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400",
      features: [
        "6G / 5G support",
        "Up to 200m coverage radius",
        "Indoor/outdoor use",
        "Standard power adapter",
        "Mobile app control"
      ],
      specs: {
        coverage: "200m radius",
        power: "12V DC",
        connectivity: "6G / 5G",
        enclosure: "IP54"
      },
      badge: "Popular",
      rating: 4.7,
      reviews: 89
    },
    {
      id: "sky-mesh-node",
      name: "Sky Mesh Node",
      description: "Extend your network coverage with mesh technology.",
      price: "$199",
      originalPrice: "$249",
      image: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&q=80&w=400",
      features: [
        "Mesh networking",
        "Easy pairing",
        "Compact design",
        "Low power consumption",
        "Auto-optimization"
      ],
      specs: {
        coverage: "100m radius",
        power: "USB-C",
        connectivity: "WiFi 6E",
        enclosure: "IP44"
      },
      badge: null,
      rating: 4.6,
      reviews: 54
    }
  ];

  const benefits = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Shipping",
      description: "On all orders over $500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "2-Year Warranty",
      description: "Full coverage included"
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Expert help anytime"
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Easy Returns",
      description: "30-day money back"
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-full mb-8">
            <ShoppingCart className="w-4 h-4 text-[#0EA5E9]" />
            <span className="text-[#94A3B8] text-sm">Official SkyYield Hardware</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Equipment <span className="bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] bg-clip-text text-transparent">Store</span>
          </h1>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-12">
            Professional-grade hotspot equipment designed for maximum performance and earning potential.
          </p>

          {/* Benefits Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4 flex items-center space-x-3">
                <div className="text-[#0EA5E9]">{benefit.icon}</div>
                <div className="text-left">
                  <div className="text-white font-medium text-sm">{benefit.title}</div>
                  <div className="text-[#64748B] text-xs">{benefit.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-2xl overflow-hidden hover:border-[#0EA5E9]/30 transition-all group"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-[#0A0F2C] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.badge && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-[#0EA5E9] text-white text-xs font-semibold rounded-full">
                      {product.badge}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-[#2D3B5F]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[#94A3B8] text-sm">{product.rating}</span>
                    <span className="text-[#64748B] text-sm">({product.reviews} reviews)</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-[#94A3B8] text-sm mb-4">{product.description}</p>

                  {/* Price */}
                  <div className="flex items-baseline space-x-2 mb-4">
                    <span className="text-2xl font-bold text-white">{product.price}</span>
                    <span className="text-[#64748B] line-through">{product.originalPrice}</span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-[#10F981]" />
                        <span className="text-[#94A3B8]">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <span className="text-[#64748B] text-xs">Coverage</span>
                      <p className="text-white text-sm font-medium">{product.specs.coverage}</p>
                    </div>
                    <div>
                      <span className="text-[#64748B] text-xs">Power</span>
                      <p className="text-white text-sm font-medium">{product.specs.power}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0EA5E9] to-[#06B6D4] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundle Section */}
      <section className="py-20 bg-[#1A1F3A]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0EA5E9]/10 to-[#10F981]/10 border border-[#2D3B5F] rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#10F981]/20 text-[#10F981] rounded-full text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  <span>Save 20%</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Complete Starter Bundle
                </h2>
                <p className="text-[#94A3B8] mb-6">
                  Everything you need to start earning. Includes Sky 6G Pro + 2 Mesh Nodes + Professional Installation.
                </p>
                <div className="flex items-baseline space-x-3 mb-6">
                  <span className="text-4xl font-bold text-white">$899</span>
                  <span className="text-[#64748B] line-through text-xl">$1,147</span>
                </div>
                <Link
                  href="/contact?product=starter-bundle"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#10F981] to-[#059669] text-[#0A0F2C] rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all"
                >
                  <span>Get Bundle Deal</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0F2C] rounded-xl p-4 text-center">
                  <Wifi className="w-8 h-8 text-[#0EA5E9] mx-auto mb-2" />
                  <p className="text-white font-medium">Sky 6G Pro</p>
                  <p className="text-[#64748B] text-sm">x1</p>
                </div>
                <div className="bg-[#0A0F2C] rounded-xl p-4 text-center">
                  <Package className="w-8 h-8 text-[#10F981] mx-auto mb-2" />
                  <p className="text-white font-medium">Mesh Nodes</p>
                  <p className="text-[#64748B] text-sm">x2</p>
                </div>
                <div className="bg-[#0A0F2C] rounded-xl p-4 text-center col-span-2">
                  <Truck className="w-8 h-8 text-[#A855F7] mx-auto mb-2" />
                  <p className="text-white font-medium">Free Pro Installation</p>
                  <p className="text-[#64748B] text-sm">Included</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
          <p className="text-[#94A3B8] mb-8">
            Our team can help you find the right equipment for your location and goals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="mailto:sales@skyyield.io"
              className="flex items-center space-x-2 px-6 py-3 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-xl font-medium hover:border-[#0EA5E9] transition-all"
            >
              <Headphones className="w-5 h-5" />
              <span>Contact Sales</span>
            </Link>
            <Link
              href="/docs/equipment-guide"
              className="text-[#0EA5E9] hover:text-white font-medium transition-colors"
            >
              View Equipment Guide →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
