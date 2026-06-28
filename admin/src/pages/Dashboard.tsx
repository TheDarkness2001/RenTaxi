import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts';

const tripData = [
  { hour: '06', trips: 120 },
  { hour: '08', trips: 890 },
  { hour: '10', trips: 540 },
  { hour: '12', trips: 620 },
  { hour: '14', trips: 480 },
  { hour: '16', trips: 710 },
  { hour: '18', trips: 980 },
  { hour: '20', trips: 650 },
  { hour: '22', trips: 320 },
];

const revenueData = [
  { day: 'Mon', revenue: 45_000_000 },
  { day: 'Tue', revenue: 52_000_000 },
  { day: 'Wed', revenue: 48_000_000 },
  { day: 'Thu', revenue: 61_000_000 },
  { day: 'Fri', revenue: 72_000_000 },
  { day: 'Sat', revenue: 68_000_000 },
  { day: 'Sun', revenue: 55_000_000 },
];

function StatCard({ label, value, change, color }: {
  label: string; value: string; change: string; color: string;
}) {
  return (
    <div className="glass" style={{ padding: 24, flex: 1 }}>
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ marginTop: 8 }}>{value}</p>
      <p style={{ marginTop: 8, fontSize: '0.8125rem', color }}>{change}</p>
    </div>
  );
}

export function Dashboard() {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="Active Trips" value="1,247" change="+12% vs yesterday" color="var(--accent-green)" />
        <StatCard label="Online Drivers" value="3,891" change="78% of fleet" color="var(--accent)" />
        <StatCard label="Revenue Today" value="68.4M UZS" change="+8.2% vs avg" color="var(--accent-green)" />
        <StatCard label="Pending KYC" value="142" change="23 driver approvals" color="var(--accent-orange)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Trips by Hour</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tripData}>
              <XAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Bar dataKey="trips" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Weekly Revenue (UZS)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="revenue" stroke="var(--accent-green)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
