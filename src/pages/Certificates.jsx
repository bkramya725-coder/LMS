import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Award, ShieldCheck, Sparkles, Printer, ExternalLink,
  Search, Copy, Check, Eye, BookOpen, GraduationCap, CheckCircle2
} from 'lucide-react'
import { enrollmentsApi } from '../api/enrollments'
import { certificatesApi } from '../api/misc'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/useToast'
import { Loader, EmptyState } from '../components/Feedback'
import Modal from '../components/Modal'

export default function Certificates() {
  const { user, can } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [generatingId, setGeneratingId] = useState(null)
  const [previewItem, setPreviewItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [copiedCode, setCopiedCode] = useState(null)

  async function loadCertificates() {
    try {
      const enrollments = await enrollmentsApi.mine().catch(() => [])
      // Include completed enrollments or any that reached 100% progress
      const completed = enrollments.filter(
        (e) => e.status === 'COMPLETED' || Number(e.progressPercent || 0) >= 100
      )

      const withCerts = await Promise.all(
        completed.map(async (e) => {
          try {
            const cert = await certificatesApi.byEnrollment(e.enrollmentId)
            return { enrollment: e, certificate: cert }
          } catch {
            return { enrollment: e, certificate: null }
          }
        })
      )
      setRows(withCerts)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  async function handleGenerate(enrollmentId) {
    setGeneratingId(enrollmentId)
    try {
      const cert = await certificatesApi.generate(enrollmentId)
      toast.success('Certificate successfully generated!')
      setRows((prev) =>
        prev.map((r) =>
          r.enrollment.enrollmentId === enrollmentId ? { ...r, certificate: cert } : r
        )
      )
      const targetRow = rows?.find((r) => r.enrollment.enrollmentId === enrollmentId)
      if (targetRow) {
        setPreviewItem({ enrollment: targetRow.enrollment, certificate: cert })
      }
    } catch (e) {
      toast.error(e.message || 'Could not generate certificate')
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleRevoke(certificateId) {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return
    try {
      const updated = await certificatesApi.revoke(certificateId)
      setRows((list) =>
        list.map((r) =>
          r.certificate?.certificateId === certificateId ? { ...r, certificate: updated } : r
        )
      )
      if (previewItem?.certificate?.certificateId === certificateId) {
        setPreviewItem((prev) => ({ ...prev, certificate: updated }))
      }
      toast.success('Certificate revoked')
    } catch (e) {
      toast.error(e.message)
    }
  }

  function handleCopyCode(code) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Certificate code copied to clipboard!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function handlePrintCertificate() {
    window.print()
  }

  const filteredRows = useMemo(() => {
    if (!rows) return []
    return rows.filter(({ enrollment, certificate }) => {
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = (enrollment.course?.title || '').toLowerCase().includes(q)
      const codeMatch = (certificate?.certificateCode || '').toLowerCase().includes(q)
      const matchesSearch = !q || titleMatch || codeMatch

      if (!matchesSearch) return false
      if (filterTab === 'issued') return certificate && !certificate.revoked
      if (filterTab === 'pending') return !certificate
      return true
    })
  }, [rows, searchQuery, filterTab])

  if (error) return <p className="notice notice--error">{error}</p>
  if (!rows) return <Loader label="Loading certificates and credentials…" />

  const totalIssued = rows.filter((r) => r.certificate && !r.certificate.revoked).length
  const totalPending = rows.filter((r) => !r.certificate).length

  return (
    <div className="page certificates-page">
      {/* Page Header */}
      <div className="page__head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} color="var(--accent-500)" /> Verified Credentials
          </span>
          <h1 style={{ marginTop: '0.2rem' }}>Certificates & Diplomas</h1>
          <p className="muted">
            Official verifiable proof of course completion. Download, print, or share your credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/verify-certificate" className="btn btn--ghost btn--sm">
            <ShieldCheck size={15} /> Verify Any Credential
          </Link>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="analytics-metrics-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="panel metric-card" style={{ margin: 0 }}>
          <span className="metric-card__label">Earned Certificates</span>
          <span className="metric-card__value" style={{ color: 'var(--accent-600)' }}>
            {totalIssued}
          </span>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Issued and verified</span>
        </div>
        <div className="panel metric-card" style={{ margin: 0 }}>
          <span className="metric-card__label">Completed Courses</span>
          <span className="metric-card__value">{rows.length}</span>
          <span className="muted" style={{ fontSize: '0.8rem' }}>100% course requirements met</span>
        </div>
        <div className="panel metric-card" style={{ margin: 0 }}>
          <span className="metric-card__label">Pending Issuance</span>
          <span className="metric-card__value" style={{ color: totalPending > 0 ? 'var(--warn-600)' : 'inherit' }}>
            {totalPending}
          </span>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Ready to generate</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div className="search-input-wrap" style={{ maxWidth: 320, width: '100%' }}>
          <Search size={15} />
          <input
            className="search-input"
            placeholder="Search by course or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tab-row" style={{ margin: 0 }}>
          <button
            type="button"
            className={`tab-btn${filterTab === 'all' ? ' is-active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            className={`tab-btn${filterTab === 'issued' ? ' is-active' : ''}`}
            onClick={() => setFilterTab('issued')}
          >
            Issued ({totalIssued})
          </button>
          {totalPending > 0 && (
            <button
              type="button"
              className={`tab-btn${filterTab === 'pending' ? ' is-active' : ''}`}
              onClick={() => setFilterTab('pending')}
            >
              Ready to Claim ({totalPending})
            </button>
          )}
        </div>
      </div>

      {/* Certificate Grid */}
      {filteredRows.length === 0 ? (
        <EmptyState
          title={rows.length === 0 ? 'No completed courses yet' : 'No certificates match your search'}
          hint={
            rows.length === 0
              ? 'Complete a course with 100% progress and your certificate will be ready right here.'
              : 'Try clearing your search query or switching filters.'
          }
          action={
            rows.length === 0 ? (
              <Link to="/my-courses" className="btn btn--accent btn--sm" style={{ marginTop: '0.5rem' }}>
                <BookOpen size={14} /> Go to Courses
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filteredRows.map(({ enrollment, certificate }) => {
            const course = enrollment.course
            const isGenerating = generatingId === enrollment.enrollmentId

            return (
              <div
                key={enrollment.enrollmentId}
                className="panel certificate-card"
                style={{
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  borderTop: certificate ? '3px solid var(--accent-500)' : '3px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="pill pill--sm pill--info">
                      {course?.category || 'Academic Course'}
                    </span>
                    {certificate ? (
                      certificate.revoked ? (
                        <span className="pill pill--sm pill--warn">Revoked</span>
                      ) : (
                        <span className="pill pill--sm pill--success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> Issued
                        </span>
                      )
                    ) : (
                      <span className="pill pill--sm pill--warn">Completed · Ready to Claim</span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem' }}>{course?.title}</h3>

                  {certificate ? (
                    <div style={{ marginTop: '0.75rem', background: 'var(--bg-alt)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Credential Code
                        </span>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ padding: '0.2rem 0.4rem', height: 'auto', fontSize: '0.75rem' }}
                          onClick={() => handleCopyCode(certificate.certificateCode)}
                          title="Copy Code"
                        >
                          {copiedCode === certificate.certificateCode ? <Check size={12} color="green" /> : <Copy size={12} />}
                          <span style={{ marginLeft: 3 }}>Copy</span>
                        </button>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.95rem', color: 'var(--navy-800)' }}>
                        {certificate.certificateCode}
                      </div>
                      <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.35rem' }}>
                        Issued on {new Date(certificate.issuedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.75rem', background: 'rgba(201, 150, 47, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--warn-500)' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--navy-800)' }}>
                        🎉 Course complete! Click below to finalize and generate your official certificate.
                      </p>
                    </div>
                  )}
                </div>

                <div className="button-row" style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  {certificate ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--accent btn--sm"
                        style={{ flex: 1 }}
                        onClick={() => setPreviewItem({ enrollment, certificate })}
                      >
                        <Eye size={14} /> View Certificate
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => navigate(`/verify-certificate?code=${encodeURIComponent(certificate.certificateCode)}`)}
                        title="Verify credential online"
                      >
                        <ExternalLink size={14} /> Verify
                      </button>
                      {can('manageCourses') && !certificate.revoked && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ color: 'var(--error)' }}
                          onClick={() => handleRevoke(certificate.certificateId)}
                        >
                          Revoke
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--accent btn--sm"
                      style={{ width: '100%' }}
                      disabled={isGenerating}
                      onClick={() => handleGenerate(enrollment.enrollmentId)}
                    >
                      <Sparkles size={14} /> {isGenerating ? 'Generating Credential…' : 'Generate Certificate'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Diploma Preview Modal */}
      {previewItem && (
        <Modal
          title="Official Certificate of Completion"
          open={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => handleCopyCode(previewItem.certificate.certificateCode)}
              >
                <Copy size={14} /> Copy ID
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn--accent btn--sm"
                  onClick={handlePrintCertificate}
                >
                  <Printer size={14} /> Print / Save as PDF
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setPreviewItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          {/* Authentic Academic Diploma Parchment Card */}
          <div className="printable-certificate-wrapper">
            <div className="diploma-card">
              {/* Gold Ornament Inlay Border */}
              <div className="diploma-card__inner">
                {/* Header Crest */}
                <div className="diploma-card__crest">
                  <div className="diploma-card__seal">
                    <GraduationCap size={28} color="#C9962F" />
                  </div>
                  <span className="diploma-card__institution">LEARNFLOW ACADEMY</span>
                  <span className="diploma-card__subtitle">ONLINE ACADEMIC CREDENTIAL</span>
                </div>

                {/* Body Text */}
                <div className="diploma-card__title">Certificate of Completion</div>
                <div className="diploma-card__certify">This is proudly presented to certify that</div>

                <div className="diploma-card__recipient">
                  {previewItem.enrollment.student?.user?.fullName || user?.fullName || 'Distinguished Scholar'}
                </div>

                <div className="diploma-card__description">
                  has successfully satisfied all rigorous curriculum requirements, practical assignments,
                  and examinations for the comprehensive course
                </div>

                <div className="diploma-card__course">
                  "{previewItem.enrollment.course?.title}"
                </div>

                {/* Footer Badges and Signatures */}
                <div className="diploma-card__footer">
                  <div className="diploma-card__signature-col">
                    <div className="diploma-card__sign-line">
                      <span className="diploma-card__script">
                        {previewItem.enrollment.course?.instructor?.user?.fullName || 'Dr. Academic Director'}
                      </span>
                    </div>
                    <span className="diploma-card__sign-title">Lead Instructor & Faculty</span>
                  </div>

                  <div className="diploma-card__seal-medallion">
                    <Award size={36} color="#C9962F" />
                    <span className="diploma-card__seal-text">VERIFIED CREDENTIAL</span>
                  </div>

                  <div className="diploma-card__signature-col">
                    <div className="diploma-card__sign-line">
                      <span className="diploma-card__sign-meta">
                        Issued {new Date(previewItem.certificate.issuedDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="diploma-card__sign-title">
                      ID: {previewItem.certificate.certificateCode}
                    </span>
                  </div>
                </div>

                {/* Bottom Verification Note */}
                <div className="diploma-card__verification-note">
                  Verify authenticity anytime at:{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {window.location.origin}/verify-certificate?code={previewItem.certificate.certificateCode}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
