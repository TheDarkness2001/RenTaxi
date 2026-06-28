const alerts = [
  { type: 'Fake GPS', user: 'User #8821', severity: 'high', detail: 'Impossible speed: 340 km/h detected', time: '2 min ago' },
  { type: 'Duplicate Face', user: 'User #9104', severity: 'critical', detail: 'Face match with banned account #4421', time: '15 min ago' },
  { type: 'Suspicious Payment', user: 'User #7733', severity: 'medium', detail: '5 failed card attempts in 10 minutes', time: '32 min ago' },
  { type: 'Bot Behavior', user: 'User #6655', severity: 'high', detail: 'Automated OTP requests from 12 devices', time: '1 hr ago' },
];

export function FraudPanel() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Fraud Detection</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alerts.map((a, i) => (
          <div key={i} className="glass" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${a.severity === 'critical' ? 'badge-red' : a.severity === 'high' ? 'badge-orange' : 'badge-blue'}`}>
                  {a.severity}
                </span>
                <span style={{ fontWeight: 600 }}>{a.type}</span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8 }}>{a.detail}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>{a.user} · {a.time}</p>
            </div>
            <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-red)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              Investigate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
