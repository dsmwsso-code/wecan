import DataTable from '@/components/DataTable';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>DPIMS நிர்வாகி செயலகம் (Admin Dashboard)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>விசேட தேவையுடையோரின் விபரங்களை நிர்வகித்தல்</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/reports" className="btn" style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>
            அறிக்கைகள் (Reports)
          </Link>
          <Link href="/admin/register" className="btn btn-primary">
            + புதிய நபரப் பதிவு செய்க
          </Link>
          <Link href="/" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            பொதுப் புள்ளிவிவரங்கள்
          </Link>
        </div>
      </header>

      <DataTable />
    </div>
  );
}
