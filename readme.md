# Bosowa OCR Letter & Invoice Management System
---

# 📌 1. Overview Proyek

Sistem ini digunakan untuk:

* Upload surat/invoice (via file atau kamera HP)
* Crop kop surat (otomatis atau manual)
* OCR Bahasa Indonesia + Inggris (Tesseract)
* Ekstraksi otomatis:

  * Letter Number (gabungan nomor surat + nomor invoice)
  * Tanggal surat
  * Nama pengirim & kontak
  * Perihal
  * Nominal (list) & total nominal
* Simpan ke database
* Lihat daftar surat
* Lihat detail surat (full image)
* Request delete (Sekretaris/COSM)
* Approve delete (Admin)
* Tracking kesalahan input
* Statistik input error & jumlah surat

Stack Teknologi:

* **Frontend** → React + Vite + TypeScript
* **Backend** → NestJS
* **Database** → MySQL
* **OCR Engine** → Tesseract (eng + ind traineddata)

> ⚠ Tidak menggunakan Docker
> ⚠ Tidak menggunakan PM2
> Semua dijalankan manual di Windows.

---

# 📌 2. Struktur Folder Project

```
project-root/
│── backend/       # NestJS API
│── frontend/      # React UI
│── README.md
```

---

# 📌 3. Instalasi & Setup Lingkungan (Windows)

## 3.1 Install Node.js

