# Bosowa OCR - Sistem Manajemen Surat & Invoice Digital

Aplikasi web full-stack untuk digitalisasi dan manajemen arsip surat/invoice dengan teknologi OCR (Optical Character Recognition). Dikembangkan untuk **Bosowa Bandar Agency** dalam rangka modernisasi proses administrasi dokumen.

## Fitur Utama

### 1. OCR Cerdas dengan Parsing Otomatis
- **Ekstraksi Nomor Surat** - Algoritma fuzzy matching dengan Levenshtein distance untuk toleransi kesalahan baca OCR
- **Parsing Tanggal Multi-format** - Mendukung 15+ format tanggal (Indonesia & Inggris)
- **Deteksi Nama Pengirim** - Identifikasi otomatis dari header/signature dengan confidence scoring
- **Ekstraksi Nominal** - Parsing format mata uang Indonesia (Rp) dengan akurasi tinggi
- **Preprocessing Gambar** - Optimasi kontras & ketajaman via FFmpeg sebelum OCR

### 2. Manajemen Dokumen
- Upload file dengan drag-and-drop
- Capture langsung dari kamera (mobile-friendly)
- Manual cropping untuk fokus area kop surat
- Penyimpanan terstruktur berdasarkan tahun/bulan

### 3. Role-Based Access Control (RBAC)
| Role | Akses |
|------|-------|
| **ADMIN** | Full access: statistik, kelola user, audit log, approve/reject hapus |
| **MANAJEMEN** | Upload, lihat daftar surat, tanda tangan digital, ajukan hapus |
| **USER** | Upload, lihat daftar surat, ajukan hapus |

#### Detail Tugas Per Role

##### ADMIN
| Fitur | Akses | Keterangan |
|-------|:-----:|------------|
| Upload & OCR | ✅ | Scan/foto dokumen, proses OCR |
| Lihat daftar surat | ✅ | Melihat semua surat/invoice |
| Input metadata | ✅ | Isi/koreksi hasil OCR |
| Edit surat | ✅ | Perbaiki data yang salah |
| Ajukan hapus | ✅ | Request penghapusan dokumen |
| **Dashboard statistik** | ✅ | Grafik surat per bulan, statistik koreksi |
| **Kelola user** | ✅ | Tambah/edit/hapus user |
| **Approve/reject hapus** | ✅ | Setujui atau tolak permintaan hapus |
| **Lihat audit log** | ✅ | Riwayat semua perubahan data |
| **File cleanup** | ✅ | Bersihkan file orphan |

##### MANAJEMEN
| Fitur | Akses | Keterangan |
|-------|:-----:|------------|
| Upload & OCR | ✅ | Scan/foto dokumen, proses OCR |
| Lihat daftar surat | ✅ | Melihat semua surat/invoice |
| Input metadata | ✅ | Isi/koreksi hasil OCR |
| Edit surat | ✅ | Perbaiki data yang salah |
| Ajukan hapus | ✅ | Request penghapusan (perlu approval admin) |
| **Tanda Tangan Digital** | ✅ | Request dan approve tanda tangan dokumen |
| **Dashboard TTD** | ✅ | Monitoring pending signatures |
| **Manajemen TTD** | ✅ | Upload/gambar tanda tangan |
| Dashboard statistik | ❌ | - |
| Kelola user | ❌ | - |
| Approve/reject hapus | ❌ | - |
| Lihat audit log | ❌ | - |

##### USER
| Fitur | Akses | Keterangan |
|-------|:-----:|------------|
| Upload & OCR | ✅ | Scan/foto dokumen, proses OCR |
| Lihat daftar surat | ✅ | Melihat semua surat/invoice |
| Input metadata | ✅ | Isi/koreksi hasil OCR |
| Edit surat | ✅ | Perbaiki data yang salah |
| Ajukan hapus | ✅ | Request penghapusan (perlu approval admin) |
| Request TTD | ✅ | Ajukan permintaan tanda tangan ke manajemen |
| Dashboard statistik | ❌ | - |
| Kelola user | ❌ | - |
| Approve/reject hapus | ❌ | - |
| Lihat audit log | ❌ | - |
| Tanda Tangan Digital | ❌ | Hanya manajemen yang bisa ttd |

