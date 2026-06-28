import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Car,
  ShieldAlert,
  Users,
  UserCheck,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/live-map', icon: Map, label: 'Live Map' },
  { to: '/trips', icon: Car, label: 'Trips' },
  { to: '/drivers', icon: UserCheck, label: 'Drivers' },
  { to: '/fraud', icon: ShieldAlert, label: 'Fraud' },
  { to: '/users', icon: Users, label: 'Users' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        className="glass"
        style={{
          width: 240,
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          margin: 12,
          position: 'fixed',
          height: 'calc(100vh - 24px)',
        }}
      >
        <div style={{ padding: '8px 12px', marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Taxi UZ</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Control Center</p>
        </div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(0, 122, 255, 0.12)' : 'transparent',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              transition: 'all 0.2s',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </aside>
      <main style={{ flex: 1, marginLeft: 264, padding: '24px 32px 32px' }}>
        {children}
      </main>
    </div>
  );
}
