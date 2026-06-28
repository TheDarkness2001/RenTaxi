const mockTrips = [
  { id: 'TR-001', passenger: 'Aziz K.', driver: 'Rustam T.', status: 'in_progress', fare: '32,000 UZS', city: 'Tashkent' },
  { id: 'TR-002', passenger: 'Malika S.', driver: '—', status: 'searching', fare: '18,500 UZS', city: 'Samarkand' },
  { id: 'TR-003', passenger: 'Jasur M.', driver: 'Bobur A.', status: 'driver_arriving', fare: '45,000 UZS', city: 'Tashkent' },
  { id: 'TR-004', passenger: 'Dilnoza R.', driver: 'Sardor N.', status: 'completed', fare: '12,000 UZS', city: 'Bukhara' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    in_progress: 'badge-blue',
    searching: 'badge-orange',
    driver_arriving: 'badge-green',
    completed: 'badge-green',
  };
  return map[status] || 'badge-blue';
};

export function TripsMonitor() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Trip Monitor</h2>
      <div className="glass" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
              {['Trip ID', 'Passenger', 'Driver', 'Status', 'Fare', 'City'].map((h) => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTrips.map((trip) => (
              <tr key={trip.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem', fontWeight: 500 }}>{trip.id}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{trip.passenger}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{trip.driver}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${statusBadge(trip.status)}`}>{trip.status.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{trip.fare}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.875rem' }}>{trip.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
