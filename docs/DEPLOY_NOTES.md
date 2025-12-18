# Deploy Notes (Bosowa OCR)

## Ringkasan Perubahan Penting
- OCR preview sekarang berjalan via **Redis queue** (BullMQ) supaya API tetap responsif.
- Endpoint OCR:
  - `POST /api/v1/letters/ocr-preview` → response `{ jobId }`
  - `GET /api/v1/letters/ocr-preview/:jobId` → status/result

## Menjalankan Redis via Podman (Windows)
```powershell
podman pull docker.io/library/redis:7-alpine
podman run -d --name bosowa-redis -p 6379:6379 --restart=always `
  redis:7-alpine redis-server --save "" --appendonly no `
  --maxmemory 256mb --maxmemory-policy noeviction
podman exec -it bosowa-redis redis-cli ping
```

Catatan:
- Untuk queue BullMQ, `maxmemory-policy` harus `noeviction` (jangan `allkeys-lru`).

## Backend Config (`backend/.env`)
Minimal:
```env
REDIS_URL=redis://127.0.0.1:6379
OCR_WORKER_ENABLED=true
OCR_WORKER_CONCURRENCY=1
OCR_JOB_TIMEOUT_MS=120000
PDF_OCR_MAX_PAGES=25
PDF_OCR_PAGE_CONCURRENCY=2
OCR_RAW_TEXT_MAX_CHARS=20000
OCR_PREVIEW_CACHE_TTL_SECONDS=600
```

## Menjalankan Backend (lokal)
```powershell
cd D:\github_project\bosowa-ocr\backend
npm install
npm run start:dev
```

Jika port 3000 bentrok:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Menjalankan Frontend (lokal)
```powershell
cd D:\github_project\bosowa-ocr\frontend
npm install
npm run dev
```

Pastikan `frontend/.env` menunjuk ke backend:
```env
VITE_API_URL=http://localhost:3000
```

## Verifikasi Fitur OCR Queue
1. Login.
2. Upload dokumen → klik **Analisis Dokumen**.
3. UI akan polling status job sampai `completed`.
