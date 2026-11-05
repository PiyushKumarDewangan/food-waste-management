import { useState, useEffect } from 'react'
import {
  X,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Truck,
  HeartHandshake,
  User,
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    roles: ['donor', 'general'],
    question: 'How do I donate food?',
    answer:
      'To donate surplus food, go to your Donor Dashboard and click "+ Donate Surplus Food" or navigate to "Add Food" in the sidebar. Fill in the details including food title, category, quantity with the appropriate unit (Servings, Kg, Liters, Items, Boxes, Bags, Bottles), safe consumption window (hours remaining), pickup address, and pickup time window. You can also upload a clear photo of the food. Once published, your listing becomes immediately visible to verified local receivers and NGOs.',
  },
  {
    id: 'faq-2',
    roles: ['receiver', 'general'],
    question: 'How do I request available food?',
    answer:
      'As a verified receiver or NGO, visit "Browse Food" in your portal. Filter donations by category, dietary preferences, or proximity. Select an available listing, choose your needed quantity, and select your preferred fulfillment method (Self-Pickup or Volunteer Courier Delivery). Once submitted, the donor reviews and approves your request, which initiates the exchange.',
  },
  {
    id: 'faq-3',
    roles: ['donor', 'receiver', 'general'],
    question: 'How does Direct Pickup work?',
    answer:
      'Direct Pickup involves only the Donor and the Receiver (Donor → Receiver) with NO volunteer intermediary. The system generates exactly ONE 4-digit pickup verification code displayed securely on the Donor\'s exchange tracking page. The receiver travels to the donor\'s pickup address during the agreed window. Upon physical arrival and handover, the receiver asks the donor for the 4-digit code and enters it to verify collection. Once verified, the food handover is completed.',
  },
  {
    id: 'faq-4',
    roles: ['donor', 'receiver', 'volunteer', 'general'],
    question: 'How does Volunteer Assistance work?',
    answer:
      'Volunteer Assistance is a three-party delivery model (Donor → Volunteer → Receiver) designed for large, heavy, or distant donations. When approved, the delivery enters "Searching for Volunteer" status until a real authenticated volunteer on duty accepts the dispatch. The volunteer picks up the food from the donor and transports it to the receiver. Two distinct verification codes are used to secure each handover point.',
  },
  {
    id: 'faq-5',
    roles: ['donor', 'receiver', 'volunteer', 'general'],
    question: 'How do pickup verification codes work?',
    answer:
      'Verification codes guarantee food safety and handover integrity:\n\n• Direct Pickup: Uses ONE 4-digit code owned by the Donor. The receiver enters this code upon collecting the food.\n• Volunteer Delivery: Uses TWO DIFFERENT codes. 1) Pickup Code: Donor holds this code and gives it to the Volunteer upon donor collection. 2) Delivery Code: Receiver holds this code and gives it to the Volunteer when food arrives at the receiver location.\n\nCodes are never reused across handovers and disappear from active banners once handover is completed.',
  },
  {
    id: 'faq-6',
    roles: ['donor', 'receiver', 'volunteer', 'general'],
    question: 'How can I track an exchange or delivery?',
    answer:
      'You can track live progress anytime from your respective portal:\n\n• Donors: Visit the "Exchanges" tab to monitor current step status, volunteer assignment, transport method, and live ETA.\n• Receivers: Visit "Active Pickups" to view courier progress, estimated arrival time, and contact options.\n• Volunteers: Visit "Active Deliveries" to view routes, pickup/drop-off addresses, turn-by-turn navigation hints, and code verification forms.',
  },
  {
    id: 'faq-7',
    roles: ['donor', 'receiver', 'volunteer', 'general'],
    question: 'How do I update my profile and profile photo?',
    answer:
      'Go to the "Profile" page from your navigation menu or click on your user chip in the top header. You can edit your name, contact phone number, address, and operating preferences. To update your profile photo, click "Upload Photo" or "Change Photo", choose a JPG, PNG, or WebP image (up to 5MB), and it will automatically update across your entire portal and navigation headers.',
  },
]

export default function HelpSupportModal({ isOpen, onClose, userRole = 'general' }) {
  const [expandedId, setExpandedId] = useState('faq-1')

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50/70 to-teal-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2E7D32] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 id="help-modal-title" className="text-lg font-bold text-gray-900 leading-snug">
                FoodShare Help & Support
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Frequently Asked Questions & Community Guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
            aria-label="Close Help Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FAQ Accordion List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {FAQ_ITEMS.map((faq, idx) => {
            const isExpanded = expandedId === faq.id
            const isRoleRelevant = faq.roles.includes(userRole.toLowerCase())

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? 'border-[#2E7D32]/40 bg-emerald-50/20 shadow-2xs'
                    : 'border-gray-200/80 bg-white hover:border-gray-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#2E7D32] text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      {faq.question}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-700 leading-relaxed whitespace-pre-line border-t border-gray-100/80 mt-1">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Support Desk Footer */}
        <div className="p-4 border-t border-gray-100 bg-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>support@foodshare.org</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>+91 (800) FOOD-SHARE</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256428] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-end sm:self-auto"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  )
}
