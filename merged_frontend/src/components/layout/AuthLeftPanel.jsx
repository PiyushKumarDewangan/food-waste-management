import { Leaf } from 'lucide-react'
import { PLATFORM_STATS, TESTIMONIAL } from '../../utils/constants'

// Inlined so it can be styled/animated with Tailwind without an svgr build step.
// A static copy also lives at src/assets/illustrations/food-donation.svg.
function FoodDonationIllustration({ className }) {
  return (
    <svg viewBox="0 0 240 200" className={className} role="img" aria-label="Illustration of a food donation box being shared">
      <ellipse cx="120" cy="178" rx="70" ry="10" fill="#1B5E20" opacity="0.15" />
      <path d="M40 118c-14 4-22 16-22 28 0 4 3 7 7 7h20" fill="#66BB6A" />
      <ellipse cx="34" cy="118" rx="18" ry="14" fill="#FFB74D" />
      <path d="M200 118c14 4 22 16 22 28 0 4-3 7-7 7h-20" fill="#66BB6A" />
      <ellipse cx="206" cy="118" rx="18" ry="14" fill="#FFB74D" />
      <rect x="70" y="100" width="100" height="60" rx="10" fill="#FFFFFF" />
      <rect x="70" y="100" width="100" height="22" rx="10" fill="#E8F5E9" />
      <rect x="70" y="100" width="100" height="60" rx="10" stroke="#1B5E20" strokeWidth="2" fill="none" />
      <path d="M100 100c0-8 8-14 20-14s20 6 20 14" stroke="#1B5E20" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="58" cy="72" r="9" fill="#FFB74D" />
      <circle cx="182" cy="66" r="7" fill="#A5D6A7" />
      <circle cx="120" cy="52" r="5" fill="#FFFFFF" opacity="0.8" />
      <path d="M150 62c4-6 12-6 16 0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

/**
 * The green split-screen panel shared by every auth / registration screen.
 *
 * mode: 'login' | 'register'
 *  - 'login' shows the tagline + impact stats (matches the login PDF frame)
 *  - 'register' shows a step-specific headline + testimonial (matches the
 *    registration PDF frames)
 */
export default function AuthLeftPanel({
  mode = 'login',
  heading,
  subheading,
}) {
  const defaultHeading =
    mode === 'login' ? (
      <>
        Share Food.
        <br />
        Create Impact.
      </>
    ) : (
      heading
    )

  const defaultSubheading =
    mode === 'login'
      ? 'Connect surplus food with the people and communities who need it most.'
      : subheading

  return (
    <div className="relative hidden lg:flex lg:w-[38%] xl:w-[32%] min-h-screen flex-col justify-between overflow-hidden bg-primary px-10 py-10 text-white">
      {/* Ambient background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 animate-pulseSoft"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-white/5 animate-pulseSoft"
      />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
          <Leaf className="w-4 h-4 text-white" aria-hidden="true" />
        </span>
        <span className="font-bold text-base tracking-tight">FoodBridge</span>
      </div>

      {/* Illustration + copy */}
      <div className="relative z-10 flex flex-col items-center text-center gap-8 my-auto py-10">
        <div className="relative w-56">
          <div className="absolute -top-3 -right-2 w-4 h-4 rounded-full bg-accent animate-floatSlow" aria-hidden="true" />
          <div className="absolute bottom-2 -left-3 w-3 h-3 rounded-full bg-white/40 animate-floatSlower" aria-hidden="true" />
          <FoodDonationIllustration className="w-full h-auto animate-floatSlow" />
        </div>

        <div>
          <h1 className="text-3xl font-bold leading-snug">{defaultHeading}</h1>
          {defaultSubheading && (
            <p className="mt-3 text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
              {defaultSubheading}
            </p>
          )}
        </div>
      </div>

      {/* Footer content: stats for login, testimonial for register */}
      <div className="relative z-10">
        {mode === 'login' ? (
          <div className="grid grid-cols-3 gap-3">
            {PLATFORM_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 py-3 px-2 text-center backdrop-blur-sm"
              >
                <div className="font-bold text-base">{stat.value}</div>
                <div className="text-[11px] text-white/75 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white/10 px-4 py-3.5 backdrop-blur-sm">
            <p className="text-xs text-white/90 leading-relaxed italic">&ldquo;{TESTIMONIAL.quote}&rdquo;</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-[11px] font-semibold">
                {TESTIMONIAL.initials}
              </span>
              <div>
                <div className="text-xs font-semibold">{TESTIMONIAL.name}</div>
                <div className="text-[11px] text-white/70">{TESTIMONIAL.role}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
