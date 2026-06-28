const pendingDrivers = [
  { name: 'Rustam Toshmatov', phone: '+998901234567', vehicle: 'Chevrolet Cobalt 2021', city: 'Tashkent', docs: 'Complete' },
  { name: 'Bobur Azimov', phone: '+998907654321', vehicle: 'Kia K5 2023', city: 'Samarkand', docs: 'Complete' },
  { name: 'Sardor Niyazov', phone: '+998931112233', vehicle: 'Daewoo Matiz 2019', city: 'Bukhara', docs: 'Missing insurance' },
];

export function DriverApproval() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Driver Approval</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pendingDrivers.map((d) => (
          <div key={d.phone} className="glass" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600 }}>{d.name}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {d.phone} · {d.vehicle} · {d.city}
              </p>
              <span className={`badge ${d.docs === 'Complete' ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: 8 }}>
                {d.docs}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Approve
              </button>
              <button style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--accent-red)', fontWeight: 600, cursor: 'pointer' }}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
