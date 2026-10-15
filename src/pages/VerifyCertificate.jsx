import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { certificatesApi } from '../api/misc'
import { Notice } from '../components/Feedback'
import Field from '../components/Field'

export default function VerifyCertificate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(() => searchParams.get('code') || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function checkCode(codeToVerify) {
    if (!codeToVerify) return
    setLoading(true); setError(''); setResult(null)
    try { setResult(await certificatesApi.verify(codeToVerify.trim())) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const qCode = searchParams.get('code') || ''
    setCode(qCode)
    if (qCode) {
      checkCode(qCode)
    } else {
      setResult(null)
      setError('')
    }
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    checkCode(code)
  }

  return (
    <div className="page page--narrow" style={{ padding: '3rem 1.5rem', margin: '0 auto' }}>
      <button
        type="button"
        className="link-button"
        style={{ marginBottom: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', cursor: 'pointer' }}
        onClick={() => {
          if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
            navigate(-1)
          } else {
            navigate('/certificates')
          }
        }}
      >
        <ChevronLeft size={16} /> Back
      </button>
      <h1>Verify a certificate</h1>
      <p className="muted">Enter the certificate code printed on the credential to confirm it's genuine.</p>
      <form onSubmit={handleSubmit} className="button-row">
        <Field label="Certificate code" name="code" required value={code} onChange={(e) => setCode(e.target.value)} />
        <button type="submit" className="btn btn--accent" disabled={loading || !code.trim()}>{loading ? 'Checking…' : 'Verify'}</button>
      </form>
      <Notice tone="error">{error}</Notice>
      {result && (
        <div className={`panel notice--${result.revoked ? 'warn' : 'success'}`} style={{ border: 'none' }}>
          <h2>{result.revoked ? 'Certificate revoked' : 'Certificate valid'}</h2>
          <dl className="detail-grid">
            <div><dt>Code</dt><dd>{result.certificateCode}</dd></div>
            <div><dt>Issued</dt><dd>{new Date(result.issuedDate).toLocaleDateString()}</dd></div>
          </dl>
        </div>
      )}
    </div>
  )
}
