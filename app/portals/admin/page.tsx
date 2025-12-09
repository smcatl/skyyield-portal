'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Users, FileText, ShoppingBag, BarChart3, 
  CheckCircle, Clock, Package, TrendingUp,
  RefreshCw, Check, X, Search, Plus, Edit, Trash2, Eye, Star,
  Upload, ToggleLeft, ToggleRight, Calculator, MapPin, Target, 
  Activity, DollarSign, Building2, Lock, ClipboardList, ExternalLink,
  Copy, Inbox
} from 'lucide-react'

type TabType = 'overview' | 'users' | 'products' | 'approved-products' | 'blog' | 'forms' | 'calculators' | 'analytics'

interface User {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  imageUrl: string
  userType: string
  status: string
  createdAt: number
}

interface Product {
  id: string
  priceId?: string
  name: string
  description?: string
  sku?: string
  category: string
  manufacturer?: string
  msrp?: number
  storePrice: number
  markup?: number
  features?: string
  typeLayer?: string
  availability?: string
  productUrl?: string
  images?: string[]
  active?: boolean
  showInStore?: boolean
  visible?: boolean
  isApproved?: boolean
  createdAt?: number
}

interface BlogArticle {
  id: string
  title: string
  excerpt?: string
  category?: string
  source?: string
  status: 'pending' | 'published' | 'draft' | 'rejected'
  image?: string
  createdAt: string
}

interface Form {
  id: string
  name: string
  slug: string
  description?: string
  category: string
  settings: {
    status: 'draft' | 'active' | 'closed'
  }
  submissionCount: number
  createdAt: string
}

interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: Record<string, any>
  submittedAt: string
  status: 'new' | 'reviewed' | 'approved' | 'rejected' | 'archived'
}

