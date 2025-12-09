import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const client = await clerkClient()
    const usersResponse = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    })

    const users = usersResponse.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.emailAddresses?.[0]?.emailAddress || '',
      imageUrl: user.imageUrl,
      userType: (user.unsafeMetadata as any)?.userType || 'Unknown',
      status: (user.unsafeMetadata as any)?.status || 'pending',
      createdAt: user.createdAt,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error.message,
      users: [] 
    }, { status: 500 })
  }
}

// PUT - Update user status (approve/reject)
export async function PUT(request: NextRequest) {
  try {
    const { userId, status } = await request.json()

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const client = await clerkClient()
    
    // Get current user metadata
    const user = await client.users.getUser(userId)
    const currentMetadata = (user.unsafeMetadata || {}) as Record<string, any>

    // Update user metadata with new status
    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...currentMetadata,
        status,
        approvedAt: status === 'approved' ? new Date().toISOString() : currentMetadata.approvedAt,
      },
    })

    return NextResponse.json({ success: true, message: `User ${status}` })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.message 
    }, { status: 500 })
  }
}