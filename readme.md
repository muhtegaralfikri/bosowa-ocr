# Bosowa OCR - Sistem Manajemen Surat & Invoice Digital

Aplikasi web full-stack untuk digitalisasi dan manajemen arsip surat/invoice dengan teknologi OCR (Optical Character Recognition). Dikembangkan untuk **Bosowa Bandar Agency** dalam rangka modernisasi proses administrasi dokumen.

## Fitur Utama

### 1. OCR Cerdas dengan Multi-Engine Support
- **Tesseract OCR** - Engine utama dengan preprocessing gambar FFmpeg
- **Google Vision AI** - Cloud-based OCR untuk accuracy improvement
- **AI-Powered Extraction** - Groq AI untuk parsing data terstruktur
- **Gemini AI Integration** - Advanced text understanding dan classification
- **Preprocessing Otomatis** - Optimasi kontras, ketajaman, dan konversi PDF ke gambar

### 2. Manajemen Dokumen Komprehensif
- **Multi-format Support** - PDF, JPG, PNG, dan format gambar lainnya
- **Drag & Drop Upload** - Interface intuitif untuk upload batch
- **Camera Integration** - Capture langsung dari kamera device (mobile-friendly)
- **Manual Cropping** - Fokus area kop surat dengan precision tool
- **File Processing** - Konversi PDF ke gambar, kompresi, dan optimasi otomatis

### 3. Role-Based Access Control (RBAC)
| Role | Akses | Unit Bisnis |
|------|-------|-------------|
| **ADMIN** | Full access: statistik, kelola user, audit log, approve/reject hapus | Semua Unit |
| **MANAJEMEN** | Upload, lihat daftar surat, tanda tangan digital, ajukan hapus | Semua Unit |
| **USER** | Upload, lihat daftar surat, ajukan hapus, request signature | Sesuai Unit |

#### Unit Bisnis Support
- **BOSOWA_TAXI** - Taksi dan transportasi
- **OTORENTAL_NUSANTARA** - Rental mobil
- **OTO_GARAGE_INDONESIA** - Bengkel dan service otomotif
- **MALLOMO** - Pengiriman dan logistics
- **LAGALIGO_LOGISTIK** - Jasa pengiriman barang
- **PORT_MANAGEMENT** - Manajemen pelabuhan

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

### 4. Tanda Tangan Digital Lengkap
- **Request Signature** - User bisa minta tanda tangan ke manajemen dengan tag system
- **Digital Signature Pad** - Canvas untuk gambar tanda tangan langsung di browser
- **Signature Upload** - Upload gambar tanda tangan dari file
- **Drag & Drop Positioning** - Posisi presisi tanda tangan di dokumen PDF
- **Multi-signer Workflow** - Support multiple signers dalam satu dokumen
- **Approval System** - Manajemen approve/reject dengan notes
- **PDF Embedding** - Otomatis embed tanda tangan ke dokumen PDF menggunakan pdf-lib
- **Real-time Notifications** - Notifikasi instant untuk pending signatures
- **Audit Trail Complete** - Log detail: waktu, IP, device, signature placement
- **Document Locking** - Dokumen yang ditandatangani tidak bisa di-edit

### 5. Sistem Notifikasi Real-time
- **Push Notifications** - Real-time alerts untuk signature requests
- **Notification Center** - Centralized notification system dengan read/unread status
- **Multi-channel Alerts** - In-app notification bell, email integration ready
- **Notification Types** - Signature request, completed, rejected, document updates

### 6. Audit Trail & Analytics
- **Comprehensive Edit Logs** - Riwayat lengkap perubahan dengan before/after values
- **Delete Request Workflow** - Multi-level approval untuk penghapusan dokumen
- **Advanced Analytics Dashboard** - Grafik komprehensif: surat per bulan, user statistics, unit bisnis performance
- **Performance Metrics** - OCR accuracy rates, processing times, user activity

## Tech Stack

### Backend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| NestJS | 11.0.1 | Framework backend modular dengan dependency injection |
| TypeORM | 0.3.20 | ORM untuk MySQL dengan connection pooling |
| Passport + JWT | 0.7.0+11.0.0 | Autentikasi stateless dengan refresh token |
| Tesseract OCR | 3.05+ | Engine pengenalan teks lokal |
| Google Vision AI | 5.3.4 | Cloud-based OCR untuk accuracy improvement |
| Groq AI SDK | 0.37.0 | AI-powered text extraction dan parsing |
| Gemini AI | 0.24.1 | Advanced text understanding dan classification |
| FFmpeg | 8.0 | Preprocessing gambar dan konversi PDF |
| PDF-lib | 1.17.1 | Manipulasi PDF untuk signature embedding |
| Sharp | 0.34.5 | Image processing dan compression |
| Winston | 3.18.3 | Structured logging dengan file rotation |
| Class Validator | 0.14.1 | Validasi DTO dengan custom messages |
| Swagger | 11.2.3 | Dokumentasi API otomatis |
| Helmet | 8.1.0 | Security headers dan XSS protection |
| Throttler | 6.5.0 | Rate limiting dan DoS protection |

