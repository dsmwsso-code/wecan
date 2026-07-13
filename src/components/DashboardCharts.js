'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function DashboardCharts({ stats, typeChartData, gnChartData }) {
  // Common Colors
  const colors = [
    'rgba(13, 71, 161, 0.8)',
    'rgba(21, 101, 192, 0.8)',
    'rgba(30, 136, 229, 0.8)',
    'rgba(66, 165, 245, 0.8)',
    'rgba(144, 202, 249, 0.8)',
    'rgba(255, 152, 0, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(244, 63, 94, 0.8)',
  ];

  // 1. GN Division Summary - Bar Chart
  const gnBarData = {
    labels: gnChartData.map(d => d.name),
    datasets: [
      {
        label: 'Disabled Persons',
        data: gnChartData.map(d => d.count),
        backgroundColor: 'rgba(13, 71, 161, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  // 2. Disability Type - Doughnut Chart
  const typeDoughnutData = {
    labels: typeChartData.map(d => d.name),
    datasets: [
      {
        data: typeChartData.map(d => d.count),
        backgroundColor: colors.slice(0, typeChartData.length),
        borderWidth: 1,
      },
    ],
  };

  // 3. Gender Summary - Pie Chart
  const genderPieData = {
    labels: ['Male', 'Female'],
    datasets: [
      {
        data: [stats.male, stats.female],
        backgroundColor: ['#3b82f6', '#ec4899'],
        borderWidth: 1,
      },
    ],
  };

  // 4. Age Group Summary - Line Chart (Or Bar)
  const ageLineData = {
    labels: ['Children (<18)', 'Adults (18-59)', 'Elderly (60+)'],
    datasets: [
      {
        label: 'Count',
        data: [stats.children, stats.adults, stats.elderly],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
      
      {/* GN Division Bar Chart */}
      <div style={{ height: '350px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>முன்னணி 10 கிராம உத்தியோகத்தர் பிரிவுகள்</h3>
        {gnChartData.length > 0 ? (
          <Bar data={gnBarData} options={chartOptions} />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>தரவுகள் ஏதும் இல்லை</p>
        )}
      </div>

      {/* Disability Types Doughnut Chart */}
      <div style={{ height: '350px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>குறைபாடுகளின் வகைப்பாடு</h3>
        {typeChartData.length > 0 ? (
          <Doughnut data={typeDoughnutData} options={chartOptions} />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>தரவுகள் ஏதும் இல்லை</p>
        )}
      </div>

      {/* Gender Pie Chart */}
      <div style={{ height: '350px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>பாலினப் பரம்பல்</h3>
        {(stats.male > 0 || stats.female > 0) ? (
          <Pie data={genderPieData} options={chartOptions} />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>தரவுகள் ஏதும் இல்லை</p>
        )}
      </div>

      {/* Age Groups Line Chart */}
      <div style={{ height: '350px' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)' }}>வயதுப் பரம்பல்</h3>
        {(stats.children > 0 || stats.adults > 0 || stats.elderly > 0) ? (
          <Line data={ageLineData} options={chartOptions} />
        ) : (
          <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>தரவுகள் ஏதும் இல்லை</p>
        )}
      </div>

    </div>
  );
}
