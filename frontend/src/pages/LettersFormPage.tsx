import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/client';

const DRAFT_KEY = 'bosowa-letter-draft';

interface LocationState {
  ocrResult?: {
    letterNumber: string | null;
    tanggalSurat: string | null;
    namaPengirim: string | null;
    alamatPengirim?: string | null;
    teleponPengirim?: string | null;
    senderConfidence?: 'high' | 'medium' | 'low';
    senderSource?: 'header' | 'signature' | 'ai' | null;
    perihal: string | null;
    totalNominal: number;
    extractionMethod?: 'ai' | 'regex';
  };
  uploadMeta?: { fileId: string }; // legacy
  originalMeta?: { fileId: string };
}

const getInitialForm = (state: LocationState) => {
  if (state.ocrResult) {
    return {
      letterNumber: state.ocrResult.letterNumber || '',
      jenisSurat: 'MASUK',
      jenisDokumen: 'SURAT',
      tanggalSurat: state.ocrResult.tanggalSurat || '',
      namaPengirim: state.ocrResult.namaPengirim || '',
      alamatPengirim: state.ocrResult.alamatPengirim || '',
      teleponPengirim: state.ocrResult.teleponPengirim || '',
      perihal: state.ocrResult.perihal || '',
      totalNominal: state.ocrResult.totalNominal || 0,
    };
  }

  const saved = localStorage.getItem(DRAFT_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  return {
    letterNumber: '',
    jenisSurat: 'MASUK',
    jenisDokumen: 'SURAT',
    tanggalSurat: '',
    namaPengirim: '',
    alamatPengirim: '',
    teleponPengirim: '',
    perihal: '',
    totalNominal: 0,
  };
};

export default function LettersFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [form, setForm] = useState(() => getInitialForm(state));
  const senderConfidence = state.ocrResult?.senderConfidence;
  const extractionMethod = state.ocrResult?.extractionMethod;
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(
    () => !state.ocrResult && !!localStorage.getItem(DRAFT_KEY),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }, 500);
    return () => clearTimeout(timeout);
  }, [form]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const disabled = useMemo(
    () => !form.letterNumber || !form.tanggalSurat,
    [form],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrors(null);

    if (!form.letterNumber || !form.tanggalSurat) {
      setErrors('Lengkapi Nomor Surat dan Tanggal Surat sebelum menyimpan.');
      toast.error('Lengkapi Nomor Surat dan Tanggal Surat sebelum menyimpan.');
      return;
    }
    try {
      await api.post('/letters', {
        ...form,
        totalNominal: Number(form.totalNominal),
        fileId: state.originalMeta?.fileId || state.uploadMeta?.fileId,
      });
      setMessage('Surat tersimpan');
      toast.success('Surat tersimpan');
      clearDraft();
      navigate('/letters');
    } catch {
      setMessage('Gagal menyimpan surat');
      toast.error(
        'Gagal menyimpan surat. Pastikan semua field wajib terisi dan backend aktif.',
      );
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Form Surat</p>
          <h1>Input metadata surat</h1>
          {extractionMethod && (
            <p className="small-note">
              Ekstraksi: {extractionMethod === 'ai' ? 'AI (Gemini)' : 'Regex'} 
              {extractionMethod === 'ai' && ' ✓'}
            </p>
          )}
        </div>
        <button type="button" className="ghost-btn" onClick={() => navigate(-1)}>
          Kembali
        </button>
      </div>
      {hasDraft && (
        <div className="draft-notice">
          <span>Draft tersimpan dipulihkan</span>
          <button type="button" onClick={clearDraft}>Hapus draft</button>
        </div>
      )}
      <form className="form-grid two-col" onSubmit={handleSubmit}>
        <label>
          Nomor Surat
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
          {senderConfidence && (
            <span
              className={`confidence-badge ${senderConfidence}`}
              title={`Confidence: ${senderConfidence}`}
            >
              {senderConfidence === 'high' ? '✓ Yakin' : senderConfidence === 'medium' ? '~ Mungkin' : '? Rendah'}
            </span>
          )}
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
