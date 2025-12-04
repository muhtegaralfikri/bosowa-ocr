import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      const { accessToken, user } = res.data;
      login({ username: user.username, role: user.role, token: accessToken });
      if (user.role === 'ADMIN') {
        navigate('/stats');
      } else {
        navigate('/upload');
      }
    } catch {
      setError('Login gagal. Cek username/password.');
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h1>Masuk</h1>
        <p>Admin ke dashboard, Sekretaris/COSM langsung ke halaman upload.</p>
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="****"
            required
          />
        </label>
        {error && <div className="error-box">{error}</div>}
        <button type="submit" className="primary-btn">
          Login
        </button>
      </form>
    </section>
  );
}
