import { useState, useEffect, useRef } from 'react'

export function useFormSheet(open, editTarget, getInitialForm) {
  const mapperRef = useRef(getInitialForm)
  mapperRef.current = getInitialForm

  const [form, setForm] = useState(() => mapperRef.current(null))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(mapperRef.current(editTarget))
      setErrors({})
    }
  }, [open, editTarget])

  // Returns an onChange handler for a given form field key.
  // Also clears that field's validation error on each keystroke.
  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(err => ({ ...err, [key]: undefined }))
  }

  return { form, setForm, errors, setErrors, set }
}
