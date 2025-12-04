import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '../api/client';

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'SEKRETARIS' | 'COSM';
  createdAt: string;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'SEKRETARIS' });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; role: string }) =>
      api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User berhasil dibuat');
      closeModal();
    },
    onError: () => toast.error('Gagal membuat user'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/users/${id}/password`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Password berhasil diubah');
      closeModal();
    },
    onError: () => toast.error('Gagal mengubah password'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User berhasil dihapus');
    },
    onError: () => toast.error('Gagal menghapus user'),
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'SEKRETARIS' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({ username: user.username, password: '', role: user.role });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'SEKRETARIS' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      if (form.password) {
        updatePasswordMutation.mutate({ id: editingUser.id, password: form.password });
      } else {
        toast.error('Masukkan password baru');
      }
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (user: User) => {
    if (confirm(`Hapus user "${user.username}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Manajemen</p>
          <h1>Kelola User</h1>
        </div>
        <button type="button" className="ghost-btn" onClick={openCreateModal}>
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      <div className="table">
        <div className="table-row table-head">
          <span>Username</span>
          <span>Role</span>
          <span>Tanggal Dibuat</span>
          <span>Aksi</span>
        </div>
        {isLoading && (
          <div className="table-row table-message">
            <span>Memuat...</span>
          </div>
        )}
        {!isLoading && users.length === 0 && (
          <div className="table-row table-message">
            <span>Tidak ada user</span>
          </div>
        )}
        {users.map((user) => (
          <div key={user.id} className="table-row table-body-row">
            <div className="table-cell">
              <span className="cell-label">Username</span>
              <span className="cell-value">{user.username}</span>
            </div>
            <div className="table-cell">
              <span className="cell-label">Role</span>
              <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
            <div className="table-cell">
              <span className="cell-label">Tanggal Dibuat</span>
              <span className="cell-value">
                {new Date(user.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
            <div className="table-cell">
              <span className="cell-label">Aksi</span>
              <div className="action-buttons">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => openEditModal(user)}
                  title="Ubah Password"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => handleDelete(user)}
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Ubah Password' : 'Tambah User'}</h2>
              <button type="button" className="icon-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {!editingUser && (
                <label>
                  Username
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    minLength={3}
                  />
                </label>
              )}
              <label>
                {editingUser ? 'Password Baru' : 'Password'}
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={4}
                />
              </label>
              {!editingUser && (
                <label>
                  Role
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="SEKRETARIS">SEKRETARIS</option>
                    <option value="COSM">COSM</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              )}
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeModal}>
                  Batal
                </button>
                <button type="submit" className="primary-btn">
                  {editingUser ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
