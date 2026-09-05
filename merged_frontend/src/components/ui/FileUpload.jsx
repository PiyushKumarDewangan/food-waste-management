import { useRef, useState } from 'react'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'
import { validateFile } from '../../utils/validation'
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
} from '../../utils/constants'

export default function FileUpload({ label, file, onChange, required = false, optionalHint = '(optional)' }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const handleFiles = (fileList) => {
    const selected = fileList?.[0]
    if (!selected) return

    const validationError = validateFile(selected, {
      allowedTypes: ALLOWED_DOCUMENT_TYPES,
      maxSizeBytes: MAX_DOCUMENT_SIZE_BYTES,
    })

    if (validationError) {
      setError(validationError)
      onChange(null)
      return
    }

    setError('')
    onChange(selected)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setError('')
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-ink mb-1.5">
          {label} {!required && <span className="text-gray-400 font-normal">{optionalHint}</span>}
        </label>
      )}

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-7 px-4 text-center transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-borderc hover:border-primary hover:bg-primary/5'
          }`}
        >
          <UploadCloud className="w-6 h-6 text-gray-400" aria-hidden="true" />
          <span className="text-sm text-gray-500">Click to upload a document</span>
          <span className="text-xs text-gray-400">
            PDF, JPG, or PNG — max {MAX_DOCUMENT_SIZE_MB}MB
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-sm text-ink truncate">{file.name}</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove uploaded file"
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_DOCUMENT_EXTENSIONS.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  )
}