export default function AdminPortalPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  // Blog state
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [articleSearch, setArticleSearch] = useState('')
  const [articleStatusFilter, setArticleStatusFilter] = useState('all')

  // Calculator state
  const [calcSquareFootage, setCalcSquareFootage] = useState(2500)
  const [calcFootTraffic, setCalcFootTraffic] = useState(500)
  const [calcHoursOpen, setCalcHoursOpen] = useState(12)
  const [calcDaysOpen, setCalcDaysOpen] = useState(26)
  const [activeCalculator, setActiveCalculator] = useState<string>('earnings')

  // Forms state
  const [forms, setForms] = useState<Form[]>([])
  const [formsLoading, setFormsLoading] = useState(false)
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [submissionStats, setSubmissionStats] = useState({ total: 0, new: 0, reviewed: 0, approved: 0, rejected: 0 })
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Load approved IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('skyyield-approved-products')
    if (saved) {
      setApprovedIds(new Set(JSON.parse(saved)))
    }
  }, [])

  // Save approved IDs to localStorage when changed
  const saveApprovedIds = (ids: Set<string>) => {
    localStorage.setItem('skyyield-approved-products', JSON.stringify([...ids]))
    setApprovedIds(ids)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    
    const status = (user.unsafeMetadata as any)?.status || 'pending'
    if (status !== 'approved') {
      router.push('/pending-approval')
    }
  }, [isLoaded, user, router])

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  // Fetch products from /api/admin/products
  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const res = await fetch('/api/admin/products')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      } else {
        console.error('Products API returned:', res.status)
        setProducts([])
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch blog articles
  const fetchArticles = async () => {
    setArticlesLoading(true)
    try {
      const res = await fetch('/api/blog/articles')
      if (res.ok) {
        const data = await res.json()
        setArticles(data.articles || [])
      } else {
        console.error('Articles API returned:', res.status)
        setArticles([])
      }
    } catch (err) {
      console.error('Error fetching articles:', err)
      setArticles([])
    } finally {
      setArticlesLoading(false)
    }
  }

  // Update article status
  const updateArticleStatus = async (articleId: string, status: string) => {
    try {
      await fetch(`/api/blog/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      // Update local state
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, status: status as BlogArticle['status'] } : a
      ))
    } catch (err) {
      console.error('Error updating article:', err)
    }
  }

  // Delete article
  const deleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    try {
      await fetch(`/api/blog/articles/${articleId}`, {
        method: 'DELETE',
      })
      setArticles(prev => prev.filter(a => a.id !== articleId))
    } catch (err) {
      console.error('Error deleting article:', err)
    }
  }

  // Fetch forms
  const fetchForms = async () => {
    setFormsLoading(true)
    try {
      const res = await fetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        setForms(data.forms || [])
      }
    } catch (err) {
      console.error('Error fetching forms:', err)
    } finally {
      setFormsLoading(false)
    }
  }

  // Fetch submissions
  const fetchSubmissions = async (formId?: string) => {
    setSubmissionsLoading(true)
    try {
      const url = formId ? `/api/forms/submissions?formId=${formId}` : '/api/forms/submissions'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
        setSubmissionStats(data.stats || { total: 0, new: 0, reviewed: 0, approved: 0, rejected: 0 })
      }
    } catch (err) {
      console.error('Error fetching submissions:', err)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  // Update submission status
  const updateSubmissionStatus = async (submissionId: string, status: string) => {
    try {
      await fetch('/api/forms/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, status }),
      })
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, status: status as FormSubmission['status'] } : s
      ))
      // Update stats
      fetchSubmissions(selectedFormId || undefined)
    } catch (err) {
      console.error('Error updating submission:', err)
    }
  }

  // Copy form link
  const copyFormLink = (slug: string) => {
    const link = `${window.location.origin}/forms/${slug}`
    navigator.clipboard.writeText(link)
    setCopiedLink(slug)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'products' || activeTab === 'approved-products') fetchProducts()
    if (activeTab === 'blog') fetchArticles()
    if (activeTab === 'forms') {
      fetchForms()
      fetchSubmissions()
    }
    if (activeTab === 'overview') {
      fetchUsers()
      fetchProducts()
    }
  }, [activeTab])

  // Update user status
  const updateUserStatus = async (userId: string, status: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  // Toggle product visibility (showInStore)
  const toggleProductVisibility = async (product: Product) => {
    const currentVisibility = product.showInStore !== false
    const newVisibility = !currentVisibility
    
    // Update local state immediately
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, showInStore: newVisibility } : p
    ))
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      
      if (!response.ok) {
        throw new Error('Failed to update')
      }
    } catch (err) {
      console.error('Error updating product:', err)
      // Revert on error
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, showInStore: currentVisibility } : p
      ))
    }
  }

  // Toggle product approval for operations (stored in localStorage for now)
  const toggleProductApproval = (product: Product) => {
    const newApprovedIds = new Set(approvedIds)
    if (newApprovedIds.has(product.id)) {
      newApprovedIds.delete(product.id)
    } else {
      newApprovedIds.add(product.id)
    }
    saveApprovedIds(newApprovedIds)
  }

  // Check if product is approved
  const isProductApproved = (productId: string) => approvedIds.has(productId)

  // Delete product
  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
      }
    } catch (err) {
      console.error('Error deleting product:', err)
    }
  }

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  const status = (user.unsafeMetadata as any)?.status || 'pending'
  if (status !== 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#2D3B5F] border-t-[#0EA5E9] rounded-full animate-spin" />
      </div>
    )
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.firstName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      (u.lastName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku?.toLowerCase() || '').includes(productSearch.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const approvedProducts = products.filter(p => approvedIds.has(p.id))
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean)

  // Stats
  const pendingUsers = users.filter(u => u.status === 'pending').length
  const approvedUsers = users.filter(u => u.status === 'approved').length
  const totalProducts = products.length
  const approvedProductsCount = approvedProducts.length

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Store Products', icon: ShoppingBag },
    { id: 'approved-products', label: 'Approved Products', icon: Star },
    { id: 'blog', label: 'Blog', icon: FileText },
    { id: 'forms', label: 'Forms', icon: ClipboardList },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Administrator': 'bg-purple-500/20 text-purple-400',
      'Employee': 'bg-blue-500/20 text-blue-400',
      'Referral Partner': 'bg-cyan-500/20 text-cyan-400',
      'Location Partner': 'bg-green-500/20 text-green-400',
      'Channel Partner': 'bg-orange-500/20 text-orange-400',
      'Contractor': 'bg-pink-500/20 text-pink-400',
      'Customer': 'bg-indigo-500/20 text-indigo-400',
      'Calculator Access': 'bg-teal-500/20 text-teal-400',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  const getProductStatusColor = (status?: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-400'
      case 'Sold Out': return 'text-red-400'
      case 'Low Stock': return 'text-yellow-400'
      default: return 'text-[#94A3B8]'
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Indoor Access Points': 'bg-cyan-500/20 text-cyan-400',
      'Outdoor Access Points': 'bg-green-500/20 text-green-400',
      'Switches': 'bg-purple-500/20 text-purple-400',
      'Gateways': 'bg-orange-500/20 text-orange-400',
      'Accessories': 'bg-pink-500/20 text-pink-400',
    }
    return colors[category] || 'bg-[#2D3B5F] text-[#94A3B8]'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] to-[#0B0E28] pt-20">
      {/* Header */}
      <div className="px-4 pb-4 border-b border-[#2D3B5F]">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Admin <span className="text-[#0EA5E9]">Portal</span>
              </h1>
              <p className="text-[#94A3B8] mt-1">
                Welcome back, {user?.firstName}! Manage your platform.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#1A1F3A]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-white">{users.length}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Pending Approvals</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{pendingUsers}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Active Users</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{approvedUsers}</div>
              </div>

              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[#94A3B8] text-sm">Store Products</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{totalProducts}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab('users')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center group-hover:bg-[#0EA5E9]/30 transition-colors">
                    <Users className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <span className="text-white font-medium">Manage Users</span>
                </div>
                <p className="text-[#64748B] text-sm">Approve, reject, and manage user accounts</p>
                {pendingUsers > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                    <Clock className="w-3 h-3" />
                    {pendingUsers} pending
                  </div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <ShoppingBag className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white font-medium">Store Products</span>
                </div>
                <p className="text-[#64748B] text-sm">Manage products synced with Stripe</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  <Package className="w-3 h-3" />
                  {totalProducts} products
                </div>
              </button>

              <button
                onClick={() => setActiveTab('approved-products')}
                className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <span className="text-white font-medium">Approved Products</span>
                </div>
                <p className="text-[#64748B] text-sm">SkyYield approved equipment for operations</p>
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                  <Star className="w-3 h-3" />
                  {approvedProductsCount} approved
                </div>
              </button>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-[#64748B]">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Activity feed coming soon</p>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Joined</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#64748B]">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.imageUrl || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=0EA5E9&color=fff`} 
                              alt="" 
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="text-white font-medium">{u.firstName} {u.lastName}</div>
                              <div className="text-[#64748B] text-sm">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(u.userType)}`}>
                            {u.userType || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {u.status !== 'approved' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'approved')}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {u.status !== 'rejected' && (
                              <button
                                onClick={() => updateUserStatus(u.id, 'rejected')}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Store Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Store Products</h2>
                <p className="text-[#94A3B8] text-sm">Manage products synced with Stripe • {products.length} products</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/store-products"
                  className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Link>
                <Link
                  href="/admin/store-products"
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  onClick={fetchProducts}
                  disabled={productsLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Product</th>
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">SKU</th>
                    <th className="text-left px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Category</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">MSRP</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Store Price</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Partner Price</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Visible</th>
                    <th className="text-center px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Approved</th>
                    <th className="text-right px-4 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsLoading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-[#64748B]">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-[#64748B]">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No products found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2D3B5F] rounded-lg flex items-center justify-center overflow-hidden">
                              {p.images && p.images[0] ? (
                                <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-[#64748B]" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{p.name}</div>
                              {p.manufacturer && <div className="text-[#64748B] text-xs">{p.manufacturer}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#94A3B8] font-mono text-sm">{p.sku || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(p.category)}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-[#94A3B8]">
                          ${p.msrp?.toFixed(2) || '-'}
                        </td>
                        <td className="px-4 py-4 text-right text-white font-medium">
                          ${p.storePrice?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-4 py-4 text-right text-[#0EA5E9] font-medium">
                          ${(p.storePrice * 0.95).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-sm ${getProductStatusColor(p.availability)}`}>
                            {p.availability || 'In Stock'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleProductVisibility(p)}
                            className="text-[#64748B] hover:text-white transition-colors"
                          >
                            {p.showInStore !== false ? (
                              <ToggleRight className="w-8 h-8 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-8 h-8" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleProductApproval(p)}
                            className={`p-2 rounded-lg transition-colors ${
                              isProductApproved(p.id)
                                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                                : 'bg-[#2D3B5F] text-[#64748B] hover:bg-[#3D4B6F]'
                            }`}
                            title={isProductApproved(p.id) ? 'Remove from approved' : 'Mark as approved'}
                          >
                            <Star className={`w-4 h-4 ${isProductApproved(p.id) ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/store-products?edit=${p.id}`}
                              className="p-2 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
        )}

        {/* Approved Products Tab */}
        {activeTab === 'approved-products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">SkyYield Approved Products</h2>
                <p className="text-[#94A3B8] text-sm">Equipment approved for use in SkyYield operations • {approvedProductsCount} products</p>
              </div>
              <button
                onClick={fetchProducts}
                disabled={productsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] text-white rounded-lg hover:bg-[#2D3B5F] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {productsLoading ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#64748B]" />
                <p className="text-[#64748B]">Loading products...</p>
              </div>
            ) : approvedProducts.length === 0 ? (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
                <Star className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                <p className="text-[#64748B]">No approved products yet</p>
                <p className="text-[#64748B] text-sm mt-1">
                  Go to Store Products and click the star icon to approve products for operations
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="mt-4 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  Go to Store Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedProducts.map(p => (
                  <div key={p.id} className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-[#2D3B5F] rounded-lg flex items-center justify-center overflow-hidden">
                        {p.images && p.images[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-[#64748B]" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        <Star className="w-3 h-3 fill-current" />
                        Approved
                      </div>
                    </div>
                    <h3 className="text-white font-medium mb-1">{p.name}</h3>
                    {p.manufacturer && <p className="text-[#64748B] text-xs mb-2">{p.manufacturer}</p>}
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-3 ${getCategoryColor(p.category)}`}>
                      {p.category}
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[#0EA5E9] font-semibold">${p.storePrice?.toFixed(2) || '0.00'}</span>
                        <span className="text-[#64748B] text-sm ml-2">Partner: ${(p.storePrice * 0.95).toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProductApproval(p)}
                      className="w-full mt-4 py-2 border border-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#2D3B5F] transition-colors text-sm"
                    >
                      Remove from Approved
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-white">Blog Management</h2>
              <p className="text-[#94A3B8] text-sm">Review, approve, and manage blog articles</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#0EA5E9]">
                  {articles.filter(a => a.status === 'pending').length}
                </div>
                <div className="text-[#94A3B8] text-sm">Pending Review</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">
                  {articles.filter(a => a.status === 'published').length}
                </div>
                <div className="text-[#94A3B8] text-sm">Published</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-[#94A3B8]">
                  {articles.filter(a => a.status === 'draft').length}
                </div>
                <div className="text-[#94A3B8] text-sm">Drafts</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">
                  {articles.filter(a => a.status === 'rejected').length}
                </div>
                <div className="text-[#94A3B8] text-sm">Rejected</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={articleSearch}
                    onChange={(e) => setArticleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <select
                  value={articleStatusFilter}
                  onChange={(e) => setArticleStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={fetchArticles}
                  disabled={articlesLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${articlesLoading ? 'animate-spin' : ''}`} />
                  Show All ({articles.filter(a => {
                    const matchesSearch = a.title.toLowerCase().includes(articleSearch.toLowerCase())
                    const matchesStatus = articleStatusFilter === 'all' || a.status === articleStatusFilter
                    return matchesSearch && matchesStatus
                  }).length})
                </button>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2D3B5F]">
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Article</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Source</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Created</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-[#94A3B8] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading articles...
                      </td>
                    </tr>
                  ) : articles.filter(a => {
                    const matchesSearch = a.title.toLowerCase().includes(articleSearch.toLowerCase())
                    const matchesStatus = articleStatusFilter === 'all' || a.status === articleStatusFilter
                    return matchesSearch && matchesStatus
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No articles found</p>
                      </td>
                    </tr>
                  ) : (
                    articles.filter(a => {
                      const matchesSearch = a.title.toLowerCase().includes(articleSearch.toLowerCase())
                      const matchesStatus = articleStatusFilter === 'all' || a.status === articleStatusFilter
                      return matchesSearch && matchesStatus
                    }).map(article => (
                      <tr key={article.id} className="border-b border-[#2D3B5F] hover:bg-[#2D3B5F]/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#2D3B5F] rounded-lg flex items-center justify-center overflow-hidden">
                              {article.image ? (
                                <img src={article.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-6 h-6 text-[#64748B]" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium">{article.title}</div>
                              {article.excerpt && (
                                <div className="text-[#64748B] text-sm truncate max-w-xs">{article.excerpt}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {article.category && (
                            <span className="px-2 py-1 bg-[#0EA5E9]/20 text-[#0EA5E9] rounded text-xs">
                              {article.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8]">{article.source || 'Original'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            article.status === 'published' ? 'bg-green-500/20 text-green-400' :
                            article.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            article.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-[#2D3B5F] text-[#94A3B8]'
                          }`}>
                            {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#94A3B8] text-sm">
                          {new Date(article.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/blog/${article.id}`}
                              className="px-3 py-1.5 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                            >
                              Preview
                            </Link>
                            <Link
                              href={`/admin/blog/edit/${article.id}`}
                              className="px-3 py-1.5 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                            >
                              Edit
                            </Link>
                            {article.status !== 'published' && (
                              <button
                                onClick={() => updateArticleStatus(article.id, 'published')}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                Approve
                              </button>
                            )}
                            {article.status !== 'rejected' && article.status !== 'published' && (
                              <button
                                onClick={() => updateArticleStatus(article.id, 'rejected')}
                                className="px-3 py-1.5 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => deleteArticle(article.id)}
                              className="px-3 py-1.5 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
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
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Forms & Submissions</h2>
                <p className="text-[#94A3B8] text-sm">Manage forms and view submissions</p>
              </div>
              <Link
                href="/admin/forms/new"
                className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Form
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{submissionStats.total}</div>
                <div className="text-[#94A3B8] text-sm">Total Submissions</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{submissionStats.new}</div>
                <div className="text-[#94A3B8] text-sm">New</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{submissionStats.reviewed}</div>
                <div className="text-[#94A3B8] text-sm">Reviewed</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-green-400">{submissionStats.approved}</div>
                <div className="text-[#94A3B8] text-sm">Approved</div>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4">
                <div className="text-2xl font-bold text-red-400">{submissionStats.rejected}</div>
                <div className="text-[#94A3B8] text-sm">Rejected</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Forms List */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-white font-medium">Your Forms</h3>
                {formsLoading ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" />
                  </div>
                ) : forms.length === 0 ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <ClipboardList className="w-10 h-10 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8] text-sm">No forms yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {forms.map(form => (
                      <div
                        key={form.id}
                        className={`bg-[#1A1F3A] border rounded-xl p-4 cursor-pointer transition-colors ${
                          selectedFormId === form.id ? 'border-[#0EA5E9]' : 'border-[#2D3B5F] hover:border-[#0EA5E9]/50'
                        }`}
                        onClick={() => {
                          setSelectedFormId(form.id)
                          fetchSubmissions(form.id)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-white font-medium text-sm">{form.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            form.settings.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            form.settings.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {form.settings.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">{form.submissionCount} submissions</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyFormLink(form.slug)
                              }}
                              className="p-1 hover:bg-[#2D3B5F] rounded transition-colors"
                              title="Copy form link"
                            >
                              {copiedLink === form.slug ? (
                                <Check className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                              )}
                            </button>
                            <Link
                              href={`/forms/${form.slug}`}
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-[#2D3B5F] rounded transition-colors"
                              title="Open form"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submissions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">
                    {selectedFormId ? 'Form Submissions' : 'All Submissions'}
                  </h3>
                  {selectedFormId && (
                    <button
                      onClick={() => {
                        setSelectedFormId(null)
                        fetchSubmissions()
                      }}
                      className="text-sm text-[#0EA5E9] hover:underline"
                    >
                      Show All
                    </button>
                  )}
                </div>

                {submissionsLoading ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 text-center">
                    <Inbox className="w-10 h-10 mx-auto mb-3 text-[#64748B] opacity-50" />
                    <p className="text-[#94A3B8] text-sm">No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map(submission => (
                      <div
                        key={submission.id}
                        className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium">
                                {submission.data.name || submission.data.contact_name || submission.data.business_name || 'Anonymous'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                submission.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                                submission.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                                submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {submission.status}
                              </span>
                            </div>
                            <p className="text-[#64748B] text-sm">{submission.formName}</p>
                          </div>
                          <span className="text-[#64748B] text-xs">
                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Submission Data Preview */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                          {submission.data.email && (
                            <div>
                              <span className="text-[#64748B]">Email: </span>
                              <span className="text-white">{submission.data.email}</span>
                            </div>
                          )}
                          {submission.data.phone && (
                            <div>
                              <span className="text-[#64748B]">Phone: </span>
                              <span className="text-white">{submission.data.phone}</span>
                            </div>
                          )}
                          {submission.data.business_type && (
                            <div>
                              <span className="text-[#64748B]">Type: </span>
                              <span className="text-white">{submission.data.business_type}</span>
                            </div>
                          )}
                          {submission.data.address && (
                            <div className="col-span-2">
                              <span className="text-[#64748B]">Address: </span>
                              <span className="text-white">{submission.data.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[#2D3B5F]">
                          <button
                            onClick={() => {
                              // Show full submission details (could open modal)
                              alert(JSON.stringify(submission.data, null, 2))
                            }}
                            className="px-3 py-1.5 bg-[#2D3B5F] text-[#94A3B8] rounded-lg hover:bg-[#3D4B6F] transition-colors text-xs"
                          >
                            View Details
                          </button>
                          {submission.status === 'new' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'reviewed')}
                              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                            >
                              Mark Reviewed
                            </button>
                          )}
                          {submission.status !== 'approved' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs"
                            >
                              Approve
                            </button>
                          )}
                          {submission.status !== 'rejected' && (
                            <button
                              onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                              className="px-3 py-1.5 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-xs"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calculators Tab */}
        {activeTab === 'calculators' && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-white">Placer.ai Calculators</h2>
              <p className="text-[#94A3B8] text-sm">Analyze venues and estimate potential earnings using foot traffic data</p>
            </div>

            {/* Calculator Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'earnings', label: 'WiFi Earnings', icon: DollarSign, color: 'text-green-400', available: true },
                { id: 'trade-area', label: 'Trade Area', icon: MapPin, color: 'text-blue-400', available: true },
                { id: 'competitor', label: 'Competitor', icon: Target, color: 'text-orange-400', available: true },
                { id: 'peak-hours', label: 'Peak Hours', icon: Clock, color: 'text-purple-400', available: true },
                { id: 'demographics', label: 'Demographics', icon: Users, color: 'text-cyan-400', available: true },
                { id: 'venue-score', label: 'Venue Score', icon: Building2, color: 'text-yellow-400', available: true },
              ].map(calc => (
                <button
                  key={calc.id}
                  onClick={() => setActiveCalculator(calc.id)}
                  className={`p-4 rounded-xl border transition-all ${
                    activeCalculator === calc.id
                      ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-white'
                      : 'bg-[#1A1F3A] border-[#2D3B5F] text-[#94A3B8] hover:border-[#0EA5E9]/50'
                  }`}
                >
                  <calc.icon className={`w-6 h-6 mx-auto mb-2 ${calc.color}`} />
                  <div className="text-xs font-medium">{calc.label}</div>
                </button>
              ))}
            </div>

            {/* WiFi Earnings Calculator */}
            {activeCalculator === 'earnings' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  WiFi Earnings Calculator
                </h3>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Inputs */}
                  <div className="space-y-6">
                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Square Footage</span>
                        <span className="text-white font-medium">{calcSquareFootage.toLocaleString()} sq ft</span>
                      </label>
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="100"
                        value={calcSquareFootage}
                        onChange={(e) => setCalcSquareFootage(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>500</span>
                        <span>50,000</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Daily Foot Traffic</span>
                        <span className="text-white font-medium">{calcFootTraffic.toLocaleString()} visitors</span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="10000"
                        step="50"
                        value={calcFootTraffic}
                        onChange={(e) => setCalcFootTraffic(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>50</span>
                        <span>10,000</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Hours Open Per Day</span>
                        <span className="text-white font-medium">{calcHoursOpen} hours</span>
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="24"
                        value={calcHoursOpen}
                        onChange={(e) => setCalcHoursOpen(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>4</span>
                        <span>24</span>
                      </div>
                    </div>

                    <div>
                      <label className="flex justify-between text-sm text-[#94A3B8] mb-2">
                        <span>Days Open Per Month</span>
                        <span className="text-white font-medium">{calcDaysOpen} days</span>
                      </label>
                      <input
                        type="range"
                        min="15"
                        max="31"
                        value={calcDaysOpen}
                        onChange={(e) => setCalcDaysOpen(Number(e.target.value))}
                        className="w-full h-2 bg-[#2D3B5F] rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                      />
                      <div className="flex justify-between text-xs text-[#64748B] mt-1">
                        <span>15</span>
                        <span>31</span>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                      <div className="text-[#94A3B8] text-sm mb-1">Estimated Monthly Earnings</div>
                      <div className="text-4xl font-bold text-green-400">
                        ${(calcFootTraffic * 0.30 * 0.15 * 0.20 * calcDaysOpen).toFixed(0)}
                      </div>
                      <div className="text-[#64748B] text-xs mt-1">Based on 30% WiFi connection rate</div>
                    </div>

                    <div className="bg-[#0A0F2C] rounded-xl p-6 border border-[#2D3B5F]">
                      <div className="text-[#94A3B8] text-sm mb-1">Estimated Yearly Earnings</div>
                      <div className="text-3xl font-bold text-[#0EA5E9]">
                        ${(calcFootTraffic * 0.30 * 0.15 * 0.20 * calcDaysOpen * 12).toFixed(0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                        <div className="text-[#64748B] text-xs mb-1">Connected Users/Day</div>
                        <div className="text-xl font-semibold text-white">
                          {Math.round(calcFootTraffic * 0.30).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-[#0A0F2C] rounded-lg p-4 border border-[#2D3B5F]">
                        <div className="text-[#64748B] text-xs mb-1">Data Offloaded/Month</div>
                        <div className="text-xl font-semibold text-white">
                          {(calcFootTraffic * 0.30 * 0.15 * calcDaysOpen).toFixed(0)} GB
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-[#64748B] p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <strong className="text-[#94A3B8]">Assumptions:</strong> 30% WiFi connection rate, 
                      0.15 GB avg data per visitor, $0.20 per GB offload rate
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Area Analyzer */}
            {activeCalculator === 'trade-area' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Trade Area Analyzer
                </h3>
                <p className="text-[#94A3B8] mb-6">Understand where your venue's visitors come from and identify optimal coverage areas.</p>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Primary Trade Area</div>
                    <div className="text-2xl font-bold text-blue-400">5 mi</div>
                    <div className="text-xs text-[#64748B]">70% of visitors</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Secondary Trade Area</div>
                    <div className="text-2xl font-bold text-cyan-400">15 mi</div>
                    <div className="text-xs text-[#64748B]">25% of visitors</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Extended Reach</div>
                    <div className="text-2xl font-bold text-purple-400">30+ mi</div>
                    <div className="text-xs text-[#64748B]">5% of visitors</div>
                  </div>
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue address to analyze its trade area</p>
                  <div className="mt-4 flex gap-2 max-w-md mx-auto">
                    <input
                      type="text"
                      placeholder="Enter venue address..."
                      className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button className="px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Analyze
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Competitor Comparison */}
            {activeCalculator === 'competitor' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-400" />
                  Competitor Comparison
                </h3>
                <p className="text-[#94A3B8] mb-6">Compare foot traffic metrics against nearby competitors.</p>
                
                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Select venues to compare foot traffic and performance</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Select Venues
                  </button>
                </div>
              </div>
            )}

            {/* Peak Hours Optimizer */}
            {activeCalculator === 'peak-hours' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Peak Hours Optimizer
                </h3>
                <p className="text-[#94A3B8] mb-6">Identify peak visitation times to optimize WiFi capacity and earnings.</p>
                
                <div className="grid md:grid-cols-7 gap-2 mb-6">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                    <div key={day} className="bg-[#0A0F2C] rounded-lg p-3 border border-[#2D3B5F] text-center">
                      <div className="text-[#64748B] text-xs mb-2">{day}</div>
                      <div className={`text-lg font-bold ${i >= 5 ? 'text-green-400' : 'text-[#94A3B8]'}`}>
                        {i >= 5 ? '↑' : '—'}
                      </div>
                      <div className="text-xs text-[#64748B]">{i >= 5 ? 'Peak' : 'Normal'}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue to analyze hourly and daily traffic patterns</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    Analyze Patterns
                  </button>
                </div>
              </div>
            )}

            {/* Demographics Insights */}
            {activeCalculator === 'demographics' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Demographics Insights
                </h3>
                <p className="text-[#94A3B8] mb-6">Understand visitor demographics to target optimal venues.</p>
                
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Median Income</div>
                    <div className="text-xl font-bold text-green-400">$75,000</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Avg Age</div>
                    <div className="text-xl font-bold text-blue-400">34 yrs</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Mobile Usage</div>
                    <div className="text-xl font-bold text-purple-400">92%</div>
                  </div>
                  <div className="bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-1">Dwell Time</div>
                    <div className="text-xl font-bold text-orange-400">45 min</div>
                  </div>
                </div>

                <div className="bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F] text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-[#94A3B8]">Enter a venue to view detailed visitor demographics</p>
                  <button className="mt-4 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                    View Demographics
                  </button>
                </div>
              </div>
            )}

            {/* Venue Score */}
            {activeCalculator === 'venue-score' && (
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-yellow-400" />
                  Venue Scoring Tool
                </h3>
                <p className="text-[#94A3B8] mb-6">Get a comprehensive score (1-100) for any venue based on multiple factors.</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Foot Traffic</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[85%] h-full bg-green-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">85</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Demographics</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[72%] h-full bg-blue-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">72</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Dwell Time</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[90%] h-full bg-purple-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">90</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0A0F2C] rounded-lg border border-[#2D3B5F]">
                      <span className="text-[#94A3B8]">Competition</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#2D3B5F] rounded-full overflow-hidden">
                          <div className="w-[65%] h-full bg-orange-400 rounded-full" />
                        </div>
                        <span className="text-white font-medium">65</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-[#0A0F2C] rounded-xl p-8 border border-[#2D3B5F]">
                    <div className="text-[#64748B] text-sm mb-2">Overall Venue Score</div>
                    <div className="text-6xl font-bold text-yellow-400 mb-2">78</div>
                    <div className="text-green-400 text-sm font-medium">Good Opportunity</div>
                    <div className="mt-4 text-xs text-[#64748B] text-center">
                      Score based on foot traffic, demographics, dwell time, and competitive landscape
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-[#0A0F2C] rounded-xl p-4 border border-[#2D3B5F]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter venue address to score..."
                      className="flex-1 px-4 py-2 bg-[#1A1F3A] border border-[#2D3B5F] rounded-lg text-white placeholder-[#64748B] focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button className="px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors">
                      Score Venue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Analytics</h2>

            <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-[#64748B] opacity-50" />
              <p className="text-[#64748B]">Analytics dashboard coming soon</p>
              <p className="text-[#64748B] text-sm mt-1">Track network performance, earnings, and user engagement</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}