import { Check } from 'lucide-react'
import { REGISTRATION_STEPS } from '../../utils/constants'

/**
 * activeKey: the key of the current step ('account' | 'role' | 'details' | 'complete')
 * completedSteps: array of step keys already completed
 */
export default function RegisterStepper({ activeKey, completedSteps = [] }) {
  return (
    <ol className="flex items-center mb-8" aria-label="Registration progress">
      {REGISTRATION_STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.key)
        const isActive = step.key === activeKey
        const isLast = index === REGISTRATION_STEPS.length - 1

        return (
          <li key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-white'
                    : isActive
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isActive ? 'text-primary' : isCompleted ? 'text-ink' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`h-0.5 flex-1 mx-2 mb-4 rounded-full transition-colors ${
                  isCompleted ? 'bg-primary' : 'bg-gray-200'
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
