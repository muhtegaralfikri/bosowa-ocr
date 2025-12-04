import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import api from '../api/client';

interface DeleteRequest {
  id: string;
  letterId: string;
  reason?: string;
  status: string;
}

export default function DeleteRequestsPage() {
  const [letterId, setLetterId] = useState('');
  const [reason, setReason] = useState('');
  const [requests, setRequests] = useState<DeleteRequest[]>([]);

  const load = () => {
    api.get('/delete-requests').then((res) => setRequests(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await api.post(`/letters/${letterId}/delete-requests`, { reason });
    setLetterId('');
    setReason('');
    load();
  };

  const approve = (id: string) => api.patch(`/delete-requests/${id}/approve`).then(load);
  const reject = (id: string) => api.patch(`/delete-requests/${id}/reject`).then(load);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Delete Request</p>
          <h1>Ajukan atau approve</h1>
        </div>
      </div>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Letter ID
          <input
            value={letterId}
            onChange={(e) => setLetterId(e.target.value)}
            placeholder="ID surat"
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
            Submit request
          </button>
        </div>
      </form>
      <div className="table">
        <div className="table-row table-head">
          <span>ID</span>
          <span>Letter</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>
        {requests.map((req) => (
          <div key={req.id} className="table-row">
            <span>{req.id}</span>
            <span>{req.letterId}</span>
            <span>{req.status}</span>
            <span className="actions">
              <button type="button" onClick={() => approve(req.id)}>
                Approve
              </button>
              <button type="button" onClick={() => reject(req.id)}>
                Reject
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
