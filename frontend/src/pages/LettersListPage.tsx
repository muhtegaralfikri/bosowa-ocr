import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Letter } from '../api/types';

export default function LettersListPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get('/letters', { params: { letterNumber: search || undefined } })
      .then((res) => setLetters(res.data))
      .catch(() => setLetters([]));
  }, [search]);

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
            onChange={(e) => setSearch(e.target.value)}
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
        {letters.length === 0 && (
          <div className="table-row">
            <span>Tidak ada surat</span>
          </div>
        )}
        {letters.map((letter) => (
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
    </section>
  );
}
