const users = [
  { id: 'U-001', phone: '+998901234567', status: 'active', kyc: 'verified', role: 'passenger, driver', city: 'Tashkent' },
  { id: 'U-002', phone: '+998907654321', status: 'pending_kyc', kyc: 'pending', role: 'passenger', city: 'Samarkand' },
  { id: 'U-003', phone: '+998931112233', status: 'suspended', kyc: 'verified', role: 'passenger', city: 'Bukhara' },
];

export function UsersManagement() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>User Management</h2>
      <div className="glass" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
              {['ID', 'Phone', 'Status', 'KYC', 'Roles', 'City', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem', fontWeight: 500 }}>{u.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{u.phone}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${u.status === 'active' ? 'badge-green' : u.status === 'suspended' ? 'badge-red' : 'badge-orange'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${u.kyc === 'verified' ? 'badge-green' : 'badge-orange'}`}>{u.kyc}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{u.role}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{u.city}</td>
                <td style={{ padding: '14px 16px' }}>
                  <button style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
