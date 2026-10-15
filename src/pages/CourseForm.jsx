import { useState } from 'react'
import Field from '../components/Field'
import { Notice } from '../components/Feedback'
import { validateCourse } from '../utils/validators'

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function CourseForm({ initial, onSubmit, onCancel, submitLabel = 'Save course' }) {
  const [values, setValues] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || '',
    level: initial?.level || 'BEGINNER',
    thumbnailUrl: initial?.thumbnailUrl || '',
    price: initial?.price ?? '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const fieldErrors = validateCourse(values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return

    setSaving(true)
    setServerError('')
    try {
      await onSubmit({ ...values, price: values.price === '' ? 0 : Number(values.price) })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Notice tone="error">{serverError}</Notice>
      <Field label="Title" name="title" required error={errors.title} value={values.title} onChange={handleChange} />
      <Field label="Description" name="description" as="textarea" rows={4} value={values.description} onChange={handleChange} />
      <div className="field-row">
        <Field label="Category" name="category" value={values.category} onChange={handleChange} />
        <Field label="Level" name="level" as="select" value={values.level} onChange={handleChange}>
          {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </Field>
      </div>
      <div className="field-row">
        <Field label="Thumbnail URL" name="thumbnailUrl" hint="Optional" value={values.thumbnailUrl} onChange={handleChange} />
        <Field label="Price" name="price" type="number" min="0" step="0.01" error={errors.price} value={values.price} onChange={handleChange} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--accent" disabled={saving}>{saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  )
}
