'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  User, Building2, Mail, Phone, MapPin, Globe, 
  Save, Loader2, CheckCircle, Camera, CreditCard,
  Bell, Shield, Key
} from 'lucide-react'
import { supabase, isSupabaseAvailable } from '@/lib/supabase/client'

interface PersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
}

interface CompanyInfo {
  companyName: string
  companyWebsite: string
  companyPhone: string
  companyEmail: string
  address: string
  city: string
  state: string
  zipCode: string
  ein?: string
  businessType: string
}

interface NotificationPrefs {
  emailNotifications: boolean
  smsNotifications: boolean
  weeklyDigest: boolean
  paymentAlerts: boolean
  newReferralAlerts: boolean
}

interface PartnerSettingsProps {
  partnerId: string
  partnerType: 'location_partner' | 'referral_partner' | 'channel_partner' | 'relationship_partner' | 'contractor'
  showCompanyInfo?: boolean
  showPaymentSettings?: boolean
  showNotifications?: boolean
}

export default function PartnerSettings({
  partnerId,
  partnerType,
  showCompanyInfo = true,
  showPaymentSettings = true,
  showNotifications = true,
}: PartnerSettingsProps) {
  const { user } = useUser()
  const [activeSection, setActiveSection] = useState<'personal' | 'company' | 'notifications' | 'payment' | 'security'>('personal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    companyWebsite: '',
    companyPhone: '',
    companyEmail: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    ein: '',
    businessType: 'llc',
  })

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    emailNotifications: true,
    smsNotifications: false,
    weeklyDigest: true,
    paymentAlerts: true,
    newReferralAlerts: true,
  })

  useEffect(() => {
    loadSettings()
  }, [partnerId])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // Skip DB load if supabase not available (e.g., preview mode)
      if (!isSupabaseAvailable() || !supabase) {
        // Use mock data for preview
        setPersonalInfo({
          firstName: user?.firstName || 'Preview',
          lastName: user?.lastName || 'User',
          email: user?.primaryEmailAddress?.emailAddress || 'preview@example.com',
          phone: '(555) 123-4567',
        })
        setCompanyInfo({
          companyName: 'Preview Company LLC',
          companyWebsite: 'https://example.com',
          companyPhone: '(555) 987-6543',
          companyEmail: 'info@example.com',
          address: '123 Preview Street',
          city: 'Atlanta',
          state: 'GA',
          zipCode: '30301',
          businessType: 'LLC',
        })
        setNotificationPrefs({
          emailNotifications: true,
          smsNotifications: false,
          weeklyDigest: true,
          paymentAlerts: true,
          newReferralAlerts: true,
        })
        setLoading(false)
        return
      }

      // Load from appropriate table based on partner type
      const tableName = getTableName(partnerType)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', partnerId)
        .single()

      if (error) throw error

      if (data) {
        setPersonalInfo({
          firstName: data.first_name || user?.firstName || '',
          lastName: data.last_name || user?.lastName || '',
          email: data.email || user?.primaryEmailAddress?.emailAddress || '',
          phone: data.phone || '',
        })

        setCompanyInfo({
          companyName: data.company_name || '',
          companyWebsite: data.company_website || '',
          companyPhone: data.company_phone || '',
          companyEmail: data.company_email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zip_code || '',
          ein: data.ein || '',
          businessType: data.business_type || 'llc',
        })

        if (data.notification_preferences) {
          setNotificationPrefs(data.notification_preferences)
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      // Use Clerk data as fallback
      setPersonalInfo({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        phone: '',
      })
    } finally {
      setLoading(false)
    }
  }

  const getTableName = (type: string): string => {
    switch (type) {
      case 'location_partner': return 'location_partners'
      case 'referral_partner': return 'referral_partners'
      case 'channel_partner': return 'channel_partners'
      case 'relationship_partner': return 'relationship_partners'
      case 'contractor': return 'contractors'
      default: return 'users'
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setError(null)
    try {
      // Skip save if supabase not available (e.g., preview mode)
      if (!isSupabaseAvailable() || !supabase) {
        // Just simulate success in preview mode
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        setSaving(false)
        return
      }

      const tableName = getTableName(partnerType)

      const updateData: any = {
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: personalInfo.email,
        phone: personalInfo.phone,
        updated_at: new Date().toISOString(),
      }

      if (showCompanyInfo) {
        updateData.company_name = companyInfo.companyName
        updateData.company_website = companyInfo.companyWebsite
        updateData.company_phone = companyInfo.companyPhone
        updateData.company_email = companyInfo.companyEmail
        updateData.address = companyInfo.address
        updateData.city = companyInfo.city
        updateData.state = companyInfo.state
        updateData.zip_code = companyInfo.zipCode
        updateData.ein = companyInfo.ein
        updateData.business_type = companyInfo.businessType
      }

      if (showNotifications) {
        updateData.notification_preferences = notificationPrefs
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', partnerId)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      console.error('Error saving settings:', err)
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const sections = [
    { id: 'personal', label: 'Personal Info', icon: User },
    ...(showCompanyInfo ? [{ id: 'company', label: 'Company Info', icon: Building2 }] : []),
    ...(showNotifications ? [{ id: 'notifications', label: 'Notifications', icon: Bell }] : []),
    ...(showPaymentSettings ? [{ id: 'payment', label: 'Payment Settings', icon: CreditCard }] : []),
    { id: 'security', label: 'Security', icon: Shield },
  ]

  if (loading) {
    return (
      <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl overflow-hidden">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-56 border-r border-[#2D3B5F] p-4">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#0A0F2C]'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Personal Info Section */}
          {activeSection === 'personal' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Personal Information</h3>
                <p className="text-[#64748B] text-sm">Update your personal details</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#0A0F2C] rounded-full flex items-center justify-center overflow-hidden">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#64748B]" />
                  )}
                </div>
                <button className="px-4 py-2 bg-[#0A0F2C] text-[#94A3B8] rounded-lg hover:text-white hover:bg-[#2D3B5F] transition-colors text-sm">
                  Change Photo
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">First Name</label>
                  <input
                    type="text"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Last Name</label>
                  <input
                    type="text"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] text-sm mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company Info Section */}
          {activeSection === 'company' && showCompanyInfo && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Company Information</h3>
                <p className="text-[#64748B] text-sm">Update your business details</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="text"
                      value={companyInfo.companyName}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Business Type</label>
                  <select
                    value={companyInfo.businessType}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, businessType: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  >
                    <option value="sole_proprietor">Sole Proprietor</option>
                    <option value="llc">LLC</option>
                    <option value="corporation">Corporation</option>
                    <option value="partnership">Partnership</option>
                    <option value="nonprofit">Non-Profit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">EIN (Optional)</label>
                  <input
                    type="text"
                    value={companyInfo.ein}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, ein: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    placeholder="XX-XXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Company Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="url"
                      value={companyInfo.companyWebsite}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyWebsite: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">Company Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="tel"
                      value={companyInfo.companyPhone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyPhone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-2">Company Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="email"
                      value={companyInfo.companyEmail}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, companyEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[#94A3B8] text-sm mb-2">Street Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="text"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#94A3B8] text-sm mb-2">City</label>
                  <input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">State</label>
                    <input
                      type="text"
                      value={companyInfo.state}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94A3B8] text-sm mb-2">ZIP Code</label>
                    <input
                      type="text"
                      value={companyInfo.zipCode}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, zipCode: e.target.value })}
                      className="w-full px-4 py-2 bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg text-white focus:outline-none focus:border-[#0EA5E9]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && showNotifications && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Notification Preferences</h3>
                <p className="text-[#64748B] text-sm">Choose how you want to be notified</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive text message alerts' },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of your activity every week' },
                  { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Get notified when payments are processed' },
                  { key: 'newReferralAlerts', label: 'New Referral Alerts', desc: 'Get notified when a referral signs up' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0A0F2C] rounded-lg">
                    <div>
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-[#64748B] text-sm">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setNotificationPrefs({ 
                        ...notificationPrefs, 
                        [item.key]: !notificationPrefs[item.key as keyof NotificationPrefs] 
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        notificationPrefs[item.key as keyof NotificationPrefs]
                          ? 'bg-[#0EA5E9]'
                          : 'bg-[#2D3B5F]'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        notificationPrefs[item.key as keyof NotificationPrefs]
                          ? 'translate-x-6'
                          : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Settings Section */}
          {activeSection === 'payment' && showPaymentSettings && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Payment Settings</h3>
                <p className="text-[#64748B] text-sm">Manage your payment information via Tipalti</p>
              </div>

              <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Tipalti Payment Portal</div>
                    <div className="text-[#64748B] text-sm">Manage your payment method and tax information</div>
                  </div>
                </div>
                <button
                  onClick={() => window.open('/payments', '_blank')}
                  className="w-full px-4 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors"
                >
                  Open Payment Portal
                </button>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-yellow-400 font-medium mb-1">Note</div>
                <div className="text-[#94A3B8] text-sm">
                  Payment method and tax information are managed through our secure Tipalti portal. 
                  Changes made there will automatically sync with your account.
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Security Settings</h3>
                <p className="text-[#64748B] text-sm">Manage your account security</p>
              </div>

              <div className="space-y-4">
                <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-[#64748B]" />
                      <div>
                        <div className="text-white font-medium">Password</div>
                        <div className="text-[#64748B] text-sm">Change your account password</div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open('https://accounts.clerk.dev/user/security', '_blank')}
                      className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="bg-[#0A0F2C] border border-[#2D3B5F] rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#64748B]" />
                      <div>
                        <div className="text-white font-medium">Two-Factor Authentication</div>
                        <div className="text-[#64748B] text-sm">Add an extra layer of security</div>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open('https://accounts.clerk.dev/user/security', '_blank')}
                      className="px-4 py-2 bg-[#2D3B5F] text-white rounded-lg hover:bg-[#3D4B6F] transition-colors text-sm"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {(activeSection === 'personal' || activeSection === 'company' || activeSection === 'notifications') && (
            <div className="mt-8 pt-6 border-t border-[#2D3B5F] flex items-center justify-between">
              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}
              {saved && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Settings saved successfully
                </div>
              )}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="ml-auto flex items-center gap-2 px-6 py-2 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0EA5E9]/80 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
