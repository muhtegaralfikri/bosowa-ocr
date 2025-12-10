import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <section className="panel not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <p className="not-found-title">Halaman Tidak Ditemukan</p>
        <p className="not-found-desc">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <div className="not-found-actions">
          <button type="button" className="ghost-btn" onClick={() => navigate(-1)}>
            Kembali
          </button>
          <button type="button" className="primary-btn" onClick={() => navigate('/')}>
            Ke Beranda
          </button>
        </div>
      </div>
    </section>
  );
}
