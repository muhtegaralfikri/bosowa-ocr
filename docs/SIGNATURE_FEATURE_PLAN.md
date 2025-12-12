# Fitur Tanda Tangan Digital - Planning Document

## Overview
Fitur untuk menambahkan tanda tangan digital pada dokumen yang di-upload. Sekretaris dapat menandai (tag) user yang perlu menandatangani dokumen, dan user yang di-tag akan mendapat notifikasi.

---

## User Flow

### Flow Sekretaris (Upload & Tag)
```
1. Sekretaris upload dokumen
2. Sistem menampilkan preview dokumen
3. Sekretaris memilih user yang perlu tanda tangan
4. Sekretaris menentukan posisi TTD di dokumen (opsional)
5. Sistem mengirim notifikasi ke user yang di-tag
```

### Flow User (Tanda Tangan)
```
1. User login, melihat notifikasi "Ada X dokumen menunggu TTD"
2. User buka halaman "Dokumen Menunggu TTD"
3. User pilih dokumen, lihat preview
4. User tanda tangan (pilih dari yang tersimpan / gambar baru)
5. User submit, dokumen ter-update dengan TTD
```

### Flow Setup Signature
```
1. User buka menu "Pengaturan Tanda Tangan"
2. User bisa:
   - Upload gambar TTD
   - Gambar TTD di canvas
3. Simpan sebagai TTD default
```

---

## Database Schema

### 1. Table: `signatures`
Menyimpan tanda tangan user (gambar/drawing).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK ke users |
| image_path | VARCHAR | Path file gambar TTD |
| is_default | BOOLEAN | TTD default user |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 2. Table: `signature_requests`
Tracking permintaan TTD pada dokumen.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| letter_id | UUID | FK ke letters |
| requested_by | UUID | FK ke users (yang request/sekretaris) |
| assigned_to | UUID | FK ke users (yang harus TTD) |
| status | ENUM | PENDING, SIGNED, REJECTED |
| position_x | FLOAT | Posisi X TTD di dokumen (nullable) |
| position_y | FLOAT | Posisi Y TTD di dokumen (nullable) |
| position_page | INT | Halaman untuk TTD (untuk PDF) |
| signed_at | DATETIME | Waktu ditandatangani |
| signed_image_path | VARCHAR | Path file dokumen yang sudah di-TTD |
| notes | TEXT | Catatan (opsional) |
| created_at | DATETIME | Waktu dibuat |
| updated_at | DATETIME | Waktu diupdate |

### 3. Table: `notifications`
Notifikasi untuk user.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK ke users |
| type | ENUM | SIGNATURE_REQUEST, SIGNATURE_COMPLETED, etc |
| title | VARCHAR | Judul notifikasi |
| message | TEXT | Isi pesan |
| reference_id | UUID | ID referensi (letter_id, dll) |
| is_read | BOOLEAN | Sudah dibaca |
| created_at | DATETIME | Waktu dibuat |

---

## Backend Structure

### New Modules
```
src/modules/
├── signatures/
│   ├── signature.entity.ts
│   ├── signature.controller.ts
│   ├── signature.service.ts
│   ├── signature.module.ts
│   └── dto/
│       ├── create-signature.dto.ts
│       └── update-signature.dto.ts
│
├── signature-requests/
│   ├── signature-request.entity.ts
│   ├── signature-request.controller.ts
│   ├── signature-request.service.ts
│   ├── signature-request.module.ts
│   └── dto/
│       ├── create-signature-request.dto.ts
│       └── update-signature-request.dto.ts
│
└── notifications/
    ├── notification.entity.ts
    ├── notification.controller.ts
    ├── notification.service.ts
    ├── notification.module.ts
    └── dto/
        └── create-notification.dto.ts
```

### API Endpoints

#### Signatures
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/signatures | List TTD user login |
| GET | /api/v1/signatures/:id | Detail TTD |
| POST | /api/v1/signatures/upload | Upload gambar TTD |
| POST | /api/v1/signatures/draw | Simpan TTD dari canvas |
| PUT | /api/v1/signatures/:id/default | Set sebagai default |
| DELETE | /api/v1/signatures/:id | Hapus TTD |

#### Signature Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/signature-requests | List request (filter by status) |
| GET | /api/v1/signature-requests/pending | Dokumen menunggu TTD saya |
| GET | /api/v1/signature-requests/:id | Detail request |
| POST | /api/v1/signature-requests | Buat request TTD (tag user) |
| PUT | /api/v1/signature-requests/:id/sign | Tanda tangani dokumen |
| PUT | /api/v1/signature-requests/:id/reject | Tolak request |

#### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/notifications | List notifikasi user |
| GET | /api/v1/notifications/unread-count | Jumlah belum dibaca |
| PUT | /api/v1/notifications/:id/read | Tandai sudah dibaca |
| PUT | /api/v1/notifications/read-all | Tandai semua dibaca |

---

## Frontend Structure

### New Pages
```
src/pages/
├── SignatureSettingsPage.tsx    # Upload/gambar TTD
├── PendingSignaturesPage.tsx    # List dokumen menunggu TTD
└── SignDocumentPage.tsx         # Preview & tanda tangani
```

### New Components
```
src/components/
├── signature/
│   ├── SignatureCanvas.tsx      # Canvas untuk gambar TTD
│   ├── SignatureUpload.tsx      # Upload gambar TTD
│   ├── SignaturePreview.tsx     # Preview TTD
│   └── SignaturePad.tsx         # Wrapper canvas + tools
│
├── notification/
│   ├── NotificationBell.tsx     # Icon bell + badge count
│   ├── NotificationDropdown.tsx # Dropdown list notifikasi
│   └── NotificationItem.tsx     # Item notifikasi
│
└── signature-request/
    ├── UserTagSelect.tsx        # Select user untuk di-tag
    ├── SignaturePositionPicker.tsx # Pilih posisi TTD di dokumen
    └── PendingSignatureCard.tsx # Card dokumen pending
```

### Modified Pages
- `UploadPage.tsx` - Tambah opsi tag user untuk TTD
- `LetterDetailPage.tsx` - Tampilkan status TTD & tombol sign

---

## Tech Stack & Libraries

### Backend
- **Sharp** (sudah ada) - Image processing untuk TTD
- **PDF-lib** (perlu install) - Manipulasi PDF untuk embed TTD

### Frontend
- **react-signature-canvas** - Canvas untuk gambar TTD
- **react-pdf** - Preview PDF (opsional, jika perlu posisi TTD)

---

## Implementation Phases

### Phase 1: Backend Foundation (Estimasi: 1-2 hari)
- [ ] Buat entity: Signature, SignatureRequest, Notification
- [ ] Buat module & service: signatures, signature-requests, notifications
- [ ] Buat API endpoints dasar
- [ ] Update seed.ts untuk testing

### Phase 2: Signature Management (Estimasi: 1 hari)
- [ ] API upload/save signature
- [ ] Frontend: SignatureSettingsPage
- [ ] Frontend: SignatureCanvas component

### Phase 3: Signature Request Flow (Estimasi: 2 hari)
- [ ] API create/list signature requests
- [ ] Update UploadPage - tambah tag user
- [ ] Frontend: PendingSignaturesPage
- [ ] Frontend: UserTagSelect component

### Phase 4: Sign Document (Estimasi: 2 hari)
- [ ] API sign document (embed TTD ke gambar/PDF)
- [ ] Frontend: SignDocumentPage
- [ ] Image processing - overlay TTD

### Phase 5: Notifications (Estimasi: 1 hari)
- [ ] Notification service & API
- [ ] Frontend: NotificationBell & dropdown
- [ ] Integrate dengan signature request flow

### Phase 6: Polish & Testing (Estimasi: 1 hari)
- [ ] Error handling
- [ ] Loading states
- [ ] Testing end-to-end

---

## Security Considerations

1. **Authorization**
   - Hanya user yang di-assign bisa TTD dokumen tersebut
   - Hanya ADMIN & USER bisa create signature request (tag MANAJEMEN untuk TTD)
   - MANAJEMEN hanya bisa melihat & menandatangani dokumen yang di-assign ke mereka
   - User hanya bisa manage TTD milik sendiri

2. **File Validation**
   - Validate file type untuk upload signature (PNG, JPG)
   - Max file size untuk signature image

3. **Audit Trail**
   - Log semua aktivitas TTD di edit_logs
   - Simpan timestamp signed_at

---

## Decisions Made

1. **Posisi TTD**: User bisa pilih posisi ✅
2. **Multiple Signatures**: Ya, satu dokumen bisa butuh TTD dari beberapa orang ✅
3. **Reject Flow**: TBD (belum diputuskan)
4. **Expiry**: Tidak ada batas waktu ✅
5. **Revoke**: TBD (belum diputuskan)

---

## Notes

- Existing roles: ADMIN, MANAJEMEN, USER
- MANAJEMEN users (yang bisa TTD): Hamza, Firdaus, Idris, Salahuddin, Syamsul, Syamsuddin, Herman
- File storage sudah ada di `uploads/` directory
- Bisa leverage existing file upload infrastructure di `files` module
