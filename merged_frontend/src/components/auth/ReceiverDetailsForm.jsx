import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, User, MapPin, Warehouse, Clock } from 'lucide-react'
import Input from '../ui/Input.jsx'
import FileUpload from '../ui/FileUpload.jsx'
import Button from '../ui/Button.jsx'
import { useRegistration } from '../../context/RegistrationContext.jsx'
import { validateRequired, runValidators } from '../../utils/validation'
import authService from '../../services/authService'

export default function ReceiverDetailsForm() {
  const navigate = useNavigate()
  const { data, updateFields, markStepComplete, setSubmissionResult } = useRegistration()
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (field) => (e) => {
    updateFields({ [field]: e.target.value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = runValidators(data, {
      organizationName: (v) => validateRequired(v, 'Organization name'),
      contactPerson: (v) => validateRequired(v, 'Contact person name'),
      organizationAddress: (v) => validateRequired(v, 'Organization address'),
      storageCapacity: (v) => validateRequired(v, 'Storage capacity'),
      operatingHours: (v) => validateRequired(v, 'Operating hours'),
    })
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: `${data.countryCode}${data.phone}`,
        password: data.password,
        city: data.city,
        role: 'receiver',
        organizationName: data.organizationName,
        contactPerson: data.contactPerson,
        organizationAddress: data.organizationAddress,
        storageCapacity: data.storageCapacity,
        operatingHours: data.operatingHours,
        verificationDocument: data.verificationDocument,
        termsAccepted: data.termsAccepted,
      }
      const result = await authService.registerReceiver(payload)
      setSubmissionResult(result)
      markStepComplete('details')
      navigate('/register/complete')
    } catch (err) {
      setFormError(err.message || 'Something went wrong submitting your registration.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => navigate('/register/role')

  return (
    <div className="bg-white rounded-2xl shadow-card border border-borderc/60 px-8 py-9">
      <h1 className="text-xl font-bold text-ink">Organization Details</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Help us set up your profile correctly.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="organizationName"
          label="Organization name"
          icon={Building2}
          placeholder="Hope Community Center"
          value={data.organizationName}
          onChange={handleChange('organizationName')}
          error={errors.organizationName}
          required
        />

        <Input
          id="contactPerson"
          label="Contact person name"
          icon={User}
          placeholder="John Omondi"
          value={data.contactPerson}
          onChange={handleChange('contactPerson')}
          error={errors.contactPerson}
          required
        />

        <Input
          id="organizationAddress"
          label="Organization address"
          icon={MapPin}
          placeholder="45 Ngong Road, Nairobi"
          value={data.organizationAddress}
          onChange={handleChange('organizationAddress')}
          error={errors.organizationAddress}
          required
        />

        <Input
          id="storageCapacity"
          label="Storage capacity / food storage availability"
          icon={Warehouse}
          placeholder="e.g. Cold storage, 200 kg capacity"
          value={data.storageCapacity}
          onChange={handleChange('storageCapacity')}
          error={errors.storageCapacity}
          required
        />

        <Input
          id="operatingHours"
          label="Operating hours"
          icon={Clock}
          placeholder="Mon-Fri, 8 AM - 6 PM"
          value={data.operatingHours}
          onChange={handleChange('operatingHours')}
          error={errors.operatingHours}
          required
        />

        <FileUpload
          label="Organization verification"
          file={data.verificationDocument}
          onChange={(file) => updateFields({ verificationDocument: file })}
        />

        {formError && (
          <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {formError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={handleBack} className="flex-1 justify-center">
            ← Back
          </Button>
          <Button type="submit" variant="primary" loading={loading} className="flex-1 justify-center">
            Submit for review →
          </Button>
        </div>
      </form>
    </div>
  )
}
