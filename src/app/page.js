import { prisma } from '@/lib/prisma';
import DashboardCharts from '@/components/DashboardCharts';
import PublicGallery from '@/components/PublicGallery';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function PublicDashboard() {
  // Fetch aggregations
  const totalCount = await prisma.disabledPerson.count();
  const maleCount = await prisma.disabledPerson.count({ where: { gender: 'Male' } });
  const femaleCount = await prisma.disabledPerson.count({ where: { gender: 'Female' } });
  
  const childrenCount = await prisma.disabledPerson.count({ where: { age: { lt: 18 } } });
  const adultsCount = await prisma.disabledPerson.count({ where: { age: { gte: 18, lt: 60 } } });
  const elderlyCount = await prisma.disabledPerson.count({ where: { age: { gte: 60 } } });

  // Get Disability Types Summary
  const disabilityTypesRaw = await prisma.disabledPerson.groupBy({
    by: ['disabilityTypeId'],
    _count: { id: true },
  });

  const disabilityTypes = await prisma.disabilityType.findMany();
  const typeChartData = disabilityTypes.map(t => ({
    name: t.name,
    count: disabilityTypesRaw.find(r => r.disabilityTypeId === t.id)?._count.id || 0,
  })).filter(t => t.count > 0);

  // Get GN Division Summary
  const gnDivisionsRaw = await prisma.disabledPerson.groupBy({
    by: ['gnDivisionId'],
    _count: { id: true },
  });

  const gnDivisions = await prisma.gnDivision.findMany();
  const gnChartData = gnDivisions.map(g => ({
    name: g.name,
    count: gnDivisionsRaw.find(r => r.gnDivisionId === g.id)?._count.id || 0,
  })).filter(g => g.count > 0).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10

  const stats = {
    total: totalCount,
    male: maleCount,
    female: femaleCount,
    children: childrenCount,
    adults: adultsCount,
    elderly: elderlyCount,
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      
      {/* Banner Image */}
      <div style={{ marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <img 
          src="/banner.jpg" 
          alt="Wecan Banner" 
          style={{ width: '100%', height: 'auto', display: 'block' }} 
        />
      </div>

      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ flex: '1 1 100%', minWidth: '250px' }}>
          <h1 style={{ color: 'var(--primary-blue)', margin: '0 0 0.5rem 0', fontSize: '1.5rem', lineHeight: '1.4' }}>
            விசேட தேவையுடையோருக்கான தரவுத்தளம் (Wecan)
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>பொதுப் புள்ளிவிவரங்கள்</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/about" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            எம்மைப்பற்றி (About Us)
          </Link>
          <Link href="/login" className="btn btn-primary">
            உள்நுழைக (Login)
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard title="மொத்தம்" value={stats.total} color="var(--primary-blue)" />
        <StatCard title="ஆண்கள்" value={stats.male} color="#3b82f6" />
        <StatCard title="பெண்கள்" value={stats.female} color="#ec4899" />
        <StatCard title="சிறுவர்கள் (<18)" value={stats.children} color="#10b981" />
        <StatCard title="பெரியவர்கள் (18-59)" value={stats.adults} color="#f59e0b" />
        <StatCard title="முதியவர்கள் (60+)" value={stats.elderly} color="#8b5cf6" />
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <DashboardCharts 
          stats={stats} 
          typeChartData={typeChartData} 
          gnChartData={gnChartData} 
        />
      </div>

      {/* Photo Gallery Section */}
      <PublicGallery />

    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${color}`, textAlign: 'center', padding: '1rem' }}>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{value}</p>
    </div>
  );
}
