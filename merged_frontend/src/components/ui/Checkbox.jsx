export default function Checkbox({ id, label, error, checked, onChange, className = '', ...rest }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-invalid={!!error}
          className="mt-0.5 w-4 h-4 rounded border-borderc text-primary focus:ring-primary accent-primary shrink-0"
          {...rest}
        />
        <span className="text-sm text-gray-600 leading-snug">{label}</span>
      </label>
      {error && <p className="mt-1.5 ml-6 text-xs text-red-500">{error}</p>}
    </div>
  )
}
