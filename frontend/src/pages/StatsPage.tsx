import { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface StatsResponse {
  inputErrors: { user: string; total: number }[];
  monthlyLetters: { month: string; masuk: number; keluar: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data));
  }, []);

  // Helper untuk menghitung max value agar chart bar proporsional
  const getMaxLetters = () => {
    if (!stats) return 0;
    return Math.max(
      ...stats.monthlyLetters.map(m => Math.max(m.masuk, m.keluar)),
      1 // prevent division by zero
    );
  };
  
  const getMaxErrors = () => {
    if (!stats) return 0;
    return Math.max(...stats.inputErrors.map(e => e.total), 1);
  };

  const maxVal = getMaxLetters();
  const maxErr = getMaxErrors();

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Statistik</p>
          <h1>Dashboard Admin</h1>
        </div>
      </div>

      {!stats ? (
        <div className="empty-state-chart">Memuat data statistik...</div>
      ) : (
        <div className="stat-grid">
          {/* Card 1: Error Logs */}
          <div className="stat-card">
            <h3>
              <AlertCircle size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} className="text-danger" />
              Monitoring Kesalahan Input
            </h3>
            
            {stats.inputErrors.length === 0 ? (
              <p className="text-secondary" style={{ fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                Tidak ada kesalahan tercatat.
              </p>
            ) : (
              <div className="error-list">
                {stats.inputErrors.map((item) => (
                  <div className="user-error-item" key={item.user}>
                    <span className="user-info" title={item.user}>{item.user}</span>
                    <div className="progress-container">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(item.total / maxErr) * 100}%` }}
                      ></div>
                    </div>
                    <span className="error-count">{item.total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Monthly Chart */}
          <div className="stat-card">
            <h3>
              <TrendingUp size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
              Trafik Dokumen Bulanan
            </h3>
            
            {stats.monthlyLetters.length === 0 ? (
               <p className="text-secondary" style={{ fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                 Belum ada data dokumen.
               </p>
            ) : (
              <div className="chart-scroll-container">
                <div className="simple-bar-chart">
                  {stats.monthlyLetters.map((item) => (
                    <div className="chart-column" key={item.month}>
                      <div className="bars-group">
                        {/* Dokumen Masuk (Biru/Accent) */}
                        <div 
                          className="bar masuk" 
                          style={{ height: `${(item.masuk / maxVal) * 100}%` }} 
                          data-title={`Masuk: ${item.masuk}`}
                        >
                          <span className="bar-value">{item.masuk > 0 ? item.masuk : ''}</span>
                        </div>
                        {/* Dokumen Keluar (Hijau) */}
                        <div 
                          className="bar keluar" 
                          style={{ height: `${(item.keluar / maxVal) * 100}%` }} 
                          data-title={`Keluar: ${item.keluar}`}
                        >
                          <span className="bar-value">{item.keluar > 0 ? item.keluar : ''}</span>
                        </div>
                      </div>
                      <span className="chart-label">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, background: 'var(--accent-secondary)', borderRadius: 2 }}></span> Masuk
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, background: '#10b981', borderRadius: 2 }}></span> Keluar
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
