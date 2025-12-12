import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Check, X, Clock, Eye, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPendingSignatures, signDocument, rejectSignatureRequest, getMySignatures } from '../api/signatures';
import type { SignatureRequest, Signature } from '../api/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PendingSignaturesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<SignatureRequest | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<{ x: number; y: number }>({ x: 50, y: 80 });
  const [signatureSize, setSignatureSize] = useState<{ width: number; height: number }>({ width: 150, height: 75 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['pending-signatures'],
    queryFn: getPendingSignatures,
  });

  const { data: mySignatures = [] } = useQuery({
    queryKey: ['my-signatures'],
    queryFn: getMySignatures,
  });

  const defaultSignature = mySignatures.find((s: Signature) => s.isDefault) || mySignatures[0];

  const signMutation = useMutation({
    mutationFn: ({ requestId, positionX, positionY, scale }: { requestId: string; positionX?: number; positionY?: number; scale?: number }) => 
      signDocument(requestId, undefined, positionX, positionY, scale),
    onSuccess: () => {
      toast.success('Dokumen berhasil ditandatangani');
      queryClient.invalidateQueries({ queryKey: ['pending-signatures'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedRequest(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const msg = error.response?.data?.message || 'Gagal menandatangani dokumen';
      toast.error(msg);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: string) => rejectSignatureRequest(requestId),
    onSuccess: () => {
      toast.success('Permintaan tanda tangan ditolak');
      queryClient.invalidateQueries({ queryKey: ['pending-signatures'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Gagal menolak permintaan'),
  });

  const handleOpenSignModal = (req: SignatureRequest) => {
    setSelectedRequest(req);
    setSignaturePosition({ x: 50, y: 80 });
    setSignatureSize({ width: 150, height: 75 });
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  };

  // Mouse/Touch handlers for dragging signature
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
    if (type === 'move') setIsDragging(true);
    else setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging && !isResizing) return;
    if (!containerRef.current || !imageRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    const imgRect = imageRef.current.getBoundingClientRect();

    if (isDragging) {
      const deltaXPercent = (deltaX / imgRect.width) * 100;
      const deltaYPercent = (deltaY / imgRect.height) * 100;
      setSignaturePosition(prev => ({
        x: Math.max(0, Math.min(100, prev.x + deltaXPercent)),
        y: Math.max(0, Math.min(100, prev.y + deltaYPercent)),
      }));
    } else if (isResizing) {
      setSignatureSize(prev => ({
        width: Math.max(50, Math.min(400, prev.width + deltaX)),
        height: Math.max(25, Math.min(200, prev.height + deltaY)),
      }));
    }
    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, isResizing, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleConfirmSign = () => {
    if (!selectedRequest) return;
    const scale = Math.round((signatureSize.width / 150) * 100);
    signMutation.mutate({
      requestId: selectedRequest.id,
      positionX: Math.round(signaturePosition.x),
      positionY: Math.round(signaturePosition.y),
      scale,
    });
  };

  const handleReject = (requestId: string) => {
    const reason = prompt('Alasan penolakan (opsional):');
    if (reason !== null) {
      rejectMutation.mutate(requestId);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="page-container">
      <h1>Dokumen Menunggu Tanda Tangan</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Daftar dokumen yang memerlukan tanda tangan Anda.
      </p>

      {isLoading ? (
        <div className="loader-container">
          <div className="loader-spinner" />
          <p>Memuat...</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} strokeWidth={1.5} />
          <p>Tidak ada dokumen yang menunggu tanda tangan.</p>
        </div>
      ) : (
        <div className="pending-list">
          {pendingRequests.map((req) => (
            <div key={req.id} className="pending-card">
              <div className="pending-info">
                <h3>
                  <FileText size={18} />
                  {req.letter?.letterNumber || 'Dokumen'}
                </h3>
                <p className="pending-meta">
                  <Clock size={14} />
                  Diminta oleh <strong>{req.requester?.username}</strong> pada{' '}
                  {formatDate(req.createdAt)}
                </p>
                {req.letter?.perihal && (
                  <p className="pending-perihal">Perihal: {req.letter.perihal}</p>
                )}
                {req.notes && <p className="pending-notes">Catatan: {req.notes}</p>}
              </div>
              <div className="pending-actions">
                <button
                  className="action-btn action-btn-secondary"
                  onClick={() => navigate(`/letters/${req.letterId}`)}
                >
                  <Eye size={18} />
                  <span>Lihat Detail</span>
                </button>
                <button
                  className="action-btn action-btn-primary"
                  onClick={() => handleOpenSignModal(req)}
                  disabled={signMutation.isPending}
                >
                  <PenTool size={18} />
                  <span>Tanda Tangani</span>
                </button>
                <button
                  className="action-btn action-btn-danger"
                  onClick={() => handleReject(req.id)}
                  disabled={rejectMutation.isPending}
                >
                  <X size={18} />
                  <span>Tolak</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for position selection */}
      {selectedRequest && (
        <div className="sign-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="sign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sign-modal-header">
              <h2>Pilih Posisi Tanda Tangan</h2>
              <button className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>
            <p className="sign-modal-info">
              Klik pada dokumen untuk menentukan posisi tanda tangan Anda.
            </p>
            <div className="sign-modal-content">
              {!defaultSignature ? (
                <div className="no-signature-warning">
                  <p>Anda belum memiliki tanda tangan. Silakan buat tanda tangan terlebih dahulu.</p>
                  <button className="btn btn-primary" onClick={() => navigate('/signature-settings')}>
                    Buat Tanda Tangan
                  </button>
                </div>
              ) : (
                <div className="document-preview" ref={containerRef}>
                  <img
                    ref={imageRef}
                    src={selectedRequest.letter?.fileUrl || ''}
                    alt="Dokumen"
                    draggable={false}
                  />
                  <div
                    className="signature-draggable"
                    style={{
                      left: `${signaturePosition.x}%`,
                      top: `${signaturePosition.y}%`,
                      width: signatureSize.width,
                      height: signatureSize.height,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                    onTouchStart={(e) => handleMouseDown(e, 'move')}
                  >
                    <img 
                      src={getImageUrl(defaultSignature.imagePath)} 
                      alt="TTD" 
                      draggable={false}
                    />
                    <div 
                      className="resize-handle"
                      onMouseDown={(e) => handleMouseDown(e, 'resize')}
                      onTouchStart={(e) => handleMouseDown(e, 'resize')}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="sign-modal-footer">
              <p className="position-info">
                Geser TTD untuk posisi, tarik sudut kanan bawah untuk resize
              </p>
              <div className="sign-modal-actions">
                <button className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                  Batal
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleConfirmSign}
                  disabled={signMutation.isPending || !defaultSignature}
                >
                  <Check size={16} />
                  {signMutation.isPending ? 'Memproses...' : 'Tandatangani'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-secondary);
          gap: 1rem;
        }
        .pending-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pending-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .pending-info h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          color: var(--text-primary);
        }
        .pending-meta {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }
        .pending-perihal,
        .pending-notes {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0.5rem 0 0;
        }
        .pending-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-btn-secondary {
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        .action-btn-secondary:hover:not(:disabled) {
          background: var(--border-color);
        }
        .action-btn-primary {
          background: var(--accent-primary);
          color: white;
        }
        .action-btn-primary:hover:not(:disabled) {
          background: var(--accent-secondary);
        }
        .action-btn-danger {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .action-btn-danger:hover:not(:disabled) {
          background: #fecaca;
        }
        
        /* Modal styles */
        .sign-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .sign-modal {
          background: var(--bg-secondary);
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sign-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .sign-modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary);
        }
        .sign-modal-info {
          padding: 0 1.5rem;
          margin: 1rem 0 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .sign-modal-content {
          flex: 1;
          overflow: auto;
          padding: 1rem 1.5rem;
        }
        .document-preview {
          position: relative;
          display: inline-block;
          border: 2px dashed var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-primary);
        }
        .document-preview img {
          max-width: 100%;
          max-height: 60vh;
          display: block;
        }
        .signature-draggable {
          position: absolute;
          transform: translate(-50%, -50%);
          border: 2px dashed var(--accent-primary);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          user-select: none;
          touch-action: none;
        }
        .signature-draggable img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
        }
        .resize-handle {
          position: absolute;
          right: -6px;
          bottom: -6px;
          width: 12px;
          height: 12px;
          background: var(--accent-primary);
          border-radius: 2px;
          cursor: nwse-resize;
        }
        .resize-handle:hover {
          background: var(--accent-secondary);
        }
        .no-signature-warning {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }
        .no-signature-warning p {
          margin-bottom: 1rem;
        }
        .sign-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .position-info {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        .sign-modal-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .pending-card {
            flex-direction: column;
            padding: 1rem;
          }
          .pending-info {
            width: 100%;
          }
          .pending-info h3 {
            font-size: 1rem;
          }
          .pending-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .action-btn {
            flex: none;
            padding: 0.75rem;
            min-width: 44px;
            min-height: 44px;
          }
          .action-btn span {
            display: none;
          }
          .sign-modal-overlay {
            padding: 0;
          }
          .sign-modal {
            border-radius: 0;
            max-height: 100vh;
            height: 100vh;
          }
          .sign-modal-header {
            padding: 1rem;
          }
          .sign-modal-header h2 {
            font-size: 1.1rem;
          }
          .sign-modal-info {
            padding: 0 1rem;
            font-size: 0.8rem;
          }
          .sign-modal-content {
            padding: 0.75rem 1rem;
          }
          .document-preview img {
            max-height: 50vh;
          }
          .sign-modal-footer {
            padding: 0.75rem 1rem;
            flex-direction: column;
            align-items: stretch;
          }
          .position-info {
            text-align: center;
            font-size: 0.75rem;
          }
          .sign-modal-actions {
            width: 100%;
          }
          .sign-modal-actions .btn {
            flex: 1;
            justify-content: center;
            padding: 0.875rem;
          }
          .signature-draggable {
            min-width: 80px;
            min-height: 40px;
          }
          .resize-handle {
            width: 20px;
            height: 20px;
            right: -10px;
            bottom: -10px;
          }
        }
      `}</style>
    </div>
  );
}
