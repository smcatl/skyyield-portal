import { NextRequest, NextResponse } from 'next/server'

// In-memory storage - this would be shared with the main products route
// In production, use a database
let products = [
  { id: '1', name: 'SkyYield Indoor Hotspot', price: 299.99, category: 'Hotspots', stock: 50, isApproved: true },
  { id: '2', name: 'SkyYield Outdoor Hotspot', price: 449.99, category: 'Hotspots', stock: 30, isApproved: true },
  { id: '3', name: 'SkyYield Enterprise AP', price: 799.99, category: 'Enterprise', stock: 20, isApproved: true },
  { id: '4', name: 'SkyYield Mesh Extender', price: 149.99, category: 'Accessories', stock: 100, isApproved: false },
  { id: '5', name: 'SkyYield PoE Injector', price: 49.99, category: 'Accessories', stock: 200, isApproved: false },
  { id: '6', name: 'XNET Indoor Hotspot', price: 349.99, category: 'Hotspots', stock: 40, isApproved: true },
]

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const product = products.find(p => p.id === id)
  
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  
  return NextResponse.json({ product })
}

// PATCH - Update product (including isApproved toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const productIndex = products.findIndex(p => p.id === id)
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // Update product with provided fields
    products[productIndex] = {
      ...products[productIndex],
      ...body,
    }
    
    return NextResponse.json({ product: products[productIndex] })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Remove product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productIndex = products.findIndex(p => p.id === id)
    
    if (productIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    products.splice(productIndex, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}