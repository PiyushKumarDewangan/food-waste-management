import { useState } from 'react'
import { Phone, Copy, Check, X, ExternalLink } from 'lucide-react'

export default function PhoneContactModal({ isOpen, onClose, title, name, phone, role }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const displayPhone = phone || '+91 98200 44321'

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(displayPhone)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{title || 'Contact Phone'}</h3>
              <p className="text-[11px] text-gray-500 font-medium">
                {role || 'Contact'} Phone Number
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Box */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
          <p className="text-xs font-bold text-gray-800">{name || 'Contact Person'}</p>
          <p className="text-lg font-mono font-extrabold text-[#2E7D32] tracking-wider select-all">
            {displayPhone}
          </p>
          <span className="inline-block text-[10px] text-gray-400 font-medium">
            Tap button below to copy number
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          <button
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2E7D32] hover:bg-[#256828] text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Phone Number Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Phone Number</span>
              </>
            )}
          </button>

          <a
            href={`tel:${displayPhone}`}
            className="w-full py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>Open in Phone Dialer</span>
          </a>
        </div>
      </div>
    </div>
  )
}
