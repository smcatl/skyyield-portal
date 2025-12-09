import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for demo (replace with database in production)
const products = [
  {
    id: '1',
    name: 'SkyYield Indoor Hotspot',
    description: 'High-performance indoor WiFi hotspot for maximum coverage. Perfect for retail spaces, offices, and restaurants.',
    price: 299.99,
    category: 'Hotspots',
    image: '/products/indoor-hotspot.jpg',
    stock: 50,
    isApproved: true,
    features: ['Up to 5,000 sq ft coverage', 'Dual-band WiFi 6', 'Easy setup', 'Cloud managed'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'SkyYield Outdoor Hotspot',
    description: 'Weather-resistant outdoor hotspot designed for parking lots, patios, and outdoor venues.',
    price: 449.99,
    category: 'Hotspots',
    image: '/products/outdoor-hotspot.jpg',
    stock: 30,
    isApproved: true,
    features: ['IP67 weather resistant', 'Up to 10,000 sq ft coverage', 'PoE powered', 'Mesh capable'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'SkyYield Enterprise AP',
    description: 'Enterprise-grade access point for high-density environments like stadiums, malls, and convention centers.',
    price: 799.99,
    category: 'Enterprise',
    image: '/products/enterprise-ap.jpg',
    stock: 20,
    isApproved: true,
    features: ['WiFi 6E support', 'Up to 500 concurrent users', 'Advanced analytics', 'VLAN support'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'SkyYield Mesh Extender',
    description: 'Extend your coverage with our mesh extender. Seamlessly connects to your existing SkyYield network.',
    price: 149.99,
    category: 'Accessories',
    image: '/products/mesh-extender.jpg',
    stock: 100,
    isApproved: false,
    features: ['Plug and play', 'Auto-configuring', 'Wall mountable', 'LED status indicators'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'SkyYield PoE Injector',
    description: 'Power over Ethernet injector for easy hotspot installation without nearby power outlets.',
    price: 49.99,
    category: 'Accessories',
    image: '/products/poe-injector.jpg',
    stock: 200,
    isApproved: false,
    features: ['Gigabit speeds', '30W output', 'Surge protection', 'Compact design'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'XNET Indoor Hotspot',
    description: 'XNET compatible indoor WiFi hotspot for Helium Mobile network deployments.',
    price: 349.99,
    category: 'Hotspots',
    image: '/products/xnet-indoor.jpg',
    stock: 40,
    isApproved: true,
    features: ['Helium Mobile compatible', 'CBRS support', 'Dual-band WiFi 6', 'Earn MOBILE tokens'],
    createdAt: new Date().toISOString(),
  },
]

// GET - Fetch all products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const approvedOnly = searchParams.get('approved') === 'true'

  let filteredProducts = [...products]

  if (category && category !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === category)
  }

  if (approvedOnly) {
    filteredProducts = filteredProducts.filter(p => p.isApproved)
  }

  return NextResponse.json({ products: filteredProducts })
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newProduct = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || '',
      price: body.price,
      category: body.category || 'Uncategorized',
      image: body.image || '',
      stock: body.stock || 0,
      isApproved: body.isApproved || false,
      features: body.features || [],
      createdAt: new Date().toISOString(),
    }

    products.push(newProduct)

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}