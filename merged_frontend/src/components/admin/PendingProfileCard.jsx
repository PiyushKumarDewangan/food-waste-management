import { useState } from 'react'
import { Mail, Phone, MapPin, Calendar, Check, X, FileText } from 'lucide-react'
import Button from '../ui/Button.jsx'

/**
 * Generic card for a single pending receiver or volunteer profile.
 * `fields` is an array of { label, value } pairs specific to that role,
 * so the same card works for both without branching UI logic per role.
 */
export default function PendingProfileCard({ profile, fields, documentUrl, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const user = profile.user || {}

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await onApprove(profile._id)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReject = async () => {
    setActionLoading(true)
    try {
      await onReject(profile._id, reason)
    } finally {
      setActionLoading(false)
      setRejecting(false)
      setReason('')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-borderc/70 shadow-soft p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-ink text-sm">{user.fullName || 'Unknown user'}</h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {user.phone}
              </span>
            )}
            {user.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {user.city}
              </span>
            )}
            {user.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {new Date(user.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {!rejecting && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="py-2! px-3.5! text-xs"
              icon={X}
              iconPosition="left"
              onClick={() => setRejecting(true)}
              disabled={actionLoading}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              className="py-2! px-3.5! text-xs"
              icon={Check}
              iconPosition="left"
              onClick={handleApprove}
              loading={actionLoading}
            >
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-borderc/60">
        {fields.map((f) => (
          <div key={f.label}>
            <div className="text-[11px] text-gray-400 uppercase tracking-wide">{f.label}</div>
            <div className="text-sm text-ink mt-0.5">{f.value || '—'}</div>
          </div>
        ))}
      </div>

      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary font-medium mt-3 hover:underline"
        >
          <FileText className="w-3.5 h-3.5" /> View verification document
        </a>
      )}

      {rejecting && (
        <div className="mt-4 pt-4 border-t border-borderc/60">
          <label htmlFor={`reason-${profile._id}`} className="block text-xs font-medium text-ink mb-1.5">
            Reason for rejection (optional)
          </label>
          <textarea
            id={`reason-${profile._id}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Verification document unreadable"
            className="w-full rounded-xl border border-borderc text-sm text-ink placeholder:text-gray-400 p-3 outline-none focus:border-primary resize-none"
          />
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1 justify-center py-2! text-xs"
              onClick={() => {
                setRejecting(false)
                setReason('')
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center py-2! text-xs bg-red-500! hover:bg-red-600!"
              onClick={handleConfirmReject}
              loading={actionLoading}
            >
              Confirm reject
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
