"use client"

import { useState, useEffect, useRef } from "react"

interface Product {
  id: string
  priceId: string
  name: string
  description: string
  sku: string
  category: string
  manufacturer: string
  msrp: number
  storePrice: number
  markup: number
  features: string
  typeLayer: string
  availability: string
  productUrl: string
  images: string[]
  active: boolean
  showInStore: boolean
  createdAt: number
}

interface ProductFormData {
  id?: string
  priceId?: string
  name: string
  description: string
  sku: string
  category: string
  manufacturer: string
  msrp: number
  storePrice: number
  markup: number
  features: string
  typeLayer: string
  availability: string
  productUrl: string
  images: string[]
}

const emptyProduct: ProductFormData = {
  name: "",
  description: "",
  sku: "",
  category: "Switches",
  manufacturer: "Ubiquiti",
  msrp: 0,
  storePrice: 0,
  markup: 0.2,
  features: "",
  typeLayer: "",
  availability: "In Stock",
  productUrl: "",
  images: ["", "", ""],
}

const categories = ["Switches", "Gateways", "Indoor Access Points", "Outdoor Access Points", "Accessories"]
const availabilityOptions = ["In Stock", "Low Stock", "Out of Stock", "Pre-Order"]

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFormData>(emptyProduct)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<ProductFormData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/products")
      if (!response.ok) throw new Error("Failed to fetch products")
      const data = await response.json()
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct({
        id: product.id,
        priceId: product.priceId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        category: product.category,
        manufacturer: product.manufacturer,
        msrp: product.msrp,
        storePrice: product.storePrice,
        markup: product.markup,
        features: product.features,
        typeLayer: product.typeLayer || "",
        availability: product.availability,
        productUrl: product.productUrl,
        images: [...product.images, "", "", ""].slice(0, 3),
      })
      setIsEditing(true)
    } else {
      setEditingProduct(emptyProduct)
      setIsEditing(false)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(emptyProduct)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!editingProduct.name || !editingProduct.storePrice) {
      alert("Name and Store Price are required")
      return
    }

    setIsSaving(true)
    try {
      const method = isEditing ? "PUT" : "POST"
      const response = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          images: editingProduct.images.filter(img => img),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save product")
      }

      await fetchProducts()
      handleCloseModal()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"? This will remove it from the store.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete product")
      await fetchProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  const handleToggleVisibility = async (product: Product) => {
    try {
      const newVisibility = product.showInStore === false ? true : false
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          priceId: product.priceId,
          name: product.name,
          description: product.description,
          sku: product.sku,
          category: product.category,
          manufacturer: product.manufacturer,
          msrp: product.msrp,
          storePrice: product.storePrice,
          markup: product.markup,
          features: product.features,
          typeLayer: product.typeLayer,
          availability: product.availability,
          productUrl: product.productUrl,
          images: product.images,
          showInStore: newVisibility,
        }),
      })

      if (!response.ok) throw new Error("Failed to update visibility")
      
      // Update local state immediately for responsive UI
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, showInStore: newVisibility } : p
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update visibility")
    }
  }

  // Handle file selection for import
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      alert("Please upload an Excel file (.xlsx, .xls) or CSV file")
      return
    }

    setIsImporting(true)
    setImportStatus("Reading file...")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch("/api/admin/products/parse", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to parse file")
      }

      const data = await response.json()
      setImportPreview(data.products)
      setIsImportModalOpen(true)
      setImportStatus(null)
    } catch (err) {
      setImportStatus(`Error: ${err instanceof Error ? err.message : "Failed to read file"}`)
      setTimeout(() => setImportStatus(null), 5000)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Execute the import
  const handleExecuteImport = async () => {
    if (importPreview.length === 0) return

    setIsImporting(true)
    setImportStatus("Importing products to Stripe...")

    try {
      const response = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: importPreview }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Import failed")

      setImportStatus(`✓ Import complete! Created: ${data.results.created}, Skipped: ${data.results.skipped}, Failed: ${data.results.failed}`)
      setIsImportModalOpen(false)
      setImportPreview([])
      
      await fetchProducts()
      
      setTimeout(() => setImportStatus(null), 5000)
    } catch (err) {
      setImportStatus(`✗ Import failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: string | number | string[]) => {
    setEditingProduct(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...editingProduct.images]
    newImages[index] = value
    setEditingProduct(prev => ({ ...prev, images: newImages }))
  }

  const handleMsrpChange = (msrp: number) => {
    const storePrice = msrp * (1 + editingProduct.markup)
    setEditingProduct(prev => ({ ...prev, msrp, storePrice: Math.round(storePrice * 100) / 100 }))
  }

  const handleMarkupChange = (markup: number) => {
    const storePrice = editingProduct.msrp * (1 + markup)
    setEditingProduct(prev => ({ ...prev, markup, storePrice: Math.round(storePrice * 100) / 100 }))
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const partnerPrice = (storePrice: number) => storePrice * 0.95

  if (isLoading) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "24px", marginBottom: "16px" }}>📦</div>
        <p style={{ color: "#94A3B8" }}>Loading products from Stripe...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: "32px", paddingTop: "100px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px", color: "#FFFFFF" }}>Store Products</h1>
          <p style={{ color: "#94A3B8" }}>Manage products synced with Stripe • {products.length} products</p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: isImporting ? "wait" : "pointer",
              border: "1px solid #2D3B5F",
              backgroundColor: "transparent",
              color: "#94A3B8",
              opacity: isImporting ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📥 {isImporting ? "Processing..." : "Import Excel"}
          </button>
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
              color: "#FFFFFF",
            }}
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Import Status */}
      {importStatus && (
        <div style={{
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          backgroundColor: importStatus.startsWith("✗") ? "rgba(239, 68, 68, 0.1)" : importStatus.startsWith("✓") ? "rgba(16, 249, 129, 0.1)" : "rgba(14, 165, 233, 0.1)",
          border: `1px solid ${importStatus.startsWith("✗") ? "#EF4444" : importStatus.startsWith("✓") ? "#10F981" : "#0EA5E9"}`,
          color: importStatus.startsWith("✗") ? "#EF4444" : importStatus.startsWith("✓") ? "#10F981" : "#0EA5E9",
        }}>
          {importStatus}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "8px", marginBottom: "24px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", color: "#EF4444" }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            color: "#FFFFFF",
          }}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            color: "#FFFFFF",
          }}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: "#1A1F3A", borderRadius: "12px", border: "1px solid #2D3B5F", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0A0F2C" }}>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>SKU</th>
                <th style={{ padding: "16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</th>
                <th style={{ padding: "16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>MSRP</th>
                <th style={{ padding: "16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Store Price</th>
                <th style={{ padding: "16px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Partner Price</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Visible</th>
                <th style={{ padding: "16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "48px", textAlign: "center", color: "#64748B" }}>
                    {products.length === 0 ? (
                      <div>
                        <div style={{ fontSize: "32px", marginBottom: "16px" }}>📦</div>
                        <p style={{ marginBottom: "8px" }}>No products yet.</p>
                        <p style={{ fontSize: "14px" }}>Click "Import Excel" to upload your product catalog or "Add Product" to add one manually.</p>
                      </div>
                    ) : (
                      <p>No products match your search criteria</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product.id} style={{ borderTop: index > 0 ? "1px solid #2D3B5F" : "none" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "8px",
                          backgroundColor: "#0A0F2C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}>
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "24px" }}>📦</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "600", color: "#FFFFFF", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>{product.manufacturer}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px", fontFamily: "monospace", fontSize: "13px", color: "#94A3B8" }}>{product.sku || "—"}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "4px", backgroundColor: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9", whiteSpace: "nowrap" }}>
                        {product.category || "Uncategorized"}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "right", color: "#64748B" }}>${product.msrp?.toFixed(2) || "0.00"}</td>
                    <td style={{ padding: "16px", textAlign: "right", color: "#FFFFFF", fontWeight: "600" }}>${product.storePrice?.toFixed(2) || "0.00"}</td>
                    <td style={{ padding: "16px", textAlign: "right", color: "#10F981", fontWeight: "600" }}>${partnerPrice(product.storePrice || 0).toFixed(2)}</td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        backgroundColor: product.availability === "In Stock" ? "rgba(16, 249, 129, 0.1)" : product.availability === "Low Stock" ? "rgba(251, 191, 36, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: product.availability === "In Stock" ? "#10F981" : product.availability === "Low Stock" ? "#FBBF24" : "#EF4444",
                        whiteSpace: "nowrap",
                      }}>
                        {product.availability || "In Stock"}
                      </span>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleToggleVisibility(product)}
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          backgroundColor: product.showInStore !== false ? "#10F981" : "#2D3B5F",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <span style={{
                          position: "absolute",
                          top: "2px",
                          left: product.showInStore !== false ? "22px" : "2px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          transition: "left 0.2s",
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                        <button
                          onClick={() => handleOpenModal(product)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: "1px solid #2D3B5F",
                            backgroundColor: "transparent",
                            color: "#94A3B8",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            cursor: "pointer",
                            border: "1px solid #EF4444",
                            backgroundColor: "transparent",
                            color: "#EF4444",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Preview Modal */}
      {isImportModalOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }} onClick={() => { setIsImportModalOpen(false); setImportPreview([]) }} />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            overflowY: "auto",
            zIndex: 70,
            borderRadius: "16px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
          }}>
            <div style={{
              position: "sticky",
              top: 0,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2D3B5F",
              backgroundColor: "#1A1F3A",
              zIndex: 1,
            }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#FFFFFF", marginBottom: "4px" }}>Import Preview</h2>
                <p style={{ fontSize: "14px", color: "#94A3B8" }}>{importPreview.length} products ready to import</p>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportPreview([]) }} style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Preview Table */}
              <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#0A0F2C" }}>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748B" }}>Product Name</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748B" }}>SKU</th>
                      <th style={{ padding: "12px", textAlign: "left", color: "#64748B" }}>Category</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>MSRP</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>Store Price</th>
                      <th style={{ padding: "12px", textAlign: "center", color: "#64748B" }}>Images</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((product, index) => (
                      <tr key={index} style={{ borderTop: "1px solid #2D3B5F" }}>
                        <td style={{ padding: "12px", color: "#FFFFFF" }}>{product.name}</td>
                        <td style={{ padding: "12px", color: "#94A3B8", fontFamily: "monospace" }}>{product.sku}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(14, 165, 233, 0.1)", color: "#0EA5E9" }}>
                            {product.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>${product.msrp.toFixed(2)}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#10F981", fontWeight: "600" }}>${product.storePrice.toFixed(2)}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "#94A3B8" }}>{product.images.filter(i => i).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => { setIsImportModalOpen(false); setImportPreview([]) }}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: "1px solid #2D3B5F",
                    backgroundColor: "transparent",
                    color: "#94A3B8",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  style={{
                    padding: "12px 32px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isImporting ? "wait" : "pointer",
                    border: "none",
                    background: "linear-gradient(135deg, #10F981 0%, #00FF66 100%)",
                    color: "#0A0F2C",
                    opacity: isImporting ? 0.7 : 1,
                  }}
                >
                  {isImporting ? "Importing..." : `Import ${importPreview.length} Products`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.8)" }} onClick={handleCloseModal} />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "95%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflowY: "auto",
            zIndex: 70,
            borderRadius: "16px",
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
          }}>
            {/* Modal Header */}
            <div style={{
              position: "sticky",
              top: 0,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #2D3B5F",
              backgroundColor: "#1A1F3A",
              zIndex: 1,
            }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#FFFFFF" }}>
                {isEditing ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={handleCloseModal} style={{ fontSize: "24px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer" }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {/* Basic Info */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0EA5E9", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Basic Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Product Name *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>SKU</label>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Manufacturer</label>
                    <input
                      type="text"
                      value={editingProduct.manufacturer}
                      onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Type / Layer</label>
                    <input
                      type="text"
                      value={editingProduct.typeLayer}
                      onChange={(e) => handleInputChange("typeLayer", e.target.value)}
                      placeholder="e.g., Layer 2, Layer 3, WiFi 7"
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Availability</label>
                    <select
                      value={editingProduct.availability}
                      onChange={(e) => handleInputChange("availability", e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    >
                      {availabilityOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Description</label>
                    <textarea
                      value={editingProduct.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Key Features</label>
                    <input
                      type="text"
                      value={editingProduct.features}
                      onChange={(e) => handleInputChange("features", e.target.value)}
                      placeholder="Comma-separated features"
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0EA5E9", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pricing</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>MSRP ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.msrp}
                      onChange={(e) => handleMsrpChange(parseFloat(e.target.value) || 0)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Markup (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={Math.round(editingProduct.markup * 100)}
                      onChange={(e) => handleMarkupChange((parseFloat(e.target.value) || 0) / 100)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Store Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.storePrice}
                      onChange={(e) => handleInputChange("storePrice", parseFloat(e.target.value) || 0)}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", color: "#10F981", marginBottom: "6px" }}>Partner Price (5% off)</label>
                    <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(16, 249, 129, 0.1)", border: "1px solid #10F981", color: "#10F981", fontSize: "14px", fontWeight: "600" }}>
                      ${(editingProduct.storePrice * 0.95).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0EA5E9", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Images</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  {[0, 1, 2].map(index => (
                    <div key={index}>
                      <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Image {index + 1} URL</label>
                      <input
                        type="text"
                        value={editingProduct.images[index] || ""}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder="https://..."
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                      />
                      {editingProduct.images[index] && (
                        <div style={{ marginTop: "8px", height: "80px", borderRadius: "8px", backgroundColor: "#0A0F2C", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                          <img src={editingProduct.images[index]} alt={`Preview ${index + 1}`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Product URL */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94A3B8", marginBottom: "6px" }}>Product URL</label>
                <input
                  type="text"
                  value={editingProduct.productUrl}
                  onChange={(e) => handleInputChange("productUrl", e.target.value)}
                  placeholder="https://store.ui.com/..."
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#0A0F2C", border: "1px solid #2D3B5F", color: "#FFFFFF", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "16px", borderTop: "1px solid #2D3B5F" }}>
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: "1px solid #2D3B5F",
                    backgroundColor: "transparent",
                    color: "#94A3B8",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: "12px 32px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isSaving ? "wait" : "pointer",
                    border: "none",
                    background: "linear-gradient(135deg, #10F981 0%, #00FF66 100%)",
                    color: "#0A0F2C",
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}