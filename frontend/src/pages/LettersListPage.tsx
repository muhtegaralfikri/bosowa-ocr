import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import type { Letter } from '../api/types';

export default function LettersListPage() {
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    api.get('/letters').then((res) => setLetters(res.data));
  }, []);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Daftar</p>
          <h1>Surat & Invoice</h1>
        </div>
        <Link to="/letters/new" className="ghost-btn">
          Tambah Surat
        </Link>
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
