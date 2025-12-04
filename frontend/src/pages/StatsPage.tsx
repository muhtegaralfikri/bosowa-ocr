import { useEffect, useState } from 'react';
import api from '../api/client';

interface StatsResponse {
  inputErrors: { user: string; total: number }[];
  monthlyLetters: { month: string; masuk: number; keluar: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);

  useEffect(() => {
    api.get('/stats').then((res) => setStats(res.data));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Stats</p>
          <h1>Ringkasan Admin</h1>
        </div>
      </div>
      {!stats && <p>Memuat statistik...</p>}
      {stats && (
        <div className="grid two-col">
          <div className="card">
            <h3>Kesalahan input per user</h3>
            <ul>
              {stats.inputErrors.map((item) => (
                <li key={item.user}>
                  {item.user}: {item.total}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Surat per bulan</h3>
            <ul>
              {stats.monthlyLetters.map((item) => (
                <li key={item.month}>
                  {item.month}: Masuk {item.masuk} / Keluar {item.keluar}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
