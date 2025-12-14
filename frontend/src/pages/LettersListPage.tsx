import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    namaPengirim: '',
    perihal: '',
    jenisDokumen: '',
    jenisSurat: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    nominalMin: '',
    nominalMax: ''
  });

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
      queryKey: ['letters', { search, page, ...filters }],
      queryFn: async (): Promise<PaginatedResponse<Letter>> => {
        try {
          const params: any = {
            page,
            limit: PAGE_SIZE,
          };
          
          // Add search parameters
          if (search) params.keyword = search;
          if (filters.namaPengirim) params.namaPengirim = filters.namaPengirim;
          if (filters.perihal) params.perihal = filters.perihal;
          if (filters.jenisDokumen) params.jenisDokumen = filters.jenisDokumen;
          if (filters.jenisSurat) params.jenisSurat = filters.jenisSurat;
          if (filters.tanggalMulai) params.tanggalMulai = filters.tanggalMulai;
          if (filters.tanggalSelesai) params.tanggalSelesai = filters.tanggalSelesai;
          if (filters.nominalMin) params.nominalMin = filters.nominalMin;
          if (filters.nominalMax) params.nominalMax = filters.nominalMax;

          const res = await api.get('/letters', { params });
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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      namaPengirim: '',
      perihal: '',
      jenisDokumen: '',
      jenisSurat: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      nominalMin: '',
      nominalMax: ''
    });
    setSearch('');
    setPage(1);
  };

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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari semua field"
            className="search-input"
          />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ghost-btn"
          >
            {showAdvanced ? 'Sembunyikan Filter' : 'Filter Lanjutan'}
          </button>
          <Link to="/letters/new" className="primary-btn">
            Tambah Surat
          </Link>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showAdvanced && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Filter</p>
              <h1>Filter Lanjutan</h1>
              <p className="small-note">Cari berdasarkan kriteria spesifik</p>
            </div>
            <button 
              type="button" 
              className="ghost-btn" 
              onClick={handleResetFilters}
            >
              Reset Filter
            </button>
          </div>
          
          <div className="form-grid two-col">
            <label>
              Nama Pengirim
              <input
                value={filters.namaPengirim}
                onChange={(e) => handleFilterChange('namaPengirim', e.target.value)}
                placeholder="PT Contoh Abadi"
              />
            </label>
            
            <label>
              Perihal
              <input
                value={filters.perihal}
                onChange={(e) => handleFilterChange('perihal', e.target.value)}
                placeholder="Pembayaran invoice"
              />
            </label>
            
            <label>
              Jenis Dokumen
              <select
                value={filters.jenisDokumen}
                onChange={(e) => handleFilterChange('jenisDokumen', e.target.value)}
              >
                <option value="">Semua</option>
                <option value="SURAT">SURAT</option>
                <option value="INVOICE">INVOICE</option>
              </select>
            </label>
            
            <label>
              Jenis Surat
              <select
                value={filters.jenisSurat}
                onChange={(e) => handleFilterChange('jenisSurat', e.target.value)}
              >
                <option value="">Semua</option>
                <option value="MASUK">MASUK</option>
                <option value="KELUAR">KELUAR</option>
              </select>
            </label>
            
            <label>
              Tanggal Mulai
              <input
                type="date"
                value={filters.tanggalMulai}
                onChange={(e) => handleFilterChange('tanggalMulai', e.target.value)}
              />
            </label>
            
            <label>
              Tanggal Selesai
              <input
                type="date"
                value={filters.tanggalSelesai}
                onChange={(e) => handleFilterChange('tanggalSelesai', e.target.value)}
              />
            </label>
            
            <label>
              Nominal Minimum
              <input
                type="number"
                value={filters.nominalMin}
                onChange={(e) => handleFilterChange('nominalMin', e.target.value)}
                placeholder="0"
              />
            </label>
            
            <label>
              Nominal Maksimum
              <input
                type="number"
                value={filters.nominalMax}
                onChange={(e) => handleFilterChange('nominalMax', e.target.value)}
                placeholder="999999999"
              />
            </label>
          </div>
        </section>
      )}
      
      <div className="table-container">
        <div className="table">
          <div 
            className="table-row table-head"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1.2fr 2fr 2.5fr' }}
          >
            {columns.map((col) => (
              <span key={col.key}>{col.label}</span>
            ))}
          </div>
          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton-row">
                  {columns.map((col) => (
                    <div key={col.key} className="skeleton skeleton-cell" />
                  ))}
                </div>
              ))}
            </>
          )}
          {!isLoading && letters.length === 0 && (
            <div className="table-row table-message">
              <span>Tidak ada surat</span>
            </div>
          )}
          {letters.map((letter: Letter) => (
            <Link
              key={letter.id}
              to={`/letters/${letter.id}`}
              className="table-row table-body-row"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1.2fr 2fr 2.5fr' }}
            >
              {columns.map((col) => (
                <div key={col.key} className="table-cell" style={{ minWidth: 0 }}>
                  <span className="cell-label">{col.label}</span>
                  <span className={`cell-value ${(col.key === 'perihal' || col.key === 'namaPengirim' || col.key === 'letterNumber') ? 'truncate' : ''}`}>
                    {getCellValue(letter, col.key)}
                  </span>
                </div>
              ))}
            </Link>
          ))}
        </div>
      </div>
      <div className="actions pagination-actions" style={{ marginTop: '1rem', gap: '0.75rem' }}>
        <button
          type="button"
          className="ghost-btn"
          onClick={goToPrev}
          disabled={page <= 1}
        >
          <ChevronLeft size={18} />
        </button>
        <span>
{page} / {totalPages} {isFetching && '(memuat...)'}
        </span>
        <button
          type="button"
          className="ghost-btn"
          onClick={goToNext}
          disabled={page >= totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
