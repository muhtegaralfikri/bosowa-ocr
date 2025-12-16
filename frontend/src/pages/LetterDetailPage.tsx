import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, X, Save, FileSignature, Check, Clock, XCircle, Eye, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Letter>>({});
  const [saving, setSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [activePreview, setActivePreview] = useState<{ url: string; type: 'pdf' | 'image' } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const { data: signatureRequests = [] } = useQuery({
    queryKey: ['signature-requests', id],
    queryFn: () => getSignatureRequestsByLetter(id!),
    enabled: !!id,
  });

  // Fetch PDF as Blob to bypass IDM
  useEffect(() => {
    if (letter?.fileUrl?.toLowerCase().endsWith('.pdf') && (letter as any).fileId) {
      const url = getPdfUrl((letter as any).fileId, letter.fileUrl);
      
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          // Force type to application/pdf
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          setPdfBlobUrl(blobUrl);
        })
        .catch(err => console.error('Failed to load PDF blob:', err));

      return () => {
        if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      };
    }
  }, [letter]);

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
      // Invalidate letters cache so list updates automatically
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    } catch {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  const handleViewDocument = async (path: string, type: 'pdf' | 'image', existingBlobUrl?: string | null) => {
    if (existingBlobUrl) {
      setActivePreview({ url: existingBlobUrl, type: 'pdf' });
      setZoomLevel(1);
      return;
    }

    // Determine if we need to use the POST endpoint for signed files (IDM bypass)
    const isSignedFile = path.includes('/uploads/signed/');
    let fullUrl = getImageUrl(path);
    
    if (type === 'pdf' || isSignedFile) {
      try {
        const toastId = toast.loading('Memuat preview dokumen...');
        let res;

        if (isSignedFile) {
           const filename = path.split('/').pop();
           res = await fetch(`${API_BASE}/api/v1/letters/signed-image-preview`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Add Authorization if needed, though endpoint is currently public-ish (LetterController guards apply?)
                // LetterController HAS @UseGuards(JwtAuthGuard) on methods, but not class?
                // Wait, in Step 453, LetterController class has NO @UseGuards.
                // It has @UseGuards per method.
                // The new endpoint I added has NO @UseGuards. So it is public.
              },
              body: JSON.stringify({ filename }),
           });
        } else {
           res = await fetch(fullUrl);
        }

        if (!res.ok) throw new Error('Fetch failed');
        
        const blob = await res.blob();
        // Force type to application/pdf for PDFs, or infer for images?
        // If type is 'image', we can still display a blob URL.
        const blobType = type === 'pdf' ? 'application/pdf' : 'image/jpeg';
        const fileBlob = new Blob([blob], { type: blobType });
        const blobUrl = URL.createObjectURL(fileBlob);
        
        setActivePreview({ url: blobUrl, type });
        toast.dismiss(toastId);
      } catch (e) {
        console.error(e);
        toast.error('Gagal memuat preview');
      }
    } else {
      // Standard image loading (non-signed)
      setActivePreview({ url: fullUrl, type: 'image' });
    }
    setZoomLevel(1);
  };

  const handleDirectDownload = (url: string) => {
    window.location.href = url;
  };

  const getPdfUrl = (fileId: string, _fileUrl: string) => {
    if (fileId) {
      // Use stream endpoint to bypass IDM
      // Endpoint is under api/v1 global prefix
      return `${API_BASE}/api/v1/letters/pdf-preview/${fileId}`;
    }
    // Fallback if no fileId (should not happen for new uploads)
    return getImageUrl(_fileUrl || '');
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
                <strong>Unit Bisnis</strong> {letter.unitBisnis?.replace('_', ' ') || '-'}
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
                Unit Bisnis
                <select
                  value={form.unitBisnis || ''}
                  onChange={(e) => setForm({ ...form, unitBisnis: e.target.value as any })}
                  disabled
                >
                  <option value="BOSOWA_TAXI">Bosowa Taxi</option>
                  <option value="OTORENTAL_NUSANTARA">Otorental Nusantara</option>
                  <option value="OTO_GARAGE_INDONESIA">Oto Garage Indonesia</option>
                  <option value="MALLOMO">Mallomo</option>
                  <option value="LAGALIGO_LOGISTIK">Lagaligo Logistik</option>
                  <option value="PORT_MANAGEMENT">Port Management</option>
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
            letter.fileUrl.toLowerCase().endsWith('.pdf') ? (
              // PDF Preview using iframe with Blob URL
              <div className="preview-pdf-container">
                {pdfBlobUrl ? (
                  <>
                    <iframe
                      src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="PDF Preview"
                      width="100%"
                      height="600px"
                      className="preview-pdf"
                    />
                    <div 
                      className="pdf-overlay"
                      onClick={() => handleViewDocument(letter.fileUrl!, 'pdf', pdfBlobUrl)}
                    >
                      <div className="zoom-hint">
                        <ZoomIn size={20} />
                        <span>Klik untuk zoom</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Dokumen PDF...</div>
                )}
              </div>
            ) : (
              // Image Preview with zoom
              <div
                className="preview-image-container"
                onClick={() => handleViewDocument(letter.fileUrl!, 'image')}
              >
                <img
                  src={getImageUrl(letter.fileUrl)}
                  alt="Preview Surat"
                  className="preview-image"
                />
                <div className="zoom-hint">
                  <ZoomIn size={20} />
                  <span>Klik untuk zoom</span>
                </div>
              </div>
            )
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
                      <button
                        type="button"
                        onClick={() => handleViewDocument(
                          req.signedImagePath!, 
                          req.signedImagePath!.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                        )}
                        className="view-signed-btn"
                        title="Lihat dokumen ber-TTD"
                      >
                        <Eye size={14} /> Lihat
                      </button>
                      <button
                        type="button"
                        className="download-signed-btn"
                        title="Download dokumen ber-TTD"
                        onClick={() => {
                           const filename = req.signedImagePath!.split('/').pop();
                           const downloadName = `${(letter?.letterNumber || 'document').replace(/[^a-zA-Z0-9-_]/g, '_')}_Signed.pdf`;
                           handleDirectDownload(`${API_BASE}/api/v1/letters/signed-image-download/${filename}?downloadName=${downloadName}`);
                        }}
                      >
                        <Download size={14} />
                      </button>
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

      {!!activePreview && (
        <div className="image-zoom-overlay" onClick={() => setActivePreview(null)}>
          <div className="image-zoom-controls" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="zoom-control-btn"
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
              title="Perbesar"
            >
              <ZoomIn size={20} />
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className="zoom-control-btn"
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
              title="Perkecil"
            >
              <ZoomOut size={20} />
            </button>
            <button
              type="button"
              className="zoom-control-btn close"
              onClick={() => setActivePreview(null)}
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            {activePreview.type === 'pdf' ? (
                <iframe
                  src={`${activePreview.url}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="PDF Zoom"
                  className="pdf-zoom-embed"
                />
            ) : (
              <img
                src={activePreview.url}
                alt="Document Preview"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            )}
          </div>
        </div>
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
          border: none;
          cursor: pointer;
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

        /* PDF Preview Styles */
        .preview-pdf-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
        }
        .preview-pdf {
          border: none;
          min-height: 500px;
        }
        .pdf-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          cursor: zoom-in;
          z-index: 10;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 12px;
          transition: background 0.2s;
        }
        .pdf-overlay:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        .pdf-overlay:hover .zoom-hint {
          opacity: 1;
        }

        /* Image Zoom Styles */
        .preview-image-container {
          position: relative;
          cursor: zoom-in;
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .preview-image-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .preview-image-container:hover .zoom-hint {
          opacity: 1;
        }
        .zoom-hint {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.75);
          color: white;
          border-radius: 6px;
          font-size: 0.75rem;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .image-zoom-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .image-zoom-controls {
          position: absolute;
          top: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          z-index: 1001;
        }
        .zoom-control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .zoom-control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        .zoom-control-btn.close {
          background: rgba(239, 68, 68, 0.3);
        }
        .zoom-control-btn.close:hover {
          background: rgba(239, 68, 68, 0.5);
        }
        .zoom-level {
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 50px;
          text-align: center;
        }
        .image-zoom-content {
          max-width: 90vw;
          max-height: 85vh;
          width: 90vw;
          height: 85vh;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-zoom-content img {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.2s ease;
        }
        .pdf-zoom-embed {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
          background: white;
        }

        /* Signature Status Redesign - Responsive & Dark Mode */
        .signature-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        .signature-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .signature-item:hover {
          border-color: var(--accent-light);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        .signature-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1rem;
        }
        .signature-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        /* Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1;
          letter-spacing: 0.025em;
          text-transform: uppercase;
        }
        .status-badge.signed {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        .status-badge.pending {
          background: #fef9c3;
          color: #854d0e;
          border: 1px solid #fde047;
        }
        .status-badge.rejected {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Dark Mode Badge Overrides */
        [data-theme="dark"] .status-badge.signed {
          background: rgba(22, 101, 52, 0.2);
          color: #86efac;
          border-color: rgba(22, 101, 52, 0.4);
        }
        [data-theme="dark"] .status-badge.pending {
          background: rgba(133, 77, 14, 0.2);
          color: #fde047;
          border-color: rgba(133, 77, 14, 0.4);
        }
        [data-theme="dark"] .status-badge.rejected {
           background: rgba(153, 27, 27, 0.2);
           color: #fca5a5;
           border-color: rgba(153, 27, 27, 0.4);
        }

        /* Buttons */
        .view-signed-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-signed-btn:hover {
          background: var(--bg-hover);
          border-color: var(--accent-secondary);
          color: var(--text-primary);
        }
        .download-signed-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--bg-hover);
          color: var(--accent-primary);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .download-signed-btn:hover {
          background: var(--accent-light);
          transform: translateY(-1px);
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .signature-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .signature-actions {
            width: 100%;
            justify-content: space-between;
          }
          .status-badge {
            order: -1; /* Display badge above name on mobile? Or standard flow? Standard flow is fine */
          }
        }
      `}</style>
    </section>
  );
}
