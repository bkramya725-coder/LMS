export default function Field({ label, name, error, as = 'input', children, hint, required, ...rest }) {
  const Tag = as
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <span className="field__required"> *</span>}
      </span>
      <Tag id={name} name={name} className={`field__control${error ? ' field__control--error' : ''}`} {...rest}>
        {children}
      </Tag>
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </label>
  )
}
