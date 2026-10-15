export default function KpiCard({ icon: Icon, label, value, delta, deltaTone = 'good' }) {
  return (
    <div className="kpi-card">
      <div className="kpi-card__top"><Icon size={17} /></div>
      <div className="kpi-card__value">{value}</div>
      <div className="kpi-card__label">{label}</div>
      {delta && <div className={`kpi-card__delta ${deltaTone}`}>{delta}</div>}
    </div>
  )
}
