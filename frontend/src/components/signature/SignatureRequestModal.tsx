import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { createSignatureRequest, getManajemenUsers, type SignatureAssignment } from '../../api/signatures';
import type { User } from '../../api/types';

interface SignatureRequestModalProps {
  letterId: string;
  letterNumber: string;
  onClose: () => void;
}

export default function SignatureRequestModal({
  letterId,
  letterNumber,
  onClose,
}: SignatureRequestModalProps) {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<SignatureAssignment[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManajemenUsers()
      .then(setUsers)
      .catch(() => toast.error('Gagal memuat daftar user'))
      .finally(() => setLoading(false));
  }, []);

  const createMutation = useMutation({
    mutationFn: () => createSignatureRequest(letterId, assignments, notes),
    onSuccess: () => {
      toast.success('Permintaan tanda tangan berhasil dikirim');
      queryClient.invalidateQueries({ queryKey: ['signature-requests', letterId] });
      onClose();
    },
    onError: () => toast.error('Gagal mengirim permintaan'),
  });

  const addAssignment = (userId: string) => {
    if (assignments.some((a) => a.assignedTo === userId)) {
      toast.error('User sudah ditambahkan');
      return;
    }
    setAssignments([...assignments, { assignedTo: userId }]);
  };

  const removeAssignment = (userId: string) => {
    setAssignments(assignments.filter((a) => a.assignedTo !== userId));
  };

  const handleSubmit = () => {
    if (assignments.length === 0) {
      toast.error('Pilih minimal satu user untuk tanda tangan');
      return;
    }
    createMutation.mutate();
  };

  const getUserName = (userId: string) => users.find((u) => u.id === userId)?.username || userId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Minta Tanda Tangan</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-subtitle">
            Dokumen: <strong>{letterNumber}</strong>
          </p>

          <div className="form-group">
            <label>Pilih User untuk Tanda Tangan</label>
            {loading ? (
              <p>Memuat...</p>
            ) : (
              <div className="user-select-grid">
                {users.map((user) => {
                  const isSelected = assignments.some((a) => a.assignedTo === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className={`user-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        isSelected ? removeAssignment(user.id) : addAssignment(user.id)
                      }
                    >
                      <UserPlus size={14} />
                      {user.username}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {assignments.length > 0 && (
            <div className="form-group">
              <label>User yang Dipilih ({assignments.length})</label>
              <div className="selected-users">
                {assignments.map((a) => (
                  <div key={a.assignedTo} className="selected-user-item">
                    <span>{getUserName(a.assignedTo)}</span>
                    <button type="button" onClick={() => removeAssignment(a.assignedTo)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Catatan (Opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk penerima..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending || assignments.length === 0}
          >
            {createMutation.isPending ? 'Mengirim...' : 'Kirim Permintaan'}
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }
          .modal-header h2 {
            margin: 0;
            font-size: 1.25rem;
          }
          .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            border-radius: 4px;
          }
          .close-btn:hover {
            background: #f3f4f6;
          }
          .modal-body {
            padding: 1.5rem;
            overflow-y: auto;
          }
          .modal-subtitle {
            color: #666;
            margin: 0 0 1.5rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-group label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
          }
          .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            resize: vertical;
          }
          .user-select-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .user-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
          }
          .user-chip:hover {
            border-color: #3b82f6;
          }
          .user-chip.selected {
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
          }
          .selected-users {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .selected-user-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0.75rem;
            background: #f3f4f6;
            border-radius: 6px;
          }
          .selected-user-item button {
            background: none;
            border: none;
            cursor: pointer;
            color: #ef4444;
            padding: 0.25rem;
          }
          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e5e7eb;
          }
          
          /* Mobile Responsive */
          @media (max-width: 768px) {
            .modal-overlay {
              padding: 0;
              align-items: flex-end;
            }
            .modal {
              width: 100%;
              max-width: 100%;
              border-radius: 12px 12px 0 0;
              max-height: 85vh;
            }
            .modal-header {
              padding: 1rem;
            }
            .modal-header h2 {
              font-size: 1.1rem;
            }
            .modal-body {
              padding: 1rem;
            }
            .user-chip {
              padding: 0.625rem 0.875rem;
            }
            .modal-footer {
              padding: 1rem;
            }
            .modal-footer .btn {
              flex: 1;
              justify-content: center;
              padding: 0.875rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
