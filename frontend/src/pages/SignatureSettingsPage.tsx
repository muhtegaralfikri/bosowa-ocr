import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, Star, Upload, Pencil } from 'lucide-react';
import {
  getMySignatures,
  uploadSignature,
  drawSignature,
  setDefaultSignature,
  deleteSignature,
} from '../api/signatures';
import SignatureCanvas from '../components/signature/SignatureCanvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function SignatureSettingsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isDefaultNew, setIsDefaultNew] = useState(true);

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['my-signatures'],
    queryFn: getMySignatures,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadSignature(file, isDefaultNew),
    onSuccess: () => {
      toast.success('Tanda tangan berhasil diupload');
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
    onError: () => toast.error('Gagal upload tanda tangan'),
  });

  const drawMutation = useMutation({
    mutationFn: (base64: string) => drawSignature(base64, isDefaultNew),
    onSuccess: () => {
      toast.success('Tanda tangan berhasil disimpan');
      setShowCanvas(false);
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
    onError: () => toast.error('Gagal menyimpan tanda tangan'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultSignature,
    onSuccess: () => {
      toast.success('Tanda tangan default berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
    onError: () => toast.error('Gagal mengubah tanda tangan default'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSignature,
    onSuccess: () => {
      toast.success('Tanda tangan berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['my-signatures'] });
    },
    onError: () => toast.error('Gagal menghapus tanda tangan'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 2MB');
        return;
      }
      uploadMutation.mutate(file);
    }
    e.target.value = '';
  };

  const handleSaveDrawing = (dataUrl: string) => {
    drawMutation.mutate(dataUrl);
  };

  return (
    <div className="page-container">
      <h1>Pengaturan Tanda Tangan</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Kelola tanda tangan digital Anda. Anda dapat upload gambar atau menggambar langsung.
      </p>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2>Tambah Tanda Tangan Baru</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={isDefaultNew}
              onChange={(e) => setIsDefaultNew(e.target.checked)}
            />
            Jadikan sebagai tanda tangan default
          </label>
        </div>

        {!showCanvas ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload size={18} />
              Upload Gambar
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCanvas(true)}>
              <Pencil size={18} />
              Gambar di Layar
            </button>
          </div>
        ) : (
          <SignatureCanvas onSave={handleSaveDrawing} onCancel={() => setShowCanvas(false)} />
        )}
      </div>

      <div className="card">
        <h2>Tanda Tangan Tersimpan</h2>

        {isLoading ? (
          <p>Memuat...</p>
        ) : signatures.length === 0 ? (
          <p style={{ color: '#666' }}>Belum ada tanda tangan tersimpan.</p>
        ) : (
          <div className="signature-grid">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className={`signature-card ${sig.isDefault ? 'is-default' : ''}`}
              >
                <img
                  src={`${API_URL}${sig.imagePath}`}
                  alt="Tanda tangan"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '120px',
                    objectFit: 'contain',
                    background: '#fff',
                    borderRadius: '4px',
                  }}
                />
                {sig.isDefault && (
                  <span className="badge badge-success">
                    <Star size={12} /> Default
                  </span>
                )}
                <div className="signature-actions">
                  {!sig.isDefault && (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setDefaultMutation.mutate(sig.id)}
                      title="Jadikan default"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm('Hapus tanda tangan ini?')) {
                        deleteMutation.mutate(sig.id);
                      }
                    }}
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .signature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .signature-card {
          border: 2px solid var(--border-color);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          background: var(--bg-secondary);
        }
        .signature-card.is-default {
          border-color: #22c55e;
          background: var(--bg-hover);
        }
        .signature-card img {
          background: #fff;
        }
        .signature-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-success {
          background: #dcfce7;
          color: #15803d;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .signature-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
          }
          .signature-card {
            padding: 0.75rem;
          }
          .signature-card img {
            max-height: 80px;
          }
          .signature-actions {
            width: 100%;
            justify-content: center;
          }
          .btn {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
