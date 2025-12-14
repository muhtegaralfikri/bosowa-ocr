import { useRef, useState, useEffect } from 'react';
import { Trash2, Save } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export default function SignatureCanvas({
  onSave,
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
    // Only preventDefault for mouse events, not touch events
    if ('touches' in e) {
      // For touch events, don't call preventDefault to avoid passive listener warnings
    } else {
      e.preventDefault();
    }
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
    
    // Only preventDefault for mouse events, not touch events
    if ('touches' in e) {
      // For touch events, don't call preventDefault to avoid passive listener warnings
    } else {
      e.preventDefault();
    }

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
      <p className="canvas-hint">Gambar tanda tangan Anda di area bawah ini</p>
      <div className="canvas-wrapper">
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
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="canvas-actions">
        <button type="button" onClick={clear} className="canvas-btn canvas-btn-secondary">
          <Trash2 size={18} />
          <span>Hapus</span>
        </button>
        <button type="button" onClick={save} disabled={!hasDrawn} className="canvas-btn canvas-btn-primary">
          <Save size={18} />
          <span>Simpan</span>
        </button>
      </div>
      
      <style>{`
        .signature-canvas-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .canvas-hint {
          margin: 0 0 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .canvas-wrapper {
          background: repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 20px 20px;
          border-radius: 12px;
          display: inline-block;
          border: 2px dashed var(--border-color);
          overflow: hidden;
        }
        .canvas-wrapper canvas {
          display: block;
          touch-action: none;
          cursor: crosshair;
          max-width: 100%;
        }
        .canvas-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
          width: 100%;
          max-width: 400px;
        }
        .canvas-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.875rem 1.25rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .canvas-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .canvas-btn-secondary {
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }
        .canvas-btn-secondary:hover:not(:disabled) {
          background: var(--border-color);
        }
        .canvas-btn-primary {
          background: var(--accent-primary);
          color: white;
        }
        .canvas-btn-primary:hover:not(:disabled) {
          background: var(--accent-secondary);
        }
        
        @media (max-width: 768px) {
          .canvas-wrapper {
            width: 100%;
          }
          .canvas-wrapper canvas {
            width: 100%;
            height: auto;
          }
          .canvas-actions {
            max-width: 100%;
          }
          .canvas-btn {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
