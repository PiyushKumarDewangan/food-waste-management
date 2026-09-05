import { Check } from 'lucide-react'

export default function RoleCard({ icon: Icon, title, description, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-borderc bg-white hover:border-secondary hover:bg-primary/5'
      }`}
    >
      <span
        className={`flex items-center justify-center w-11 h-11 rounded-lg shrink-0 ${
          selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
        }`}
      >
        <Icon className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-ink text-sm">{title}</span>
        <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
      </span>
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full border shrink-0 ${
          selected ? 'bg-primary border-primary text-white' : 'border-gray-300 text-transparent'
        }`}
      >
        <Check className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </button>
  )
}