### Frontend
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.2.1 | UI Library dengan concurrent features |
| TypeScript | 5.9.3 | Type safety dan better DX |
| Vite | 7.2.4 | Build tool & dev server dengan HMR |
| TanStack Query | 5.90.11 | Server state management & intelligent caching |
| React Router | 7.1.3 | Client-side routing dengan lazy loading |
| Lucide React | 0.555.0 | Modern icon library |
| Sonner | 2.0.7 | Toast notifications yang smooth |
| Axios | 1.7.9 | HTTP client dengan interceptors |

### Infrastructure
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| MySQL | 8+ | Database relasional dengan indexing |
| PM2 | Latest | Process manager production dengan clustering |
| Multer | 1.4.5-lts.1 | File upload handling dengan validation |
| Node.js | 18+ | Runtime environment |

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
letters              -- Dokumen surat/invoice dengan multi-unit bisnis
users                -- User dengan role dan unit bisnis assignment
files                -- Metadata file upload dengan processing info
edit_logs            -- Audit trail lengkap perubahan
delete_requests      -- Workflow approval penghapusan
signature_requests   -- Permintaan tanda tangan dengan positioning
signatures           -- Data tanda tangan user (gambar/default)
notifications        -- Notifikasi sistem dengan read status
```

### Entity: Letter (Enhanced)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| letterNumber | VARCHAR | Nomor surat unik dengan indexing |
| jenisSurat | ENUM | MASUK / KELUAR |
| jenisDokumen | ENUM | SURAT / INVOICE / INTERNAL_MEMO / PAD |
| unitBisnis | ENUM | BOSOWA_TAXI / OTORENTAL_NUSANTARA / OTO_GARAGE_INDONESIA / MALLOMO / LAGALIGO_LOGISTIK / PORT_MANAGEMENT |
| tanggalSurat | VARCHAR | Format YYYY-MM-DD |
| namaPengirim | VARCHAR | Nama pengirim/perusahaan |
| alamatPengirim | VARCHAR | Alamat lengkap pengirim |
| teleponPengirim | VARCHAR | Nomor telepon pengirim |
| perihal | VARCHAR | Subjek surat |
| totalNominal | FLOAT | Total nilai (untuk invoice) |
| nominalList | JSON | List breakdown nominal |
| fileId | VARCHAR | Foreign key ke files |
| fileUrl | VARCHAR | URL file lampiran |

### Entity: User (Enhanced)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR | Unique username |
| password | VARCHAR | Bcrypt hashed password |
| role | ENUM | ADMIN / MANAJEMEN / USER |
| unitBisnis | ENUM | Assignment ke unit bisnis (nullable untuk ADMIN) |
| refreshToken | VARCHAR | JWT refresh token |
| createdAt | DATETIME | Timestamp pembuatan |

### Entity: Signature
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key ke users |
| imagePath | VARCHAR | Path file gambar tanda tangan |
| isDefault | BOOLEAN | Signature default user |
| createdAt | DATETIME | Timestamp pembuatan |

### Entity: SignatureRequest
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| letterId | UUID | Foreign key ke letters |
| requestedBy | UUID | User yang request (sekretaris/USER) |
| assignedTo | UUID | User yang harus tanda tangan (MANAJEMEN) |
| status | ENUM | PENDING / SIGNED / REJECTED |
| positionX | FLOAT | Posisi X tanda tangan di dokumen |
| positionY | FLOAT | Posisi Y tanda tangan di dokumen |
| positionPage | INT | Halaman untuk tanda tangan |
| signedAt | DATETIME | Timestamp penandatanganan |
| signedImagePath | VARCHAR | Path dokumen yang sudah ditandatangani |
| notes | TEXT | Catatan reject/approval |
| createdAt | DATETIME | Timestamp pembuatan |

### Entity: Notification
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key ke users |
| type | ENUM | SIGNATURE_REQUEST / SIGNATURE_COMPLETED / SIGNATURE_REJECTED |
| title | VARCHAR | Judul notifikasi |
| message | TEXT | Pesan detail |
| referenceId | UUID | ID referensi (letter/signature request) |
| isRead | BOOLEAN | Status baca |
| createdAt | DATETIME | Timestamp pembuatan |

## Keamanan

- **JWT Authentication** - Token-based stateless auth dengan refresh token rotation
- **Password Hashing** - bcrypt dengan salt rounds (12 rounds)
- **Role Guards** - Proteksi endpoint berdasarkan role dan unit bisnis
- **Input Validation** - Class-validator untuk semua DTO dengan custom messages
- **Rate Limiting** - Multi-tier throttling (short: 3/sec, medium: 20/10sec, long: 100/min)
- **CORS Configuration** - Strict whitelist origin dengan preflight caching
- **Security Headers** - Helmet untuk XSS, clickjacking, dan content-type protection
- **File Upload Validation** - MIME type checking, magic bytes verification, size limits
- **SQL Injection Prevention** - TypeORM parameterized queries
- **Audit Logging** - Winston structured logging dengan sensitive data filtering

## Instalasi

### Prerequisites
- Node.js 18+ (dengan npm)
- MySQL 8+ (dengan MySQL Workbench atau CLI)
- Tesseract OCR 3.05+ (`tesseract-ocr` + `tesseract-ocr-ind`)
- FFmpeg 8.0+ (untuk image preprocessing)
- Google Cloud Vision API credentials (optional, untuk enhanced OCR)
- Groq AI API key (optional, untuk AI-powered extraction)
- Gemini AI API key (optional, untuk advanced text understanding)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi database dan API keys

npm install
# Install global dependencies jika belum ada:
npm install -g @nestjs/cli
npm install -g typescript
npm install -g ts-node

# Build dan seeding
npm run build
npm run seed        # Buat user default (ADMIN, MANAJEMEN, USER)

# Jalankan development server
npm run start:dev

# Atau production mode
npm run start:prod
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit VITE_API_URL pointing ke backend

npm install
# Install global dependencies jika belum ada:
npm install -g vite
npm install -g typescript

# Development server dengan hot reload
npm run dev

# Build untuk production
npm run build
npm run preview
```