### 4. Tanda Tangan Digital
- **Request Signature** - User bisa minta tanda tangan ke manajemen
- **Digital Signature Pad** - Upload gambar ttd atau gambar langsung
- **Signature Positioning** - Drag & drop posisi tanda tangan di dokumen
- **Multi-signer Support** - Bisa minta tanda tangan ke beberapa manajemen
- **Approval Workflow** - Manajemen approve/reject dengan catatan
- **Embedding System** - Tanda tangan otomatis ditempel di dokumen PDF
- **Notification System** - Notifikasi email/real-time ke signer
- **Audit Trail** - Log lengkap proses tanda tangan (waktu, IP, device)
- **Locked Documents** - Dokumen yang dittd tidak bisa diedit lagi

### 5. Audit Trail & Statistik

### 5. Audit Trail & Statistik
- **Edit Log** - Riwayat lengkap setiap perubahan data dengan field sebelum/sesudah
- **Delete Request Workflow** - Mekanisme approval untuk penghapusan dokumen
- **Dashboard Statistik** - Grafik surat masuk/keluar per bulan, statistik koreksi per user

## Tech Stack

### Backend
| Teknologi | Fungsi |
|-----------|--------|
| NestJS 11 | Framework backend modular |
| TypeORM | ORM untuk MySQL |
| Passport + JWT | Autentikasi stateless |
| Tesseract OCR | Engine pengenalan teks |
| FFmpeg | Preprocessing gambar |
| Class Validator | Validasi DTO |
| Swagger | Dokumentasi API otomatis |

### Frontend
| Teknologi | Fungsi |
|-----------|--------|
| React 19 | UI Library |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| TanStack Query | Server state management & caching |
| React Router 7 | Client-side routing |
| Lucide React | Icon library |
| Sonner | Toast notifications |
| Axios | HTTP client |

### Infrastructure
| Teknologi | Fungsi |
|-----------|--------|
| MySQL | Database relasional |
| PM2 | Process manager production |
| Multer | File upload handling |

## Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Upload  │ │ Letters │ │  Stats  │ │  Users  │           │
│  │  Page   │ │  List   │ │Dashboard│ │ Manage  │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └───────────┴───────────┴───────────┘                 │
│                         │ Axios + React Query               │
└─────────────────────────┼───────────────────────────────────┘
                          │ REST API (JWT Auth)
┌─────────────────────────┼───────────────────────────────────┐
│                    Backend (NestJS)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │ Letters │ │  Files  │ │  OCR    │           │
│  │ Module  │ │ Module  │ │ Module  │ │ Service │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│  ┌────┴───────────┴───────────┴───────────┴────┐           │
│  │              TypeORM + MySQL                 │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼────┐      ┌─────▼─────┐     ┌─────▼─────┐
   │ MySQL   │      │ Tesseract │     │  FFmpeg   │
   │   DB    │      │    OCR    │     │ Preproc   │
   └─────────┘      └───────────┘     └───────────┘
```

## Database Schema

```sql
-- Core Tables
letters              -- Dokumen surat/invoice
users                -- User dengan role (ADMIN/MANAJEMEN/USER)
files                -- Metadata file upload
edit_logs            -- Audit trail perubahan
delete_requests      -- Workflow penghapusan
signature_requests   -- Permintaan tanda tangan
signatures           -- Data tanda tangan user
notifications        -- Notifikasi sistem
```

### Entity: Letter
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| letterNumber | VARCHAR | Nomor surat unik |
| jenisSurat | ENUM | MASUK / KELUAR |
| jenisDokumen | ENUM | SURAT / INVOICE |
| tanggalSurat | VARCHAR | Format YYYY-MM-DD |
| namaPengirim | VARCHAR | Nama pengirim/perusahaan |
| perihal | VARCHAR | Subjek surat |
| totalNominal | FLOAT | Total nilai (untuk invoice) |
| fileUrl | VARCHAR | URL file lampiran |

## Keamanan

- **JWT Authentication** - Token-based stateless auth
- **Password Hashing** - bcrypt dengan salt rounds
- **Role Guards** - Proteksi endpoint berdasarkan role
- **Input Validation** - Class-validator untuk semua DTO
- **Rate Limiting** - Throttler untuk mencegah brute force
- **CORS Configuration** - Whitelist origin yang diizinkan

## Instalasi

### Prerequisites
- Node.js 18+
- MySQL 8+
- Tesseract OCR (`tesseract-ocr` + `tesseract-ocr-ind`)
- FFmpeg

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi database

npm install
npm run build
npm run seed        # Buat user default
npm run start:prod
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit VITE_API_URL

npm install
npm run build
npm run preview
```

