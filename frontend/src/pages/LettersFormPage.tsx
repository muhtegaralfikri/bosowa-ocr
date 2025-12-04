import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';

interface LocationState {
  ocrResult?: {
    letterNumber: string | null;
    tanggalSurat: string | null;
    perihal: string | null;
    totalNominal: number;
  };
  uploadMeta?: { fileId: string }; // legacy
  originalMeta?: { fileId: string };
}

export default function LettersFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [form, setForm] = useState({
    letterNumber: state.ocrResult?.letterNumber || '',
    jenisSurat: 'MASUK',
    jenisDokumen: 'SURAT',
    tanggalSurat: state.ocrResult?.tanggalSurat || '',
    namaPengirim: '',
    alamatPengirim: '',
    teleponPengirim: '',
    perihal: state.ocrResult?.perihal || '',
    totalNominal: state.ocrResult?.totalNominal || 0,
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string | null>(null);

  const disabled = useMemo(
    () => !form.letterNumber || !form.tanggalSurat,
    [form],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrors(null);

    if (!form.letterNumber || !form.tanggalSurat) {
      setErrors('Lengkapi Letter Number dan Tanggal Surat sebelum menyimpan.');
      window.alert('Lengkapi Letter Number dan Tanggal Surat sebelum menyimpan.');
      return;
    }
    try {
      await api.post('/letters', {
        ...form,
        totalNominal: Number(form.totalNominal),
        fileId: state.originalMeta?.fileId || state.uploadMeta?.fileId,
      });
      setMessage('Surat tersimpan');
      navigate('/letters');
    } catch {
      setMessage('Gagal menyimpan surat');
      window.alert('Gagal menyimpan surat. Pastikan semua field wajib terisi dan backend aktif.');
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Form Surat</p>
          <h1>Input metadata surat</h1>
        </div>
        <button type="button" className="ghost-btn" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
      <form className="form-grid two-col" onSubmit={handleSubmit}>
        <label>
          Letter Number
          <input
            value={form.letterNumber}
            onChange={(e) => setForm({ ...form, letterNumber: e.target.value })}
            placeholder="007/SS/IV/2018"
            required
          />
        </label>
        <label>
          Jenis Surat
          <select
            value={form.jenisSurat}
            onChange={(e) => setForm({ ...form, jenisSurat: e.target.value })}
          >
            <option value="MASUK">MASUK</option>
            <option value="KELUAR">KELUAR</option>
          </select>
        </label>
        <label>
          Jenis Dokumen
          <select
            value={form.jenisDokumen}
            onChange={(e) =>
              setForm({ ...form, jenisDokumen: e.target.value })
            }
          >
            <option value="SURAT">SURAT</option>
            <option value="INVOICE">INVOICE</option>
          </select>
        </label>
        <label>
          Tanggal Surat
          <input
            type="date"
            value={form.tanggalSurat}
            onChange={(e) => setForm({ ...form, tanggalSurat: e.target.value })}
            placeholder="2025-02-12"
            required
          />
        </label>
        <label>
          Nama Pengirim
          <input
            value={form.namaPengirim}
            onChange={(e) => setForm({ ...form, namaPengirim: e.target.value })}
            placeholder="PT Contoh Abadi"
          />
        </label>
        <label>
          Alamat Pengirim
          <input
            value={form.alamatPengirim}
            onChange={(e) =>
              setForm({ ...form, alamatPengirim: e.target.value })
            }
            placeholder="Jl. Boulevard No. 123"
          />
        </label>
        <label>
          Telepon Pengirim
          <input
            value={form.teleponPengirim}
            onChange={(e) =>
              setForm({ ...form, teleponPengirim: e.target.value })
            }
            placeholder="0812xxxxxxx"
          />
        </label>
        <label>
          Perihal
          <input
            value={form.perihal}
            onChange={(e) => setForm({ ...form, perihal: e.target.value })}
            placeholder="Penawaran"
            required
          />
        </label>
        <label>
          Total Nominal
          <input
            type="number"
            value={form.totalNominal}
            onChange={(e) =>
              setForm({ ...form, totalNominal: Number(e.target.value) })
            }
            placeholder="0"
          />
        </label>
        <div className="full-row">
          <button type="submit" className="primary-btn" disabled={disabled}>
            Simpan surat
          </button>
          {errors && <div className="error-box">{errors}</div>}
          {message && <p>{message}</p>}
        </div>
      </form>
    </section>
  );
}
