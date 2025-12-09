import { NextRequest, NextResponse } from 'next/server'
import { DropdownConfig } from '@/lib/pipeline/pipeline-types'
import { defaultDropdowns } from '@/lib/pipeline/pipeline-dropdowns'

// ============================================
// IN-MEMORY STORAGE (initialized with defaults)
// ============================================

let dropdowns: DropdownConfig[] = [...defaultDropdowns]

// ============================================
// GET - Fetch dropdowns
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  // Get single dropdown by key
  if (key) {
    const dropdown = dropdowns.find(d => d.key === key)
    if (!dropdown) {
      return NextResponse.json({ error: 'Dropdown not found' }, { status: 404 })
    }
    
    // Return only active options sorted by order
    const activeOptions = dropdown.options
      .filter(o => o.isActive)
      .sort((a, b) => a.order - b.order)
    
    return NextResponse.json({ 
      dropdown,
      options: activeOptions.map(o => ({ value: o.value, label: o.label })),
    })
  }
  
  // Return all dropdowns
  return NextResponse.json({ dropdowns })
}

// ============================================
// POST - Create new dropdown or add option
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Adding option to existing dropdown
    if (body.dropdownKey && body.option) {
      const dropdown = dropdowns.find(d => d.key === body.dropdownKey)
      if (!dropdown) {
        return NextResponse.json({ error: 'Dropdown not found' }, { status: 404 })
      }
      
      // Check if option already exists
      if (dropdown.options.some(o => o.value === body.option.value)) {
        return NextResponse.json({ error: 'Option already exists' }, { status: 400 })
      }
      
      // Add new option
      const newOption = {
        value: body.option.value,
        label: body.option.label,
        isActive: true,
        order: dropdown.options.length + 1,
      }
      
      dropdown.options.push(newOption)
      dropdown.updatedAt = new Date().toISOString()
      
      return NextResponse.json({ dropdown, newOption })
    }
    
    // Creating new dropdown
    const newDropdown: DropdownConfig = {
      id: `dropdown_${Date.now()}`,
      key: body.key,
      name: body.name,
      options: body.options || [],
      allowCustom: body.allowCustom ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    dropdowns.push(newDropdown)
    
    return NextResponse.json({ dropdown: newDropdown }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

// ============================================
// PUT - Update dropdown or option
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, ...updates } = body
    
    const dropdown = dropdowns.find(d => d.key === key)
    if (!dropdown) {
      return NextResponse.json({ error: 'Dropdown not found' }, { status: 404 })
    }
    
    // Update specific option
    if (body.optionValue !== undefined) {
      const optionIndex = dropdown.options.findIndex(o => o.value === body.optionValue)
      if (optionIndex === -1) {
        return NextResponse.json({ error: 'Option not found' }, { status: 404 })
      }
      
      if (body.optionUpdates) {
        dropdown.options[optionIndex] = {
          ...dropdown.options[optionIndex],
          ...body.optionUpdates,
        }
      }
    } else {
      // Update dropdown itself
      Object.assign(dropdown, {
        name: updates.name ?? dropdown.name,
        allowCustom: updates.allowCustom ?? dropdown.allowCustom,
      })
    }
    
    // Reorder options if provided
    if (body.reorder && Array.isArray(body.reorder)) {
      body.reorder.forEach((value: string, index: number) => {
        const option = dropdown.options.find(o => o.value === value)
        if (option) {
          option.order = index + 1
        }
      })
    }
    
    dropdown.updatedAt = new Date().toISOString()
    
    return NextResponse.json({ dropdown })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// ============================================
// DELETE - Remove option from dropdown
// ============================================

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const optionValue = searchParams.get('optionValue')
  
  if (!key) {
    return NextResponse.json({ error: 'Dropdown key required' }, { status: 400 })
  }
  
  const dropdown = dropdowns.find(d => d.key === key)
  if (!dropdown) {
    return NextResponse.json({ error: 'Dropdown not found' }, { status: 404 })
  }
  
  // Delete specific option (soft delete - set inactive)
  if (optionValue) {
    const option = dropdown.options.find(o => o.value === optionValue)
    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 })
    }
    
    option.isActive = false
    dropdown.updatedAt = new Date().toISOString()
    
    return NextResponse.json({ success: true, dropdown })
  }
  
  // Delete entire dropdown
  const index = dropdowns.findIndex(d => d.key === key)
  dropdowns.splice(index, 1)
  
  return NextResponse.json({ success: true })
}