### Environment Variables

**Backend (.env)**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bosowa_ocr
JWT_SECRET=your-secure-secret-key
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000
```

## API Endpoints

### Auth & Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | - | Login user |
| GET | /users | Admin | List users |
| POST | /users | Admin | Buat user |

### Letters & OCR
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /letters | JWT | List surat (paginated) |
| POST | /letters | JWT | Buat surat baru |
| GET | /letters/:id | JWT | Detail surat |
| PATCH | /letters/:id | JWT | Update surat |
| POST | /letters/ocr-preview | JWT | OCR preview |
| POST | /files/upload | JWT | Upload file |

### Tanda Tangan Digital
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /signature-requests | JWT | List permintaan ttd |
| POST | /signature-requests | JWT | Buat permintaan ttd |
| GET | /signature-requests/pending | JWT | Pending signatures |
| PUT | /signature-requests/:id/sign | JWT | Sign dokumen |
| PUT | /signature-requests/:id/reject | JWT | Reject permintaan |
| GET | /signatures | JWT | List ttd user |
| POST | /signatures | JWT | Upload ttd |
| DELETE | /signatures/:id | JWT | Hapus ttd |

### Admin & Audit
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /stats/overview | Admin | Dashboard statistik |
| GET | /edit-logs | Admin | Audit log |
| POST | /delete-requests | JWT | Ajukan hapus |
| PATCH | /delete-requests/:id | Admin | Approve/reject |

## OCR Parser Details

### Algoritma Ekstraksi Nomor Surat
1. Fuzzy keyword matching ("Nomor", "No", "Invoice No")
2. Pattern matching untuk format umum:
   - `XXX/YYY/ZZZ/2024`
   - `INV-2024-001`
   - `B-123/ABC/2024`
3. Scoring berdasarkan kompleksitas dan panjang
4. Filter false positive (nomor telepon, tanggal)

### Confidence Scoring
```
Letter Number : 25 points (if found)
Tanggal       : 20 points (if valid date)
Nama Pengirim : 5-25 points (based on source confidence)
Perihal       : 15 points (if found)
Text Quality  : 5-15 points (based on alphanumeric ratio)

