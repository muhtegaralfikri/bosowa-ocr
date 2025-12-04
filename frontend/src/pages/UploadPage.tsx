import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { OcrPreviewResponse } from '../api/types';
import CameraCapture from '../components/CameraCapture';
import ManualCropper from '../components/ManualCropper';
import UploadBox from '../components/UploadBox';

export default function UploadPage() {
  const navigate = useNavigate();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadMeta, setUploadMeta] = useState<{
    fileId: string;
    filePath: string;
    urlFull: string;
  } | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileLabel = useMemo(() => {
    if (!preparedFile) return '';
    const sizeKb = (preparedFile.size / 1024).toFixed(1);
    return `${preparedFile.name} (${sizeKb} KB)`;
  }, [preparedFile]);

  const handleFileSelected = (file: File) => {
    setSourceFile(file);
    setPreparedFile(file);
    setShowCamera(false);
    setOcrResult(null);
    setUploadMeta(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!preparedFile) return;
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', preparedFile);
      const res = await api.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadMeta(res.data);
      const preview = await api.post('/letters/ocr-preview', {
        fileId: res.data.fileId,
      });
      setOcrResult(preview.data);
    } catch {
      setError('Upload atau OCR gagal. Pastikan backend jalan dan login masih aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Upload + OCR</p>
          <h1>Unggah surat/invoice</h1>
          <p>Drop file, ambil dari kamera, lalu crop manual sebelum OCR.</p>
        </div>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => navigate('/letters/new', { state: { ocrResult, uploadMeta } })}
          disabled={!ocrResult}
        >
          Lanjut ke form
        </button>
      </div>

      <div className="grid two-col">
        <div className="card">
          <UploadBox onFileSelected={handleFileSelected} onOpenCamera={() => setShowCamera(true)} />
          {showCamera && (
            <CameraCapture
              onCapture={handleFileSelected}
              onClose={() => setShowCamera(false)}
            />
          )}
          {sourceFile && (
            <div className="card">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Manual crop</p>
                  <h3>Pilih kop surat sebelum OCR</h3>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={handleUpload}
                  disabled={!preparedFile || loading}
                >
                  {loading ? 'Memproses...' : 'Kirim ke OCR'}
                </button>
              </div>
              <ManualCropper
                file={sourceFile}
                onCropConfirm={setPreparedFile}
                onResetToOriginal={() => setPreparedFile(sourceFile)}
              />
              <p className="small-note">File aktif: {fileLabel || '-'}</p>
            </div>
          )}
        </div>

        <div className="card">
          {loading && <p>Sedang proses OCR...</p>}
          {error && <div className="error-box">{error}</div>}

          {uploadMeta && (
            <div className="grid">
              <div>
                <h3>File</h3>
                <p>ID: {uploadMeta.fileId}</p>
                <p>Path: {uploadMeta.filePath}</p>
                <a href={uploadMeta.urlFull} target="_blank" rel="noreferrer">
                  Lihat gambar
                </a>
              </div>
              <div>
                <h3>Hasil OCR</h3>
                <pre className="code-box">
                  {ocrResult ? JSON.stringify(ocrResult, null, 2) : 'Belum ada hasil'}
                </pre>
              </div>
            </div>
          )}

          {!uploadMeta && (
            <div className="card">
              <p>Belum ada upload. Pilih file atau kamera, lalu klik "Kirim ke OCR".</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
