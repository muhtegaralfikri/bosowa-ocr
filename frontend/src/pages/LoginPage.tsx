import type { FormEvent } from 'react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      const { accessToken, user } = res.data;
      login({ username: user.username, role: user.role, token: accessToken });
      if (user.role === 'ADMIN') {
        navigate('/statistik');
      } else {
        navigate('/unggah');
      }
    } catch {
      setError('Login gagal. Cek username/password.');
    }
  };

  return (
    <div className="page-center login-page">
      <section className="panel login-panel">
        <div className="login-header">
          <div>
            <p className="eyebrow">Bosowa Bandar Agency</p>
            <h1>Masuk</h1>
            <p>Admin ke dashboard, Sekretaris/COSM langsung ke halaman upload.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin / sekretaris / cosm"
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <EyeOff className="toggle-icon" aria-hidden="true" />
                ) : (
                  <Eye className="toggle-icon" aria-hidden="true" />
                )}
              </button>
            </div>
          </label>
          {error && <div className="error-box">{error}</div>}
          <button type="submit" className="primary-btn full-width">
            Login
          </button>
        </form>
      </section>
    </div>
  );
}
