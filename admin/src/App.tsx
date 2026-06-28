import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LiveMap } from './pages/LiveMap';
import { TripsMonitor } from './pages/TripsMonitor';
import { DriverApproval } from './pages/DriverApproval';
import { FraudPanel } from './pages/FraudPanel';
import { UsersManagement } from './pages/UsersManagement';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live-map" element={<LiveMap />} />
        <Route path="/trips" element={<TripsMonitor />} />
        <Route path="/drivers" element={<DriverApproval />} />
        <Route path="/fraud" element={<FraudPanel />} />
        <Route path="/users" element={<UsersManagement />} />
      </Routes>
    </Layout>
  );
}
