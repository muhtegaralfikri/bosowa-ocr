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
| **SEKRETARIS** | Upload, lihat daftar surat, ajukan hapus |
| **COSM** | Upload, lihat daftar surat, ajukan hapus |

### 4. Audit Trail & Statistik
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
letters          -- Dokumen surat/invoice
users            -- User dengan role
files            -- Metadata file upload
edit_logs        -- Audit trail perubahan
delete_requests  -- Workflow penghapusan
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

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | - | Login user |
| GET | /letters | JWT | List surat (paginated) |
| POST | /letters | JWT | Buat surat baru |
| GET | /letters/:id | JWT | Detail surat |
| PATCH | /letters/:id | JWT | Update surat |
| POST | /letters/ocr-preview | JWT | OCR preview |
| POST | /files/upload | JWT | Upload file |
| GET | /users | Admin | List users |
| POST | /users | Admin | Buat user |
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

## Lisensi

Proprietary - Bosowa Bandar Agency

---

**Developed with modern web technologies for efficient document digitization.**
