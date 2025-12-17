// app/portal/location/page.tsx
// Example Location Partner Portal using effective user

import { redirect } from 'next/navigation'
import { getEffectiveUser, getEffectivePartnerRecord } from '@/lib/getEffectiveUser'
import { ImpersonationAwareLayout } from '@/components/ImpersonationBanner'

export default async function LocationPartnerPortal() {
  const user = await getEffectiveUser()

  // Check authentication
  if (!user) {
    redirect('/sign-in')
  }

  // Check authorization - must be location_partner (or admin impersonating one)
  if (user.userType !== 'location_partner') {
    redirect('/dashboard') // or show unauthorized message
  }

  // Get the partner record
  const partner = await getEffectivePartnerRecord(user)

  if (!partner) {
    return (
      <ImpersonationAwareLayout>
        <div className="p-8">
          <h1>Account Not Found</h1>
          <p>Your partner record could not be loaded.</p>
        </div>
      </ImpersonationAwareLayout>
    )
  }

  return (
    <ImpersonationAwareLayout>
      <div className="min-h-screen bg-[#0A0F2C] text-white">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{partner.company_legal_name || partner.dba_name}</h1>
              <p className="text-gray-400">Location Partner Portal</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-medium">{partner.contact_first_name} {partner.contact_last_name}</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Active Venues" 
              value="3" 
              change="+1 this month" 
            />
            <StatCard 
              title="Total Revenue" 
              value="$12,450" 
              change="+12% vs last month" 
            />
            <StatCard 
              title="Data Offloaded" 
              value="1.2 TB" 
              change="This month" 
            />
            <StatCard 
              title="Next Payment" 
              value="$2,100" 
              change="Dec 15, 2024" 
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Venues */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Your Venues</h2>
              <div className="space-y-3">
                <VenueRow name="Main Street Location" status="active" devices={4} />
                <VenueRow name="Downtown Branch" status="active" devices={2} />
                <VenueRow name="Airport Kiosk" status="pending" devices={1} />
              </div>
              <button className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm">
                + Add New Venue
              </button>
            </div>

            {/* Documents */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Documents</h2>
              <div className="space-y-3">
                <DocumentRow 
                  name="Letter of Intent" 
                  status={partner.loi_status || 'not_sent'} 
                  date={partner.loi_signed_at}
                />
                <DocumentRow 
                  name="Deployment Agreement" 
                  status={partner.deployment_status || 'not_sent'} 
                  date={partner.deployment_signed_at}
                />
                <DocumentRow 
                  name="Contract" 
                  status={partner.contract_status || 'not_sent'} 
                  date={partner.contract_signed_at}
                />
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mt-6 bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Setup</h2>
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${
                partner.tipalti_status === 'active' ? 'bg-green-500' :
                partner.tipalti_status === 'pending_onboarding' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
              <span>
                {partner.tipalti_status === 'active' ? 'Payment method verified' :
                 partner.tipalti_status === 'pending_onboarding' ? 'Please complete payment setup' :
                 'Payment setup not started'}
              </span>
              {partner.tipalti_status !== 'active' && (
                <button className="ml-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-md text-sm">
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </ImpersonationAwareLayout>
  )
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{change}</p>
    </div>
  )
}

function VenueRow({ name, status, devices }: { name: string; status: string; devices: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-400">{devices} devices</p>
      </div>
      <span className={`px-2 py-1 rounded text-xs ${
        status === 'active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
      }`}>
        {status}
      </span>
    </div>
  )
}

function DocumentRow({ name, status, date }: { name: string; status: string; date?: string }) {
  const statusColors: Record<string, string> = {
    signed: 'bg-green-900 text-green-300',
    sent: 'bg-blue-900 text-blue-300',
    not_sent: 'bg-gray-700 text-gray-300',
    declined: 'bg-red-900 text-red-300',
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div>
        <p className="font-medium">{name}</p>
        {date && <p className="text-sm text-gray-400">Signed {new Date(date).toLocaleDateString()}</p>}
      </div>
      <span className={`px-2 py-1 rounded text-xs ${statusColors[status] || statusColors.not_sent}`}>
        {status.replace('_', ' ')}
      </span>
    </div>
  )
}
