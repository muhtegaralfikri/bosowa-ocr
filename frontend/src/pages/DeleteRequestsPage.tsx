import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

interface DeleteRequest {
  id: string;
  letterId: string;
  letter?: { letterNumber: string };
  reason?: string;
  status: string;
  createdAt?: string;
}

export default function DeleteRequestsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [letterNumber, setLetterNumber] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const canModerate = user?.role === 'ADMIN';
  const actionHeader = canModerate ? 'Aksi' : 'Keterangan';

  const load = () => {
    api.get('/delete-requests').then((res) => setRequests(res.data));
  };

  const getErrorMessage = (error: unknown) => {
    const axiosError = error as AxiosError<{ message?: string } | string[]>;
    const data = axiosError.response?.data;
    if (Array.isArray(data)) return data.join(', ');
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return 'Terjadi kesalahan';
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/delete-requests', {
        letterNumber: letterNumber.trim(),
        reason,
      });
      toast.success('Request penghapusan dikirim');
      setLetterNumber('');
      setReason('');
      load();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Gagal mengirim request');
    }
  };

  const approve = (id: string) =>
    api
      .patch(`/delete-requests/${id}`, { status: 'APPROVED' })
      .then(() => {
        toast.success('Request disetujui, surat dihapus');
        queryClient.invalidateQueries({ queryKey: ['letters'] });
        load();
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err) || 'Gagal menyetujui');
      });
  const reject = (id: string) =>
    api
      .patch(`/delete-requests/${id}`, { status: 'REJECTED' })
      .then(() => {
        toast.success('Request ditolak');
        load();
      })
      .catch((err: unknown) => {
        toast.error(getErrorMessage(err) || 'Gagal menolak');
      });

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Permintaan Hapus</p>
          <h1>Ajukan atau setujui penolakan</h1>
        </div>
      </div>

      {/* Form Area */}
      <form className="form-grid" onSubmit={submit}>
        <label>
          Nomor Surat / Invoice
          <input
            value={letterNumber}
            onChange={(e) => setLetterNumber(e.target.value)}
            placeholder="Contoh: 007/SS/MIW2018"
            required
          />
        </label>
        <label>
          Alasan
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Opsional"
          />
        </label>
        <div className="full-row">
          <button type="submit" className="primary-btn block-btn">
            Kirim permintaan
          </button>
        </div>
      </form>

      {/* Visual Separator & Table Area */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
          Riwayat Pengajuan
        </h3>
        
        <div className="table-container">
          <div className="table cols-5">
            <div
              className="table-row table-head"
              style={{ gridTemplateColumns: '1.2fr 2fr 2fr 1.2fr 1.6fr' }}
            >
              <span>ID</span>
              <span>Nomor Surat</span>
              <span>Alasan</span>
              <span>Status</span>
              <span>{actionHeader}</span>
            </div>
            {requests.length === 0 && (
              <div className="table-row" style={{ gridTemplateColumns: '1fr' }}>
                <span style={{ textAlign: 'center', color: '#888' }}>Belum ada request</span>
              </div>
            )}
            {requests.map((req) => (
              <div
                key={req.id}
                className="table-row"
                style={{ gridTemplateColumns: '1.2fr 2fr 2fr 1.2fr 1.6fr' }}
              >
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                  title={req.id}
                >
                  {req.id.slice(0, 8)}...
                </span>
                <span>{req.letter?.letterNumber || req.letterId}</span>
                <span className="cell-muted">{req.reason || '-'}</span>
                <span>
                  <span className={`pill pill-${req.status.toLowerCase()}`}>{req.status}</span>
                </span>
                {canModerate ? (
                  <span className="actions table-actions">
                    <button
                      type="button"
                      className="icon-btn success"
                      onClick={() => approve(req.id)}
                      disabled={req.status !== 'PENDING'}
                      title="Setujui"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => reject(req.id)}
                      disabled={req.status !== 'PENDING'}
                      title="Tolak"
                    >
                      <X size={16} />
                    </button>
                  </span>
                ) : (
                  <span className="cell-muted">
                    {req.status === 'PENDING' && 'Menunggu konfirmasi admin'}
                    {req.status === 'APPROVED' && 'Sudah disetujui admin'}
                    {req.status === 'REJECTED' && 'Ditolak admin'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
