import { useRef, useState, useEffect } from 'react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({
  onSave,
  onCancel,
  width = 400,
  height = 200,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="signature-canvas-container">
      <div className="canvas-wrapper" style={{
        background: `repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 20px 20px`,
        borderRadius: '8px',
        display: 'inline-block',
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            border: '2px solid #ccc',
            borderRadius: '8px',
            touchAction: 'none',
            cursor: 'crosshair',
            maxWidth: '100%',
            display: 'block',
          }}
        />
      </div>
      <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.5rem 0' }}>
        Gambar tanda tangan Anda di atas
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button type="button" onClick={clear} className="btn btn-secondary">
          Hapus
        </button>
        <button type="button" onClick={save} disabled={!hasDrawn} className="btn btn-primary">
          Simpan
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Batal
          </button>
        )}
      </div>
    </div>
  );
}