### Environment Variables

**Backend (.env)**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bosowa_ocr

# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-minimum-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# OCR & AI Services (Optional but Recommended)
GOOGLE_CLOUD_VISION_CREDENTIALS_PATH=./credentials/gcp-vision.json
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Application Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_APP_NAME=Bosowa OCR
VITE_MAX_FILE_SIZE=10485760  # 10MB
```

### Database Setup
```sql
-- Buat database baru
CREATE DATABASE bosowa_ocr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user untuk aplikasi (optional, lebih secure)
CREATE USER 'bosowa_ocr'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON bosowa_ocr.* TO 'bosowa_ocr'@'localhost';
FLUSH PRIVILEGES;
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

#### ✅ **Core System Implementation (100% Complete)**
- **User Management System** - Complete CRUD operations dengan role-based access
- **Authentication & Authorization** - JWT dengan refresh token rotation dan role guards
- **Document Upload Pipeline** - Multi-format support dengan preprocessing otomatis
- **Core Application Layout** - Responsive design dengan navigation dan state management

#### ✅ **Advanced OCR Features (100% Complete)**
- **Multi-Engine OCR** - Tesseract + Google Vision AI + Groq AI + Gemini AI integration
- **AI-Powered Extraction** - Intelligent parsing dengan confidence scoring
- **Preprocessing Pipeline** - FFmpeg + Sharp untuk optimal OCR results
- **PDF Conversion** - Otomatis konversi PDF ke gambar untuk processing

#### ✅ **Digital Signature Workflow (100% Complete)**
- **Signature Management** - Upload, canvas drawing, default selection
- **Request & Approval System** - Complete workflow dengan positioning support
- **PDF Embedding** - Automatic signature embedding dengan pdf-lib
- **Multi-signer Support** - Parallel dan sequential signing workflows

#### ✅ **Notification & Audit System (100% Complete)**
- **Real-time Notifications** - In-app alerts dengan read/unread status
- **Comprehensive Audit Trail** - Detailed logging dengan before/after values
- **Delete Request Workflow** - Multi-level approval system
- **Advanced Analytics** - Performance metrics dan user statistics

#### 🔧 **Technical Enhancements**
- **Database Optimization** - Composite indexes dan query optimization
- **Security Hardening** - Multi-tier rate limiting dan input validation
- **Performance Monitoring** - Winston logging dengan structured output
- **Error Handling** - Global exception handlers dengan user-friendly messages

#### 📊 **Current Project Status**
- **Backend**: 11 modules dengan 45+ endpoints
- **Frontend**: 12 pages dengan 20+ components
- **Database**: 9 entities dengan optimized relationships
- **Test Coverage**: Unit tests untuk critical OCR dan signature flows
- **Documentation**: Complete API docs dengan Swagger UI
- **Production Ready**: PM2 ecosystem configuration deployment-ready

**Last Deployment**: Ready untuk production deployment dengan comprehensive monitoring dan backup systems.

---

## Lisensi

Proprietary - Bosowa Bandar Agency

---

**Developed with modern web technologies for efficient document digitization.**