Download versi LTS:
[https://nodejs.org/](https://nodejs.org/)

Tes:

```sh
node -v
npm -v
```

---

## 3.2 Install NestJS CLI

```sh
npm install -g @nestjs/cli
```

---

## 3.3 Install React (Vite + TS)

```sh
npm create vite@latest frontend
# Pilih: React → TypeScript
cd frontend
npm install
```

---

## 3.4 Install MySQL

Install MySQL 8.x
Kemudian buat database:

```sql
CREATE DATABASE letterdb;
```

---

## 3.5 Install Tesseract OCR (Wajib)

Download Windows installer:
[https://github.com/UB-Mannheim/tesseract/wiki](https://github.com/UB-Mannheim/tesseract/wiki)

Set path instalasi:

```
C:\Program Files\Tesseract-OCR\
```

Tambahkan ke PATH Windows:

```
C:\Program Files\Tesseract-OCR
```

Test:

```sh
tesseract --version
```

### Install Bahasa Indonesia

Download file:

[https://github.com/tesseract-ocr/tessdata_best/blob/main/ind.traineddata](https://github.com/tesseract-ocr/tessdata_best/blob/main/ind.traineddata)

Copy ke folder:

```
C:\Program Files\Tesseract-OCR\tessdata\
```

Tes:

```sh
tesseract --list-langs
```

Harus muncul:

```
eng
ind
osd
```

---

# 📌 4. Backend – Running Development Server

Masuk backend:

```sh
cd backend
npm install
npm run start:dev
```

Server default:
`http://localhost:3000`

---

# 📌 5. Frontend – Running Development Server

```sh
cd frontend
npm install
npm run dev
```

Default UI:
`http://localhost:5173`

---

# 📌 6. Backend – Struktur Nest Modules

```
src/
 ├── app.module.ts
 ├── main.ts
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── files/
 │    ├── ocr/
 │    ├── letters/
 │    ├── delete-requests/
 │    ├── edit-logs/
 │    └── stats/
 ├── common/
 └── config/
```

---

# 📌 7. OCR Service (Tesseract)

Codex harus membuat file:

```
backend/src/modules/ocr/ocr.service.ts
```

Isi:

```ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execFileAsync = promisify(execFile);

@Injectable()
export class OcrService {
  private readonly tesseractCmd = 'tesseract';

  async recognize(filePath: string): Promise<string> {
    try {
      const outBase = path.join(
        path.dirname(filePath),
        `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}`
      );

      const args = [filePath, outBase, '-l', 'ind+eng', '--psm', '6'];

      await execFileAsync(this.tesseractCmd, args);

      const text = await fs.readFile(`${outBase}.txt`, 'utf8').catch(() => '');
      fs.unlink(`${outBase}.txt`).catch(() => null);

      return text;
    } catch (err) {
      throw new InternalServerErrorException('OCR failed');
    }
  }
}
```

---

# 📌 8. OCR Parsing Rules (Wajib Dibuat oleh Codex)

Codex harus membuat helper:

### 8.1 extractLetterNumber()

* Temukan baris ada kata:

  * `No`, `Nomor`, `Invoice No`
* Buang baris berisi:

  * `Telp`, `HP`, `Phone`
* Nomor HP (08xxxx, +62xxxx) **bukan letter number**
* Letter number biasanya:

  * Contoh: `001/SM/ABC/II/2024`
  * Ada `/` atau `-`
  * Campuran huruf + angka

---

### 8.2 extractTanggal()

Format tanggal yang harus didukung:

```
12/02/2025
12-02-2025
Makassar, 12 Februari 2025
12 Februari 2025
```

---

### 8.3 extractPerihal()

Baris berikut ditangkap:

```
Perihal:
Perihal :
Subject:
Re:
```

---

### 8.4 extractNominalList()

Gunakan regex:

```
/Rp\.?\s*([\d\.,]+)/
```

Total = jumlah semua angka.

---

# 📌 9. Letters API Endpoint

### OCR Preview

```
POST /letters/ocr-preview
{
  fileId: string,
  crop?: { mode: "AUTO" | "MANUAL", x, y, width, height }
}
```

Response:

```
{
  letterNumber: string | null,
  candidates: string[],
  tanggalSurat: string | null,
  namaPengirim: string | null,
  perihal: string | null,
  nominalList: number[],
  totalNominal: number,
  ocrRawText: string
}
```

---

### Create Surat

```
POST /letters
```

### List Surat

```
GET /letters
```

### Detail Surat

```
GET /letters/:id
```

### Update Surat

```
PATCH /letters/:id
```

### Delete Request

```
POST /letters/:id/delete-requests
GET  /delete-requests
PATCH /delete-requests/:id/approve
PATCH /delete-requests/:id/reject
```

---

# 📌 10. File Upload (Frontend → Backend)

Codex harus membuat:

```
POST /files/upload
```

Requirement:

* Accept multipart form
* Save file ke folder: `/uploads/YYYY/MM/UUID.ext`
* Return JSON:

```json
{
  "fileId": "uuid",
  "filePath": "C:/path/to/file.png",
  "urlFull": "http://localhost:3000/uploads/2025/01/file.png"
}
```

---

# 📌 11. Frontend Requirements (React)

Codex harus membuat halaman berikut:

### 11.1 Login Page

Role-based redirect:

* Admin → Dashboard admin
* Sekretaris → Upload OCR page
* COSM → Upload OCR page

---

### 11.2 Upload Page

Fitur:

* Upload file (Dropzone)
* Atau buka kamera (untuk HP)
* Kirim file ke `/files/upload`
* Call `/letters/ocr-preview`
* Tampilkan hasil OCR → autofill form

---

### 11.3 Form Surat

Field:

* letterNumber
* jenisSurat (MASUK / KELUAR)
* jenisDokumen (SURAT / INVOICE)
* tanggalSurat
* namaPengirim
* alamatPengirim
* teleponPengirim
* perihal
* totalNominal

Button:

* Simpan surat

---

### 11.4 List Surat

Kolom:

* Letter Number
* Jenis Surat
* Jenis Dokumen
* Tanggal
* Pengirim
* Perihal

---

### 11.5 Detail Surat

Tampilkan:

* Semua metadata
* Gambar surat full (urlFull)

---

### 11.6 Delete Request Page

Sekretaris/COSM:

* Submit request delete

Admin:

* Approve / Reject

---

### 11.7 Stats Page (Admin)

2 grafik:

* Kesalahan input per user
* Surat masuk/keluar per bulan

---

# 📌 12. Menjalankan Semua Secara Manual (Tanpa Docker / PM2)

## Backend

```sh
cd backend
npm run start:dev
```

## Frontend

```sh
cd frontend
npm run dev
```

Frontend:
`http://localhost:5173`

Backend:
`http://localhost:3000`

---

# 📌 13. Tugas Codex (Automation Instructions)

**Codex harus membangun seluruh aplikasi ini**, termasuk:

### Backend:

* All modules (ocr, files, letters, users, auth, delete-requests, stats)
* TypeORM/Prisma schema
* Controllers, services, DTO
* File upload handling
* OCR execution
* OCR parsing
* CRUD surat
* Delete request workflow
* Stats
* JWT authentication & guards
* Role-based access

### Frontend:

* React pages (Upload, OCR Preview, Form Surat, List, Detail, Delete Requests, Stats)
* Auth pages
* Axios client
* Routing
* UI components
* Camera capture component
* Image preview & crop UI
* Form validation

---

## ✅ Progress Pengerjaan oleh Codex
- ✅ Struktur awal backend (auth, users, files, ocr, letters, delete-requests, edit-logs, stats) beserta wiring modul NestJS
- ✅ OCR service Tesseract, helper parsing (letter number, tanggal, perihal, nominal) dan endpoint `/letters/ocr-preview`
- ✅ Endpoint upload `/files/upload` dengan penyimpanan ke folder `/uploads/YYYY/MM` dan static serving
- ✅ Kerangka CRUD surat + workflow delete request + stub statistik admin
- ✅ Bootstrap frontend React (routing, login, upload + OCR preview, form surat, list, detail, delete request, stats)
- ✅ Integrasi database MySQL (TypeORM repository) dan persistensi data nyata
- ✅ Implementasi penuh crop manual + kamera upload, UI lanjutan, proteksi auth (JWT) produksi, dan swagger docs
