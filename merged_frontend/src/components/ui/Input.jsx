export default function Input({
  id,
  label,
  icon: Icon,
  error,
  className = '',
  containerClassName = '',
  required = false,
  ...rest
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
          {label}
          {required && <span className="text-primary"> *</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-white text-sm text-ink placeholder:text-gray-400 py-3 ${
            Icon ? 'pl-10' : 'pl-4'
          } pr-4 outline-none transition-colors ${
            error ? 'border-red-400 focus:border-red-500' : 'border-borderc focus:border-primary'
          } ${className}`}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
