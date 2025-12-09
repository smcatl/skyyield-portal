"use client"

import { useState, useMemo, useEffect } from "react"

// Type definitions
interface Product {
  id: string
  name: string
  sku: string
  category: string
  manufacturer: string
  msrp: number
  storePrice: number
  partnerPrice: number
  description: string
  features: string
  fullDescription: string
  specs: { label: string; value: string }[]
  highlights: string[]
  images: string[]
  priceId: string
}

interface CartItem {
  product: Product
  quantity: number
  addOns: string[]
}

interface AddOnService {
  id: string
  name: string
  description: string
  priceType: "percentage" | "flat"
  value: number
  icon: string
}

function getCategoryIcon(category: string): string {
  if (category.includes("Switch")) return "📡"
  if (category.includes("Gateway")) return "🌐"
  if (category.includes("Outdoor")) return "📶"
  if (category.includes("Access Point") || category.includes("Indoor")) return "📻"
  return "📦"
}

const addOnServices: AddOnService[] = [
  { id: "warranty-1yr", name: "Extended Warranty - 1 Year", description: "Priority replacement, extends warranty by 1 year", priceType: "percentage", value: 0.10, icon: "🛡️" },
  { id: "warranty-3yr", name: "Extended Warranty - 3 Years", description: "Priority replacement, extends warranty by 3 years", priceType: "percentage", value: 0.25, icon: "🛡️" },
  { id: "pro-install", name: "Professional Installation", description: "On-site installation by certified technician", priceType: "flat", value: 149.00, icon: "🔧" },
  { id: "pre-config", name: "Pre-Configuration Service", description: "Device pre-configured with your network settings", priceType: "flat", value: 49.00, icon: "⚙️" }
]

