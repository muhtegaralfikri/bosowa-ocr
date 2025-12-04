import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/client';
import type { Letter, PaginatedResponse } from '../api/types';

const PAGE_SIZE = 10;
const columns = [
  { key: 'letterNumber', label: 'Nomor Surat' },
  { key: 'jenisSurat', label: 'Jenis Surat' },
  { key: 'jenisDokumen', label: 'Jenis Dokumen' },
  { key: 'tanggalSurat', label: 'Tanggal' },
  { key: 'namaPengirim', label: 'Pengirim' },
  { key: 'perihal', label: 'Perihal' },
] as const;

export default function LettersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const getCellValue = (
    letter: Letter,
    key: (typeof columns)[number]['key'],
  ) => {
    switch (key) {
      case 'letterNumber':
        return letter.letterNumber;
      case 'jenisSurat':
        return letter.jenisSurat;
      case 'jenisDokumen':
        return letter.jenisDokumen;
      case 'tanggalSurat':
        return letter.tanggalSurat;
      case 'namaPengirim':
        return letter.namaPengirim || '-';
      case 'perihal':
        return letter.perihal || '-';
      default:
        return '';
    }
  };

  const { data, isLoading, isFetching } = useQuery<PaginatedResponse<Letter>>(
    {
      queryKey: ['letters', { search, page }],
      queryFn: async (): Promise<PaginatedResponse<Letter>> => {
        try {
          const res = await api.get('/letters', {
            params: {
              letterNumber: search || undefined,
              page,
              limit: PAGE_SIZE,
            },
          });
          return res.data as PaginatedResponse<Letter>;
        } catch (err) {
          toast.error('Gagal memuat daftar surat');
          throw err;
        }
      },
      retry: 1,
    },
  );

  const letters = data?.data ?? [];
  const totalPages = Math.max(data?.meta.pageCount ?? 1, 1);

  const goToPrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const goToNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages || prev + 1));

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Daftar</p>
          <h1>Surat & Invoice</h1>
        </div>
        <div className="actions">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nomor surat"
            className="search-input"
          />
          <Link to="/surat/baru" className="ghost-btn">
            Tambah Surat
          </Link>
        </div>
      </div>
      <div className="table-container">
        <div className="table">
          <div className="table-row table-head">
            {columns.map((col) => (
              <span key={col.key}>{col.label}</span>
            ))}
          </div>
          {isLoading && (
            <div className="table-row table-message">
              <span>Sedang memuat surat...</span>
            </div>
          )}
          {!isLoading && letters.length === 0 && (
            <div className="table-row table-message">
              <span>Tidak ada surat</span>
            </div>
          )}
          {letters.map((letter: Letter) => (
            <Link
              key={letter.id}
              to={`/surat/${letter.id}`}
              className="table-row table-body-row"
            >
              {columns.map((col) => (
                <div key={col.key} className="table-cell">
                  <span className="cell-label">{col.label}</span>
                  <span className="cell-value">{getCellValue(letter, col.key)}</span>
                </div>
              ))}
            </Link>
          ))}
        </div>
      </div>
      <div className="actions" style={{ marginTop: '1rem', gap: '0.75rem' }}>
        <button
          type="button"
          className="ghost-btn"
          onClick={goToPrev}
          disabled={page <= 1}
        >
          Sebelumnya
        </button>
        <span>
          Halaman {page} / {totalPages} {isFetching && '(memuat...)'}
        </span>
        <button
          type="button"
          className="ghost-btn"
          onClick={goToNext}
          disabled={page >= totalPages}
        >
          Berikutnya
        </button>
      </div>
    </section>
  );
}
