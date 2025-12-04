import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { Letter } from '../api/types';

export default function LetterDetailPage() {
  const { id } = useParams();
  const [letter, setLetter] = useState<Letter | null>(null);

  useEffect(() => {
    if (id) {
      api.get(`/letters/${id}`).then((res) => setLetter(res.data));
    }
  }, [id]);

  if (!letter) {
    return (
      <section className="panel">
        <p>Memuat detail...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Detail Surat</p>
          <h1>{letter.letterNumber}</h1>
        </div>
      </div>
      <div className="grid two-col">
        <div>
          <ul className="meta">
            <li>
              <strong>Jenis Surat</strong> {letter.jenisSurat}
            </li>
            <li>
              <strong>Jenis Dokumen</strong> {letter.jenisDokumen}
            </li>
            <li>
              <strong>Tanggal</strong> {letter.tanggalSurat}
            </li>
            <li>
              <strong>Pengirim</strong> {letter.namaPengirim || '-'}
            </li>
            <li>
              <strong>Alamat</strong> {letter.alamatPengirim || '-'}
            </li>
            <li>
              <strong>Telepon</strong> {letter.teleponPengirim || '-'}
            </li>
            <li>
              <strong>Perihal</strong> {letter.perihal || '-'}
            </li>
            <li>
              <strong>Total Nominal</strong> Rp {letter.totalNominal}
            </li>
          </ul>
        </div>
        <div>
          {letter.fileUrl ? (
            <img
              src={letter.fileUrl}
              alt="Letter"
              className="preview-image"
            />
          ) : (
            <p>Tidak ada lampiran</p>
          )}
        </div>
      </div>
    </section>
  );
}