export default function SkyYieldStore() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Fetch products from Stripe on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products")
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }
        const data = await response.json()
        setProducts(data.products)
      } catch (error) {
        console.error("Error loading products:", error)
        setLoadError("Failed to load products. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)))
    return ["all", ...cats.sort()]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
      const matchesSearch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery, products])

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { product, quantity: 1, addOns: [] }])
    }
    setSelectedProduct(null)
    setIsCartOpen(true)
  }

  const removeFromCart = (productId: string) => setCart(cart.filter(item => item.product.id !== productId))

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) removeFromCart(productId)
    else setCart(cart.map(item => item.product.id === productId ? { ...item, quantity } : item))
  }

  const toggleCartAddOn = (productId: string, addOnId: string) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const hasAddOn = item.addOns.includes(addOnId)
        return { ...item, addOns: hasAddOn ? item.addOns.filter((id: string) => id !== addOnId) : [...item.addOns, addOnId] }
      }
      return item
    }))
  }

  const calculateAddOnPrice = (addOnId: string, productPrice: number, quantity: number): number => {
    const addOn = addOnServices.find(a => a.id === addOnId)
    if (!addOn) return 0
    return addOn.priceType === "percentage" ? productPrice * addOn.value * quantity : addOn.value * quantity
  }

  const cartTotals = useMemo(() => {
    let subtotal = 0
    let addOnsTotal = 0
    cart.forEach(item => {
      subtotal += item.product.partnerPrice * item.quantity
      item.addOns.forEach((addOnId: string) => { addOnsTotal += calculateAddOnPrice(addOnId, item.product.partnerPrice, item.quantity) })
    })
    const tax = (subtotal + addOnsTotal) * 0.0825
    return { subtotal, addOnsTotal, tax, total: subtotal + addOnsTotal + tax }
  }, [cart])

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = async () => {
    setIsProcessing(true)
    setCheckoutError(null)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: cart.map(item => ({
            product: {
              id: item.product.id,
              name: item.product.name,
              sku: item.product.sku,
              partnerPrice: item.product.partnerPrice,
              description: item.product.description,
              priceId: item.product.priceId
            },
            quantity: item.quantity,
            addOns: item.addOns
          }))
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Checkout failed")
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      setCheckoutError(error instanceof Error ? error.message : "An error occurred during checkout")
    } finally {
      setIsProcessing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px", animation: "pulse 2s infinite" }}>📡</div>
          <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Loading Store...</h2>
          <p style={{ color: "#94A3B8" }}>Fetching products from inventory</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>⚠️</div>
          <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Unable to Load Store</h2>
          <p style={{ color: "#94A3B8", marginBottom: "24px" }}>{loadError}</p>
          <button onClick={() => window.location.reload()} style={{ padding: "12px 24px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", border: "none", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", color: "#fff" }}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty products state
  if (products.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "500px" }}>
          <div style={{ fontSize: "48px", marginBottom: "24px" }}>🏪</div>
          <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>Store Coming Soon</h2>
          <p style={{ color: "#94A3B8", marginBottom: "24px" }}>Products are being added to the inventory. Check back soon!</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", color: "#FFFFFF", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Navigation */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "#1A1F3A", borderBottom: "1px solid #2D3B5F", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)" }}>S</div>
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>SkyYield Store</span>
            <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", color: "#0EA5E9", backgroundColor: "rgba(14, 165, 233, 0.1)" }}>Partner Pricing</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)} 
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", background: cartItemCount > 0 ? "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)" : "transparent", border: cartItemCount > 0 ? "none" : "1px solid #2D3B5F", color: cartItemCount > 0 ? "#fff" : "#94A3B8" }}
          >
            🛒 Cart {cartItemCount > 0 && <span style={{ padding: "2px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "bold", backgroundColor: "#10F981", color: "#0A0F2C" }}>{cartItemCount}</span>}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ borderRadius: "16px", padding: "48px", marginBottom: "32px", background: "linear-gradient(135deg, #1A1F3A 0%, #0A0F2C 100%)", border: "1px solid #2D3B5F" }}>
          <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "12px" }}>Network Equipment <span style={{ color: "#0EA5E9" }}>Store</span></h1>
          <p style={{ fontSize: "18px", marginBottom: "24px", maxWidth: "600px", color: "#94A3B8" }}>Enterprise-grade networking equipment with partner pricing. Click any product for detailed specifications.</p>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94A3B8" }}><span style={{ color: "#10F981" }}>✓</span> {products.length} Products</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94A3B8" }}><span style={{ color: "#10F981" }}>✓</span> 5% Partner Discount</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94A3B8" }}><span style={{ color: "#10F981" }}>✓</span> Secure Stripe Checkout</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ borderRadius: "12px", padding: "20px", marginBottom: "24px", display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center", backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F" }}>
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: "250px", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", outline: "none", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#fff" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", color: "#64748B" }}>Category:</span>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: "12px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#fff" }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>)}
            </select>
          </div>
          <span style={{ marginLeft: "auto", fontSize: "14px", color: "#64748B" }}>Showing <strong style={{ color: "#fff" }}>{filteredProducts.length}</strong> products</span>
        </div>

        {/* Category Pills */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "10px 20px", borderRadius: "9999px", fontSize: "14px", fontWeight: "500", cursor: "pointer", backgroundColor: selectedCategory === cat ? "#0EA5E9" : "transparent", border: selectedCategory === cat ? "none" : "1px solid #2D3B5F", color: selectedCategory === cat ? "#fff" : "#94A3B8" }}>
              {cat === "all" ? "All Products" : cat} ({cat === "all" ? products.length : products.filter(p => p.category === cat).length})
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProduct(product)}
              style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F", cursor: "pointer", transition: "all 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "#0EA5E9" }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#2D3B5F" }}
            >
              <div style={{ padding: "32px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0A0F2C", minHeight: "180px", position: "relative" }}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} style={{ maxWidth: "140px", maxHeight: "140px", objectFit: "contain" }} />
                ) : (
                  <div style={{ width: "120px", height: "120px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "56px", backgroundColor: "#2D3B5F" }}>
                    {getCategoryIcon(product.category)}
                  </div>
                )}
                <div style={{ position: "absolute", top: "12px", right: "12px", padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", backgroundColor: "rgba(14, 165, 233, 0.2)", color: "#0EA5E9" }}>
                  Click for Details
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", fontWeight: "500", color: "#0EA5E9", backgroundColor: "rgba(14, 165, 233, 0.1)" }}>{product.category}</span>
                  <span style={{ fontSize: "12px", color: "#64748B" }}>{product.sku}</span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>{product.name}</h3>
                <p style={{ fontSize: "14px", marginBottom: "16px", color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{product.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", textDecoration: "line-through", color: "#64748B" }}>Store ${product.storePrice.toFixed(2)}</div>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "#10F981" }}>${product.partnerPrice.toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(product) }} 
                    style={{ padding: "12px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "none", color: "#fff", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)" }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px", backgroundColor: "#1A1F3A", borderRadius: "16px", border: "1px solid #2D3B5F" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No Products Found</h3>
            <p style={{ color: "#94A3B8" }}>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }} onClick={() => setSelectedProduct(null)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "95%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", zIndex: 70, borderRadius: "20px", backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F" }}>
            <div style={{ position: "sticky", top: 0, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2D3B5F", backgroundColor: "#1A1F3A", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", padding: "4px 12px", borderRadius: "20px", fontWeight: "500", color: "#0EA5E9", backgroundColor: "rgba(14, 165, 233, 0.1)" }}>{selectedProduct.category}</span>
                <span style={{ fontSize: "12px", color: "#64748B" }}>{selectedProduct.sku}</span>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}>✕</button>
            </div>

            <div style={{ padding: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "32px" }}>
                <div style={{ backgroundColor: "#0A0F2C", borderRadius: "16px", padding: "48px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2D3B5F" }}>
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img src={selectedProduct.images[0]} alt={selectedProduct.name} style={{ maxWidth: "100%", maxHeight: "250px", objectFit: "contain" }} />
                  ) : (
                    <div style={{ width: "180px", height: "180px", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "96px", backgroundColor: "#2D3B5F" }}>
                      {getCategoryIcon(selectedProduct.category)}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>{selectedProduct.manufacturer}</span>
                  <h2 style={{ fontSize: "28px", fontWeight: "bold", margin: "8px 0 16px 0" }}>{selectedProduct.name}</h2>
                  <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "24px", color: "#94A3B8" }}>{selectedProduct.fullDescription || selectedProduct.description}</p>
                  
                  <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", padding: "20px", border: "1px solid #2D3B5F", marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                      {selectedProduct.msrp > 0 && (
                        <>
                          <div>
                            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>MSRP</div>
                            <div style={{ fontSize: "16px", textDecoration: "line-through", color: "#64748B" }}>${selectedProduct.msrp.toFixed(2)}</div>
                          </div>
                          <div style={{ width: "1px", height: "40px", backgroundColor: "#2D3B5F" }}></div>
                        </>
                      )}
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Store Price</div>
                        <div style={{ fontSize: "16px", textDecoration: "line-through", color: "#94A3B8" }}>${selectedProduct.storePrice.toFixed(2)}</div>
                      </div>
                      <div style={{ width: "1px", height: "40px", backgroundColor: "#2D3B5F" }}></div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#10F981", marginBottom: "4px" }}>YOUR PRICE</div>
                        <div style={{ fontSize: "28px", fontWeight: "bold", color: "#10F981" }}>${selectedProduct.partnerPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", backgroundColor: "rgba(16, 249, 129, 0.1)", color: "#10F981" }}>
                      You save ${(selectedProduct.storePrice - selectedProduct.partnerPrice).toFixed(2)} (5% Partner Discount)
                    </div>
                  </div>

                  <button onClick={() => addToCart(selectedProduct)} style={{ width: "100%", padding: "16px", borderRadius: "10px", fontSize: "18px", fontWeight: "bold", cursor: "pointer", border: "none", background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)", color: "#fff" }}>
                    Add to Cart
                  </button>
                </div>
              </div>

              {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0EA5E9" }}>Key Highlights</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                    {selectedProduct.highlights.map((highlight, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "10px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F" }}>
                        <span style={{ color: "#10F981", fontSize: "18px" }}>✓</span>
                        <span style={{ fontSize: "14px" }}>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProduct.specs && selectedProduct.specs.length > 0 && (
                <div style={{ marginBottom: "32px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0EA5E9" }}>Technical Specifications</h3>
                  <div style={{ backgroundColor: "#0A0F2C", borderRadius: "12px", border: "1px solid #2D3B5F", overflow: "hidden" }}>
                    {selectedProduct.specs.map((spec, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", borderBottom: idx < selectedProduct.specs.length - 1 ? "1px solid #2D3B5F" : "none" }}>
                        <span style={{ color: "#64748B", fontSize: "14px" }}>{spec.label}</span>
                        <span style={{ fontWeight: "500", fontSize: "14px" }}>{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#0EA5E9" }}>Available Add-On Services</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {addOnServices.map(service => (
                    <div key={service.id} style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "24px" }}>{service.icon}</span>
                        <span style={{ fontWeight: "600", fontSize: "15px" }}>{service.name}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "12px" }}>{service.description}</p>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#0EA5E9" }}>
                        {service.priceType === "percentage" ? `+${service.value * 100}% of product` : `+$${service.value.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: "16px", fontSize: "13px", color: "#64748B", textAlign: "center" }}>
                  Add services when you add item to cart
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setIsCartOpen(false)} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "500px", zIndex: 50, display: "flex", flexDirection: "column", backgroundColor: "#1A1F3A", borderLeft: "1px solid #2D3B5F" }}>
            <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2D3B5F" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Shopping Cart <span style={{ fontSize: "14px", fontWeight: "normal", color: "#94A3B8" }}>({cartItemCount} items)</span></h2>
              <button onClick={() => setIsCartOpen(false)} style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "#64748B" }}><div style={{ fontSize: "48px", marginBottom: "16px" }}>🛒</div><p>Your cart is empty</p></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {cart.map(item => (
                    <div key={item.product.id} style={{ borderRadius: "12px", padding: "20px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F" }}>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0, backgroundColor: "#2D3B5F", overflow: "hidden" }}>
                          {item.product.images && item.product.images.length > 0 ? (
                            <img src={item.product.images[0]} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            getCategoryIcon(item.product.category)
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: "600", fontSize: "14px" }}>{item.product.name}</h4>
                          <p style={{ fontSize: "12px", color: "#64748B" }}>{item.product.sku}</p>
                          <p style={{ fontWeight: "600", marginTop: "4px", color: "#10F981" }}>${item.product.partnerPrice.toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} style={{ fontSize: "18px", background: "none", border: "none", cursor: "pointer" }}>🗑️</button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                        <span style={{ fontSize: "14px", color: "#64748B" }}>Qty:</span>
                        <div style={{ display: "flex", alignItems: "center", borderRadius: "6px", backgroundColor: "#1A1F3A", border: "1px solid #2D3B5F" }}>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}>−</button>
                          <span style={{ width: "40px", textAlign: "center", fontSize: "14px" }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ width: "32px", height: "32px", background: "none", border: "none", color: "#fff", cursor: "pointer" }}>+</button>
                        </div>
                        <span style={{ marginLeft: "auto", fontWeight: "600" }}>${(item.product.partnerPrice * item.quantity).toFixed(2)}</span>
                      </div>
                      <div style={{ paddingTop: "16px", borderTop: "1px solid #2D3B5F" }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#0EA5E9" }}>Add Services</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {addOnServices.map(addOn => {
                            const isSelected = item.addOns.includes(addOn.id)
                            const addOnPrice = calculateAddOnPrice(addOn.id, item.product.partnerPrice, item.quantity)
                            return (
                              <label key={addOn.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px", borderRadius: "8px", cursor: "pointer", backgroundColor: isSelected ? "rgba(14, 165, 233, 0.1)" : "#1A1F3A", border: isSelected ? "1px solid #0EA5E9" : "1px solid #2D3B5F" }}>
                                <input type="checkbox" checked={isSelected} onChange={() => toggleCartAddOn(item.product.id, addOn.id)} style={{ marginTop: "2px", width: "16px", height: "16px", accentColor: "#0EA5E9" }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}><span>{addOn.icon}</span><span style={{ fontSize: "14px", fontWeight: "600" }}>{addOn.name}</span></div>
                                  <p style={{ fontSize: "12px", color: "#64748B" }}>{addOn.description}</p>
                                </div>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: isSelected ? "#10F981" : "#94A3B8" }}>+${addOnPrice.toFixed(2)}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "24px", backgroundColor: "#0A0F2C", borderTop: "1px solid #2D3B5F" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#94A3B8" }}><span>Subtotal</span><span>${cartTotals.subtotal.toFixed(2)}</span></div>
                  {cartTotals.addOnsTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#0EA5E9" }}><span>Services</span><span>${cartTotals.addOnsTotal.toFixed(2)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#64748B" }}><span>Tax (8.25%)</span><span>${cartTotals.tax.toFixed(2)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "20px", fontWeight: "bold", paddingTop: "12px", borderTop: "1px solid #2D3B5F" }}><span>Total</span><span style={{ color: "#10F981" }}>${cartTotals.total.toFixed(2)}</span></div>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  style={{ width: "100%", padding: "16px", borderRadius: "8px", fontSize: "18px", fontWeight: "bold", cursor: isProcessing ? "wait" : "pointer", border: "none", background: isProcessing ? "#64748B" : "linear-gradient(135deg, #10F981 0%, #00FF66 100%)", color: "#0A0F2C", opacity: isProcessing ? 0.7 : 1 }}
                >
                  {isProcessing ? "Processing..." : "Proceed to Checkout →"}
                </button>
                {checkoutError && (
                  <p style={{ textAlign: "center", marginTop: "12px", fontSize: "13px", color: "#EF4444" }}>{checkoutError}</p>
                )}
                <p style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#64748B" }}>🔒 Secure checkout powered by Stripe</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}