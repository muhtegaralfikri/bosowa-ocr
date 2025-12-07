import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/client';
import type { Letter } from '../api/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LetterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Letter>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/letters/${id}`).then((res) => {
        setLetter(res.data);
        setForm(res.data);
      });
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
    setForm({ ...letter });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({ ...letter });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await api.patch(`/letters/${id}`, {
        letterNumber: form.letterNumber,
        jenisSurat: form.jenisSurat,
        jenisDokumen: form.jenisDokumen,
        tanggalSurat: form.tanggalSurat,
        namaPengirim: form.namaPengirim,
        alamatPengirim: form.alamatPengirim,
        teleponPengirim: form.teleponPengirim,
        perihal: form.perihal,
        totalNominal: Number(form.totalNominal) || 0,
      });
      setLetter(res.data);
      setIsEditing(false);
      toast.success('Surat berhasil diperbarui');
    } catch {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

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
        <div className="actions">
          {!isEditing ? (
            <>
              <button type="button" className="ghost-btn" onClick={handleEdit}>
                <Pencil size={16} /> Edit
              </button>
              <button type="button" className="ghost-btn" onClick={() => navigate(-1)}>
                Kembali
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" className="ghost-btn" onClick={handleCancel}>
                <X size={16} /> Batal
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid two-col">
        <div>
          {!isEditing ? (
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
                <strong>Total Nominal</strong> Rp {letter.totalNominal?.toLocaleString('id-ID')}
              </li>
            </ul>
          ) : (
            <form className="form-grid two-col">
              <label>
                Nomor Surat
                <input
                  value={form.letterNumber || ''}
                  onChange={(e) => setForm({ ...form, letterNumber: e.target.value })}
                />
              </label>
              <label>
                Jenis Surat
                <select
                  value={form.jenisSurat || 'MASUK'}
                  onChange={(e) => setForm({ ...form, jenisSurat: e.target.value as 'MASUK' | 'KELUAR' })}
                >
                  <option value="MASUK">MASUK</option>
                  <option value="KELUAR">KELUAR</option>
                </select>
              </label>
              <label>
                Jenis Dokumen
                <select
                  value={form.jenisDokumen || 'SURAT'}
                  onChange={(e) => setForm({ ...form, jenisDokumen: e.target.value as 'SURAT' | 'INVOICE' })}
                >
                  <option value="SURAT">SURAT</option>
                  <option value="INVOICE">INVOICE</option>
                </select>
              </label>
              <label>
                Tanggal Surat
                <input
                  type="date"
                  value={form.tanggalSurat || ''}
                  onChange={(e) => setForm({ ...form, tanggalSurat: e.target.value })}
                />
              </label>
              <label>
                Nama Pengirim
                <input
                  value={form.namaPengirim || ''}
                  onChange={(e) => setForm({ ...form, namaPengirim: e.target.value })}
                />
              </label>
              <label>
                Alamat Pengirim
                <input
                  value={form.alamatPengirim || ''}
                  onChange={(e) => setForm({ ...form, alamatPengirim: e.target.value })}
                />
              </label>
              <label>
                Telepon Pengirim
                <input
                  value={form.teleponPengirim || ''}
                  onChange={(e) => setForm({ ...form, teleponPengirim: e.target.value })}
                />
              </label>
              <label>
                Perihal
                <input
                  value={form.perihal || ''}
                  onChange={(e) => setForm({ ...form, perihal: e.target.value })}
                />
              </label>
              <label>
                Total Nominal
                <input
                  type="number"
                  value={form.totalNominal || 0}
                  onChange={(e) => setForm({ ...form, totalNominal: Number(e.target.value) })}
                />
              </label>
            </form>
          )}
        </div>
        <div>
          {letter.fileUrl ? (
            <img
              src={getImageUrl(letter.fileUrl)}
              alt="Lampiran surat"
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
