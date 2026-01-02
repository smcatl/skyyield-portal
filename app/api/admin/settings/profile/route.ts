// app/api/admin/settings/profile/route.ts
// User profile management synced to users table

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get current user profile
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Clerk user data
    const clerkUser = await currentUser()

    // Get Supabase user data
    const { data: supabaseUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Merge Clerk and Supabase data
    const profile = {
      clerkId: userId,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      firstName: supabaseUser?.first_name || clerkUser?.firstName,
      lastName: supabaseUser?.last_name || clerkUser?.lastName,
      fullName: supabaseUser?.full_name || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
      imageUrl: supabaseUser?.image_url || clerkUser?.imageUrl,
      phone: supabaseUser?.phone,
      title: supabaseUser?.title,
      department: supabaseUser?.department,
      timezone: supabaseUser?.timezone || 'America/New_York',
      userType: supabaseUser?.user_type,
      isAdmin: supabaseUser?.is_admin,
      portalStatus: supabaseUser?.portal_status,
      preferences: supabaseUser?.preferences || {},
      notificationSettings: supabaseUser?.notification_settings || {
        email: true,
        sms: false,
        push: true,
      },
      createdAt: supabaseUser?.created_at,
      updatedAt: supabaseUser?.updated_at,
      // Include raw supabase user for any additional fields
      _raw: supabaseUser,
    }

    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('GET /api/admin/settings/profile error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Map allowed profile fields
    if (body.firstName !== undefined) updateData.first_name = body.firstName
    if (body.lastName !== undefined) updateData.last_name = body.lastName
    if (body.fullName !== undefined) updateData.full_name = body.fullName
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.title !== undefined) updateData.title = body.title
    if (body.department !== undefined) updateData.department = body.department
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl
    if (body.preferences !== undefined) updateData.preferences = body.preferences
    if (body.notificationSettings !== undefined) updateData.notification_settings = body.notificationSettings

    let data
    if (existingUser) {
      // Update existing user
      const result = await supabase
        .from('users')
        .update(updateData)
        .eq('clerk_id', userId)
        .select()
        .single()

      if (result.error) throw result.error
      data = result.data
    } else {
      // Create new user record
      const clerkUser = await currentUser()
      const insertData = {
        clerk_id: userId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress,
        first_name: body.firstName || clerkUser?.firstName,
        last_name: body.lastName || clerkUser?.lastName,
        full_name: body.fullName || `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
        image_url: body.imageUrl || clerkUser?.imageUrl,
        phone: body.phone,
        title: body.title,
        department: body.department,
        timezone: body.timezone || 'America/New_York',
        preferences: body.preferences || {},
        notification_settings: body.notificationSettings || { email: true, sms: false, push: true },
        user_type: 'employee',
        portal_status: 'account_active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const result = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single()

      if (result.error) throw result.error
      data = result.data
    }

    // Transform response
    const profile = {
      clerkId: userId,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: data.full_name,
      imageUrl: data.image_url,
      phone: data.phone,
      title: data.title,
      department: data.department,
      timezone: data.timezone,
      userType: data.user_type,
      isAdmin: data.is_admin,
      preferences: data.preferences,
      notificationSettings: data.notification_settings,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error('PUT /api/admin/settings/profile error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Upload profile image (placeholder for future implementation)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This could be extended to handle file uploads
    // For now, just accept an image URL
    const body = await request.json()

    if (!body.imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        image_url: body.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, imageUrl: data.image_url })
  } catch (error: any) {
    console.error('POST /api/admin/settings/profile error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete user account (deactivate)
export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete - deactivate the account
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        portal_status: 'deactivated',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Account deactivated' })
  } catch (error: any) {
    console.error('DELETE /api/admin/settings/profile error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
