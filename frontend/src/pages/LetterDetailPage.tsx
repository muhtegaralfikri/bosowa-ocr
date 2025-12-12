import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, X, Save, FileSignature, Check, Clock, XCircle, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Letter, SignatureRequest } from '../api/types';
import { getSignatureRequestsByLetter } from '../api/signatures';
import SignatureRequestModal from '../components/signature/SignatureRequestModal';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LetterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Letter>>({});
  const [saving, setSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const { data: signatureRequests = [] } = useQuery({
    queryKey: ['signature-requests', id],
    queryFn: () => getSignatureRequestsByLetter(id!),
    enabled: !!id,
  });

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
              {(user?.role === 'ADMIN' || user?.role === 'USER') && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setShowSignatureModal(true)}
                >
                  <FileSignature size={16} /> Minta TTD
                </button>
              )}
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

      {signatureRequests.length > 0 && (
        <div className="signature-status-section">
          <h3><FileSignature size={18} /> Status Tanda Tangan</h3>
          <div className="signature-list">
            {signatureRequests.map((req: SignatureRequest) => (
              <div key={req.id} className={`signature-item status-${req.status.toLowerCase()}`}>
                <div className="signature-user">
                  {req.status === 'PENDING' && <Clock size={16} className="status-icon pending" />}
                  {req.status === 'SIGNED' && <Check size={16} className="status-icon signed" />}
                  {req.status === 'REJECTED' && <XCircle size={16} className="status-icon rejected" />}
                  <span>{req.assignee?.username || 'Unknown'}</span>
                </div>
                <div className="signature-actions">
                  <span className={`status-badge ${req.status.toLowerCase()}`}>
                    {req.status === 'PENDING' && 'Menunggu'}
                    {req.status === 'SIGNED' && 'Sudah TTD'}
                    {req.status === 'REJECTED' && 'Ditolak'}
                  </span>
                  {req.status === 'SIGNED' && req.signedImagePath && (
                    <>
                      <a
                        href={getImageUrl(req.signedImagePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-signed-btn"
                        title="Lihat dokumen ber-TTD"
                      >
                        <Eye size={14} /> Lihat
                      </a>
                      <a
                        href={getImageUrl(req.signedImagePath)}
                        download
                        className="download-signed-btn"
                        title="Download dokumen ber-TTD"
                      >
                        <Download size={14} />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSignatureModal && (
        <SignatureRequestModal
          letterId={id!}
          letterNumber={letter.letterNumber}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      <style>{`
        .signature-status-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--bg-hover);
          border-radius: 8px;
        }
        .signature-status-section h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 1rem;
          font-size: 1rem;
          color: var(--text-primary);
        }
        .signature-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .signature-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }
        .signature-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-primary);
        }
        .status-icon.pending { color: #f59e0b; }
        .status-icon.signed { color: #22c55e; }
        .status-icon.rejected { color: #ef4444; }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-badge.signed {
          background: #dcfce7;
          color: #166534;
        }
        .status-badge.rejected {
          background: #fee2e2;
          color: #991b1b;
        }
        .signature-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .view-signed-btn,
        .download-signed-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .view-signed-btn {
          background: var(--accent-light);
          color: var(--accent-primary);
        }
        .view-signed-btn:hover {
          background: var(--bg-hover);
        }
        .download-signed-btn {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }
        .download-signed-btn:hover {
          background: var(--border-color);
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .signature-status-section {
            padding: 1rem;
            margin-top: 1.5rem;
          }
          .signature-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 0.75rem;
          }
          .signature-actions {
            width: 100%;
            justify-content: space-between;
          }
          .view-signed-btn,
          .download-signed-btn {
            flex: 1;
            justify-content: center;
            padding: 0.5rem;
          }
        }
      `}</style>
    </section>
  );
}
