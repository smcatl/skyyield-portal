
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-[#0EA5E9] transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#0EA5E9]" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Add New Venue</div>
                    <div className="text-[#64748B] text-sm">Submit a new location</div>
                  </div>
                </div>
                <Link href="/apply/location-partner" className="text-[#0EA5E9] text-sm hover:underline">
                  Start Application →
                </Link>
              </div>
              <div className="bg-[#1A1F3A] border border-[#2D3B5F] rounded-xl p-6 hover:border-green-500 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Refer a Partner</div>
                    <div className="text-[#64748B] text-sm">Earn commission on referrals</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('crm')} className="text-green-400 text-sm hover:underline">
                  Add Referral →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Location Intelligence Calculator</h2>
              <p className="text-[#94A3B8] text-sm">Analyze venue potential and estimate earnings</p>
            </div>
            <CalculatorSection 
              isSubscribed={hasCalculatorSubscription}
              showUpgradePrompt={true}
            />
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <PartnerPayments
            partnerId={partnerId}
            partnerType="location_partner"
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <PartnerSettings
            partnerId={partnerId}
            partnerType="location_partner"
            showCompanyInfo={true}
            showPaymentSettings={true}
            showNotifications={true}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <PartnerAnalytics
            partnerId={partnerId}
            partnerType="location_partner"
            showReferrals={true}
            showDataUsage={true}
          />
        )}
      </div>
    </div>
  )
}
