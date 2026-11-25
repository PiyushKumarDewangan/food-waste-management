import { formatUnit } from '../../utils/unitHelper'

/**
 * Renders an itemized list of badges for a combined basket order.
 * Renders null if only a single item or no items.
 *
 * @param {Array} items - Array of item objects { title, requestedQuantity, requestedUnit }
 * @param {string} className - Optional container styling
 */
export default function CombinedItemsBreakdown({ items, className = '' }) {
  if (!Array.isArray(items) || items.length <= 1) return null

  return (
    <div className={`flex flex-wrap items-center gap-1.5 pt-1.5 ${className}`}>
      {items.map((it, idx) => {
        const qty = Number(it.requestedQuantity || it.quantity || it.servings) || 1
        const unit = formatUnit(it.requestedUnit || it.unit || 'Servings')
        const title = it.title || it.donation?.title || 'Food Item'

        return (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
            {qty} {unit} of {title}
          </span>
        )
      })}
    </div>
  )
}
