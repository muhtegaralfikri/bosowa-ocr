import { useCallback, useState } from 'react';

interface Props {
  onFileSelected: (file: File) => void;
  onOpenCamera?: () => void;
}

export default function UploadBox({ onFileSelected, onOpenCamera }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleSelect = useCallback(
    (files: FileList | null) => {
      if (files && files[0]) {
        onFileSelected(files[0]);
      }
    },
    [onFileSelected],
  );

  return (
    <div
      className={`upload-box ${isDragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleSelect(e.dataTransfer.files);
      }}
    >
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={(e) => handleSelect(e.target.files)}
      />
      <p>Tarik file ke sini atau klik untuk pilih</p>
      <small>Bisa dari kamera HP (pilih kamera saat upload)</small>
      {onOpenCamera && (
        <div className="upload-actions">
          <button type="button" className="primary-btn" onClick={onOpenCamera}>
            Buka kamera
          </button>
        </div>
      )}
    </div>
  );
}
