import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/client';
import type { Letter, PaginatedResponse } from '../api/types';

const PAGE_SIZE = 10;

export default function LettersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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
            placeholder="Cari letter number"
            className="search-input"
          />
          <Link to="/letters/new" className="ghost-btn">
            Tambah Surat
          </Link>
        </div>
      </div>
      <div className="table">
        <div className="table-row table-head">
          <span>Letter Number</span>
          <span>Jenis Surat</span>
          <span>Jenis Dokumen</span>
          <span>Tanggal</span>
          <span>Pengirim</span>
          <span>Perihal</span>
        </div>
        {isLoading && (
          <div className="table-row">
            <span>Sedang memuat surat...</span>
          </div>
        )}
        {!isLoading && letters.length === 0 && (
          <div className="table-row">
            <span>Tidak ada surat</span>
          </div>
        )}
        {letters.map((letter: Letter) => (
          <Link
            key={letter.id}
            to={`/letters/${letter.id}`}
            className="table-row"
          >
            <span>{letter.letterNumber}</span>
            <span>{letter.jenisSurat}</span>
            <span>{letter.jenisDokumen}</span>
            <span>{letter.tanggalSurat}</span>
            <span>{letter.namaPengirim || '-'}</span>
            <span>{letter.perihal || '-'}</span>
          </Link>
        ))}
      </div>
      <div className="actions" style={{ marginTop: '1rem', gap: '0.75rem' }}>
        <button
          type="button"
          className="ghost-btn"
          onClick={goToPrev}
          disabled={page <= 1}
        >
          Prev
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
          Next
        </button>
      </div>
    </section>
  );
}
