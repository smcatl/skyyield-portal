// app/api/portal/employee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress

    // Find user in users table
    const { data: userData } = await supabase
      .from('users')
      .select('id, employee_id')
      .eq('clerk_id', userId)
      .single()

    // Find employee by user link or email
    let employee = null

    if (userData?.employee_id) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userData.employee_id)
        .single()
      employee = data
    }

    if (!employee && userEmail) {
      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('email', userEmail)
        .single()
      employee = data

      // Auto-link if found by email
      if (employee && userData?.id && !employee.user_id) {
        await supabase
          .from('employees')
          .update({ user_id: userData.id })
          .eq('id', employee.id)
        
        await supabase
          .from('users')
          .update({ employee_id: employee.id })
          .eq('id', userData.id)
      }
    }

    if (!employee) {
      return NextResponse.json({ 
        success: false, 
        error: 'No employee account found for this user' 
      }, { status: 404 })
    }

    // Fetch manager info if exists
    let manager = null
    if (employee.reports_to) {
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title, email')
        .eq('id', employee.reports_to)
        .single()
      manager = data
    }

    // Fetch writeups for this employee
    const { data: writeups } = await supabase
      .from('employee_writeups')
      .select('*')
      .eq('employee_id', employee.id)
      .order('writeup_date', { ascending: false })

    // Fetch tasks assigned to this employee
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', userData?.id)
      .order('due_date', { ascending: true })
      .limit(20)

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone,
        job_title: employee.job_title,
        department: employee.department,
        employment_type: employee.employment_type,
        status: employee.status,
        start_date: employee.start_date,
        salary: employee.salary,
        pay_frequency: employee.pay_frequency,
        // Document statuses
        offer_letter_status: employee.offer_letter_status,
        non_compete_status: employee.non_compete_status,
        nda_status: employee.nda_status,
        // Writeup info
        writeup_count: employee.writeup_count,
        last_writeup_date: employee.last_writeup_date,
      },
      manager,
      writeups: writeups || [],
      tasks: tasks || [],
    })

  } catch (error) {
    console.error('Employee portal error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
