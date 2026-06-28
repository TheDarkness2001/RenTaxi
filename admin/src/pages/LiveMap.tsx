export function LiveMap() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Live Map</h2>
      <div
        className="glass"
        style={{
          height: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>Real-time Driver Map</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Integrate Google Maps / Mapbox SDK here — shows all online drivers across Uzbekistan
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <span className="badge badge-green">3,891 Online</span>
          <span className="badge badge-blue">1,247 Active Trips</span>
          <span className="badge badge-orange">89 Searching</span>
        </div>
      </div>
    </div>
  );
}
