import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Leaf, LogOut, Users, Bike, Inbox } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx'
import PendingProfileCard from '../../components/admin/PendingProfileCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import adminService from '../../services/adminService'

const TABS = [
  { key: 'receiver', label: 'Receivers', icon: Users },
  { key: 'volunteer', label: 'Volunteers', icon: Bike },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('receiver')
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPending = useCallback(async (tab) => {
    setLoading(true)
    setError('')
    try {
      const result =
        tab === 'receiver' ? await adminService.getPendingReceivers() : await adminService.getPendingVolunteers()
      setProfiles(result.data.profiles || [])
    } catch (err) {
      setError(err.message || 'Failed to load pending registrations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending(activeTab)
  }, [activeTab, fetchPending])

  const handleApprove = async (profileId) => {
    if (activeTab === 'receiver') {
      await adminService.approveReceiver(profileId)
    } else {
      await adminService.approveVolunteer(profileId)
    }
    setProfiles((prev) => prev.filter((p) => p._id !== profileId))
  }

  const handleReject = async (profileId, reason) => {
    if (activeTab === 'receiver') {
      await adminService.rejectReceiver(profileId, reason)
    } else {
      await adminService.rejectVolunteer(profileId, reason)
    }
    setProfiles((prev) => prev.filter((p) => p._id !== profileId))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getFieldsForProfile = (profile) => {
    if (activeTab === 'receiver') {
      return [
        { label: 'Organization', value: profile.organizationName },
        { label: 'Contact person', value: profile.contactPerson },
        { label: 'Address', value: profile.organizationAddress },
        { label: 'Storage capacity', value: profile.storageCapacity },
        { label: 'Operating hours', value: profile.operatingHours },
      ]
    }
    return [
      { label: 'Available days', value: (profile.availableDays || []).join(', ').toUpperCase() },
      { label: 'Preferred time', value: profile.preferredTime },
      { label: 'Service radius', value: profile.serviceRadius },
      { label: 'Transport', value: profile.transportType },
      { label: 'Vehicle number', value: profile.vehicleNumber },
    ]
  }

  const documentBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '')

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-white border-b border-borderc/70 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Leaf className="w-4 h-4 text-primary" />
          </span>
          <span className="font-bold text-ink text-sm">FoodBridge Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:inline">{user?.fullName}</span>
          <Button variant="outline" className="py-2! px-3! text-xs" icon={LogOut} iconPosition="left" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-ink">Pending registrations</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Review and approve receiver and volunteer sign-ups.</p>

        {/* Tabs */}
        <div className="inline-flex rounded-xl border border-borderc bg-white p-1 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-primary text-white' : 'text-gray-500 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {!loading && error && (
          <p role="alert" className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
              <Inbox className="w-5 h-5 text-primary" />
            </span>
            <p className="text-sm text-gray-500">No pending {activeTab}s right now — all caught up!</p>
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="space-y-4">
            {profiles.map((profile) => (
              <PendingProfileCard
                key={profile._id}
                profile={profile}
                fields={getFieldsForProfile(profile)}
                documentUrl={
                  activeTab === 'receiver' && profile.verificationDocumentUrl
                    ? `${documentBaseUrl}${profile.verificationDocumentUrl}`
                    : null
                }
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
