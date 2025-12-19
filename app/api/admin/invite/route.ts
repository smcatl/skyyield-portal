import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { clerkClient } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Invite a user and link to partner record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      email, 
      firstName, 
      lastName, 
      role,  // 'location_partner', 'referral_partner', 'contractor', 'employee', 'admin'
      partnerId,  // UUID of the partner record to link
      sendInvite = true 
    } = body

    if (!email || !role) {
      return NextResponse.json({ 
        error: 'email and role are required' 
      }, { status: 400 })
    }

    const clerk = await clerkClient()

    // 1. Check if user already exists in Clerk
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [email],
    })

    let clerkUser = existingUsers.data[0]

    if (!clerkUser) {
      // 2. Create user in Clerk (this sends an invite email)
      clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName: firstName || '',
        lastName: lastName || '',
        skipPasswordRequirement: true,  // They'll set password on first login
        publicMetadata: {
          role,
          partner_id: partnerId,
        },
      })

      // 3. Send invitation email
      if (sendInvite) {
        await clerk.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyyield.io'}/sign-in`,
          publicMetadata: {
            role,
            partner_id: partnerId,
          },
        })
      }
    }

    // 4. Create or update user record in Supabase
    const userRecord: Record<string, any> = {
      clerk_id: clerkUser.id,
      email,
      first_name: firstName || clerkUser.firstName,
      last_name: lastName || clerkUser.lastName,
      full_name: `${firstName || clerkUser.firstName || ''} ${lastName || clerkUser.lastName || ''}`.trim(),
      role,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    // Link to partner record based on role
    if (partnerId) {
      if (role === 'location_partner') {
        userRecord.location_partner_id = partnerId
      } else if (role === 'referral_partner') {
        userRecord.referral_partner_id = partnerId
      } else if (role === 'contractor') {
        userRecord.contractor_id = partnerId
      } else if (role === 'employee') {
        userRecord.employee_id = partnerId
      }
    }

    // Upsert user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(userRecord, { onConflict: 'clerk_id' })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user in Supabase:', userError)
      // Try insert if upsert fails
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single()
      
      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to create user in database',
          details: insertError.message
        }, { status: 500 })
      }
    }

    // 5. Update the partner record with user_id if needed
    if (partnerId && role !== 'admin') {
      const tableMap: Record<string, string> = {
        'location_partner': 'location_partners',
        'referral_partner': 'referral_partners',
        'contractor': 'contractors',
        'employee': 'employees',
      }
      
      const tableName = tableMap[role]
      if (tableName) {
        await supabase
          .from(tableName)
          .update({ 
            user_id: clerkUser.id,
            portal_access: true,
            portal_invited_at: new Date().toISOString(),
          })
          .eq('id', partnerId)
      }
    }

    // 6. Log activity
    await supabase.from('activity_log').insert({
      entity_type: role,
      entity_id: partnerId || clerkUser.id,
      action: 'portal_invite_sent',
      category: 'Users',
      details: { email, role },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: sendInvite 
        ? `Invitation sent to ${email}` 
        : `User created for ${email}`,
      user: {
        clerkId: clerkUser.id,
        email,
        role,
        partnerId,
      }
    })
  } catch (error: any) {
    console.error('Invite user error:', error)
    return NextResponse.json({ 
      error: 'Failed to invite user',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - List users or get single user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const clerkId = searchParams.get('clerkId')
  const role = searchParams.get('role')

  try {
    let query = supabase.from('users').select('*')

    if (email) {
      query = query.eq('email', email)
    }
    if (clerkId) {
      query = query.eq('clerk_id', clerkId)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update user and resend invite
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, resendInvite } = body

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    const clerk = await clerkClient()

    // Find user
    const existingUsers = await clerk.users.getUserList({
      emailAddress: [email],
    })

    if (existingUsers.data.length === 0) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
    }

    const clerkUser = existingUsers.data[0]

    if (resendInvite) {
      // Create new invitation
      await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyyield.io'}/sign-in`,
        publicMetadata: clerkUser.publicMetadata,
      })

      return NextResponse.json({
        success: true,
        message: `Invitation resent to ${email}`,
      })
    }

    return NextResponse.json({ user: clerkUser })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.message 
    }, { status: 500 })
  }
}
