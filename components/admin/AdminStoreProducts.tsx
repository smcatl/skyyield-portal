'use client'

import { useState, useEffect } from 'react'
import { 
  RefreshCw, Plus, Search, Edit, Trash2, Eye, EyeOff, 
  ExternalLink, Package, DollarSign, Tag, Filter,
  ChevronDown, X, Save, Image as ImageIcon
} from 'lucide-react'

interface Product {
  id: string
  product_id: string
  sku: string
  name: string
  manufacturer: string
  category: string
  description: string
  features: string
  type_layer: string
  msrp: number
  markup: number
  store_price: number
  partner_price: number
  availability: string
  is_visible: boolean
  is_active: boolean
  product_url: string
  image_1_url: string
  image_2_url: string
  image_3_url: string
  created_at: string
  updated_at: string
}

export default function AdminStoreProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state for new/edit product
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    sku: '',
    manufacturer: 'Ubiquiti',
    category: 'Switches',
    description: '',
    features: '',
    type_layer: '',
    msrp: 0,
    markup: 0.2,
    store_price: 0,
    partner_price: 0,
    availability: 'In Stock',
    is_visible: true,
    is_active: true,
    product_url: '',
    image_1_url: '',
    image_2_url: '',
    image_3_url: '',
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/store-products')
      const data = await res.json()
      
      if (data.success) {
        setProducts(data.products || [])
        setCategories(data.categories || [])
      } else {
        setError(data.error || 'Failed to load products')
      }
    } catch (err) {
      setError('Failed to load products')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const body = editingProduct 
        ? { id: editingProduct.id, ...formData }
        : formData

      const res = await fetch('/api/admin/store-products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        loadProducts()
        setEditingProduct(null)
        setIsAddingNew(false)
        resetForm()
      } else {
        alert(data.error || 'Failed to save product')
      }
    } catch (err) {
      alert('Failed to save product')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      const res = await fetch(`/api/admin/store-products?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        loadProducts()
      } else {
        alert(data.error || 'Failed to delete product')
      }
    } catch (err) {
      alert('Failed to delete product')
      console.error(err)
    }
  }

  const handleToggleVisibility = async (product: Product) => {
    try {
      const res = await fetch('/api/admin/store-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_visible: !product.is_visible })
      })
      
      const data = await res.json()
      
      if (data.success) {
        loadProducts()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      manufacturer: product.manufacturer,
      category: product.category,
      description: product.description,
      features: product.features,
      type_layer: product.type_layer,
      msrp: product.msrp,
      markup: product.markup,
      store_price: product.store_price,
      partner_price: product.partner_price,
      availability: product.availability,
      is_visible: product.is_visible,
      is_active: product.is_active,
      product_url: product.product_url,
      image_1_url: product.image_1_url,
      image_2_url: product.image_2_url,
      image_3_url: product.image_3_url,
    })
    setIsAddingNew(false)
  }

  const startAddNew = () => {
    setIsAddingNew(true)
    setEditingProduct(null)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      manufacturer: 'Ubiquiti',
      category: 'Switches',
      description: '',
      features: '',
      type_layer: '',
      msrp: 0,
      markup: 0.2,
      store_price: 0,
      partner_price: 0,
      availability: 'In Stock',
      is_visible: true,
      is_active: true,
      product_url: '',
      image_1_url: '',
      image_2_url: '',
      image_3_url: '',
    })
  }

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Auto-calculate store_price when msrp or markup changes
      if (field === 'msrp' || field === 'markup') {
        const msrp = field === 'msrp' ? value : (prev.msrp || 0)
        const markup = field === 'markup' ? value : (prev.markup || 0.2)
        updated.store_price = Math.round(msrp * (1 + markup) * 100) / 100
      }
      
      // Set partner_price to msrp if msrp changes
      if (field === 'msrp') {
        updated.partner_price = value
      }
      
      return updated
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-[#0EA5E9] animate-spin" />
        <span className="ml-3 text-[#94A3B8]">Loading products...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Store Products</h2>
          <p className="text-[#94A3B8] text-sm">{products.length} products in catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={startAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
        >
          <option value="all">All Categories ({products.length})</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat} ({products.filter(p => p.category === cat).length})
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3B5F]">
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Product</th>
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">SKU</th>
                <th className="text-left px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Category</th>
                <th className="text-right px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">MSRP</th>
                <th className="text-right px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Store Price</th>
                <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Status</th>
                <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Visible</th>
                <th className="text-center px-4 py-3 text-[#94A3B8] text-xs font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#94A3B8]">
                    {searchTerm || filterCategory !== 'all' ? 'No products match your filters' : 'No products found'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="border-t border-[#2D3B5F] hover:bg-[#0A0F2C]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_1_url ? (
                          <img 
                            src={product.image_1_url} 
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded bg-[#0A0F2C]"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#0A0F2C] rounded flex items-center justify-center">
                            <Package className="w-5 h-5 text-[#64748B]" />
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium text-sm">{product.name}</div>
                          <div className="text-[#64748B] text-xs">{product.manufacturer}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#0EA5E9] font-mono text-sm">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white text-sm">
                      {formatCurrency(product.msrp)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#10F981] font-medium text-sm">
                      {formatCurrency(product.store_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.availability === 'In Stock'
                          ? 'bg-green-500/20 text-green-400'
                          : product.availability === 'Low Stock'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleVisibility(product)}
                        className={`p-1.5 rounded transition-colors ${
                          product.is_visible
                            ? 'text-green-400 hover:bg-green-400/10'
                            : 'text-[#64748B] hover:bg-[#64748B]/10'
                        }`}
                      >
                        {product.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => startEdit(product)}
                          className="p-1.5 text-[#0EA5E9] hover:bg-[#0EA5E9]/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {product.product_url && (
                          <a
                            href={product.product_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-[#94A3B8] hover:bg-[#94A3B8]/10 rounded transition-colors"
                            title="View on Ubiquiti"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Edit/Add Modal */}
      {(editingProduct || isAddingNew) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3B5F] shrink-0">
              <h3 className="text-lg font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}
                className="p-2 text-[#94A3B8] hover:text-white hover:bg-[#2D3B5F] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => updateFormField('sku', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    required
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer || ''}
                    onChange={(e) => updateFormField('manufacturer', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => updateFormField('category', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="Switches">Switches</option>
                    <option value="Access Points">Access Points</option>
                    <option value="Gateways">Gateways</option>
                    <option value="Power">Power</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                {/* Type/Layer */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Type / Layer</label>
                  <input
                    type="text"
                    value={formData.type_layer || ''}
                    onChange={(e) => updateFormField('type_layer', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="e.g., Layer 2, WiFi 7"
                  />
                </div>

                {/* MSRP */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">MSRP ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.msrp || ''}
                    onChange={(e) => updateFormField('msrp', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                {/* Markup */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Markup (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(formData.markup || 0) * 100}
                    onChange={(e) => updateFormField('markup', (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                {/* Store Price (calculated) */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Store Price (auto)</label>
                  <input
                    type="text"
                    value={formatCurrency(formData.store_price || 0)}
                    readOnly
                    className="w-full px-3 py-2 bg-[#0A0F2C]/50 border border-[#2D3B5F] rounded-lg text-[#10F981] focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-1">Availability</label>
                  <select
                    value={formData.availability || 'In Stock'}
                    onChange={(e) => updateFormField('availability', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Pre-Order">Pre-Order</option>
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                  />
                </div>

                {/* Features */}
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-1">Key Features</label>
                  <textarea
                    value={formData.features || ''}
                    onChange={(e) => updateFormField('features', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9] resize-none"
                  />
                </div>

                {/* Product URL */}
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-1">Product URL</label>
                  <input
                    type="url"
                    value={formData.product_url || ''}
                    onChange={(e) => updateFormField('product_url', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                {/* Image URLs */}
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-1">Image URLs</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.image_1_url || ''}
                      onChange={(e) => updateFormField('image_1_url', e.target.value)}
                      placeholder="Image 1 URL"
                      className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <input
                      type="url"
                      value={formData.image_2_url || ''}
                      onChange={(e) => updateFormField('image_2_url', e.target.value)}
                      placeholder="Image 2 URL"
                      className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <input
                      type="url"
                      value={formData.image_3_url || ''}
                      onChange={(e) => updateFormField('image_3_url', e.target.value)}
                      placeholder="Image 3 URL"
                      className="w-full px-3 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                {/* Visibility Toggle */}
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_visible ?? true}
                      onChange={(e) => updateFormField('is_visible', e.target.checked)}
                      className="w-4 h-4 rounded border-[#2D3B5F] bg-[#0A0F2C] text-[#0EA5E9] focus:ring-[#0EA5E9]"
                    />
                    <span className="text-white">Visible in store</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2D3B5F] shrink-0">
              <button
                onClick={() => { setEditingProduct(null); setIsAddingNew(false); }}
                className="px-4 py-2 text-[#94A3B8] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.sku}
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
