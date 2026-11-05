import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function ReportIssueModal({ isOpen, onClose, onConfirm, deliveryId, loading }) {
  const [reason, setReason] = useState('vehicle_problem')
  const [note, setNote] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({ reason, note })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Report a delivery issue</h3>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Do you need to stop this run due to a vehicle problem or emergency? We&apos;ll immediately offer it to the next available volunteer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2.5">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors has-checked:border-red-500 has-checked:bg-red-50/40">
              <input
                type="radio"
                name="issueReason"
                value="vehicle_problem"
                checked={reason === 'vehicle_problem'}
                onChange={() => setReason('vehicle_problem')}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-gray-800">Vehicle problem</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors has-checked:border-red-500 has-checked:bg-red-50/40">
              <input
                type="radio"
                name="issueReason"
                value="personal_emergency"
                checked={reason === 'personal_emergency'}
                onChange={() => setReason('personal_emergency')}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-gray-800">Personal emergency</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors has-checked:border-red-500 has-checked:bg-red-50/40">
              <input
                type="radio"
                name="issueReason"
                value="safety_issue"
                checked={reason === 'safety_issue'}
                onChange={() => setReason('safety_issue')}
                className="w-4 h-4 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-gray-800">Other safety issue</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Additional Details (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide context if safe to do so..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Reassigning...' : 'Report & Reassign Run'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