Total >= 70 : HIGH confidence
Total >= 40 : MEDIUM confidence
Total < 40  : LOW confidence
```

## Responsive Design

Aplikasi dioptimasi untuk:
- Desktop (sidebar navigation)
- Tablet (collapsed sidebar)
- Mobile (bottom navigation bar)

## Scripts

### Backend
```bash
npm run start:dev   # Development dengan hot reload
npm run build       # Build production
npm run start:prod  # Run production
npm run seed        # Seed database
npm run lint        # ESLint check
npm run test        # Unit tests
```

### Frontend
```bash
npm run dev         # Development server
npm run build       # Build production
npm run preview     # Preview production build
npm run lint        # ESLint check
```

## Status Optimasi

### KEAMANAN

| Item | Status | Keterangan |
|------|--------|------------|
| JWT Token Expiry | ✅ | 12 jam expiry |
| Rate Limit Login | ✅ | 5 req/60 detik |
| File Upload Validation | ✅ | MIME + magic bytes |
| Password Hashing | ✅ | bcrypt |
| Role Guards | ✅ | RBAC |
| Input Validation | ✅ | class-validator |
| Helmet Security Headers | ✅ | XSS, clickjacking |
| CORS Strict Mode | ✅ | Whitelist origins |
| Refresh Token | ✅ | Access 15m + Refresh 7d |
| HTTPS Enforcement | ⬜ | Server config |

### PERFORMA

| Item | Status | Keterangan |
|------|--------|------------|
| Database Indexing | ✅ | 3 composite indexes |
| Frontend Code Splitting | ✅ | Lazy load pages |
| Backend Pagination | ✅ | findAndCount |
| React Query Caching | ✅ | TanStack Query |
| Gzip Compression | ✅ | Response compression |
| Image Compression | ✅ | Sharp resize/compress |
| Database Connection Pool | ✅ | 10 connections |
| OCR Background Job | ⬜ | Bull Queue |
| Redis Caching | ⬜ | Cache layer |

### RELIABILITAS

| Item | Status | Keterangan |
|------|--------|------------|
| Health Check Endpoint | ✅ | /health + DB latency |
| Global Error Handler | ✅ | Axios interceptor |
| Toast Notifications | ✅ | Sonner |
| Graceful Shutdown | ✅ | enableShutdownHooks |
| Structured Logging | ✅ | Winston + file logging |
| Error Monitoring | ⬜ | Sentry |
| Database Backup | ✅ | npm run backup/restore |
| File Cleanup Cron | ✅ | npm run cleanup |

### CODE QUALITY

| Item | Status | Keterangan |
|------|--------|------------|
| TypeScript Strict | ✅ | Strict mode |
| ESLint + Prettier | ✅ | Configured |
| Swagger Docs | ✅ | /docs endpoint |
| Unit Tests OCR Parser | ✅ | spec.ts |
| Unit Tests Signature | ✅ | signature-requests.spec.ts |
| API Versioning | ✅ | /api/v1/ prefix |
| DTO Custom Messages | ✅ | Bahasa Indonesia |
| E2E Tests | ⬜ | Integration tests |
| Code Comments | ⬜ | JSDoc |

### UX IMPROVEMENTS

| Item | Status | Keterangan |
|------|--------|------------|
| Loading States | ✅ | Spinner + skeleton |
| Mobile Responsive | ✅ | Bottom nav |
| Icon Consistency | ✅ | Lucide React |
| Form Modal Styling | ✅ | Clean design |
| Skeleton Loaders | ✅ | Shimmer effect |
| Offline Indicator | ✅ | Banner offline |
| Form Autosave | ✅ | localStorage draft |
| **Signature Drag-Drop** | ✅ | Positioning tanda tangan |
| **Real-time Notifications** | ✅ | Pending signature alerts |
| Keyboard Shortcuts | ⬜ | Power user |
| Dark Mode | ⬜ | Theme toggle |
| PWA Support | ⬜ | Installable app |

### SCALABILITY (Future)

| Item | Status | Keterangan |
|------|--------|------------|
| S3/MinIO Storage | ⬜ | Interface ready |
| Elasticsearch | ⬜ | Full-text search |
| CDN Integration | ⬜ | Static files |
| Horizontal Scaling | ⬜ | Stateless ready |
| Microservices OCR | ⬜ | Separate service |

### Ringkasan Progress

| Kategori | ✅ Selesai | ⬜ Belum |
|----------|-----------|----------|
| Keamanan | 9 | 1 |
| Performa | 7 | 2 |
| Reliabilitas | 7 | 1 |
| Code Quality | 7 | 1 |
| UX | 9 | 1 |
| Scalability | 0 | 5 |
| **Total** | **39** | **11** |

**Progress: 78% selesai**

### Update Terakhir
- ✅ **Tanda Tangan Digital** - Full implementation dengan drag-drop positioning
- ✅ **Role Management Update** - Standardisasi ke ADMIN/MANAJEMEN/USER
- ✅ **Signature API** - Complete endpoints untuk workflow tanda tangan
- ✅ **Notification System** - Real-time alerts untuk pending signatures

---

## Lisensi

Proprietary - Bosowa Bandar Agency

---

**Developed with modern web technologies for efficient document digitization.**
