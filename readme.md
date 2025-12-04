📝 README: Rencana Perbaikan & Optimasi
Dokumen ini berisi daftar tugas (task list) untuk fase perbaikan (refactoring) dan pengerasan (hardening) aplikasi Bosowa OCR. Fokus utama adalah mengubah prototype saat ini menjadi aplikasi yang siap untuk production.

Keamanan & Konfigurasi
[ ] Environment Variables: Pindahkan semua kredensial sensitif ke file .env. Jangan gunakan nilai fallback di kode (seperti 'dev-secret' atau password default).

JWT_SECRET

DB_PASSWORD

ADMIN_DEFAULT_PASSWORD

[ ] Hapus Seeding Otomatis: Modifikasi users.service.ts agar tidak otomatis membuat user default setiap kali restart, atau pindahkan ke script seed terpisah yang dijalankan manual.

⚡ 2. Skalabilitas & Performa
2.1 Backend Pagination
[ ] Update Endpoint: Modifikasi LettersController (GET /letters) dan LettersService untuk menerima parameter query page dan limit.

[ ] Query Database: Gunakan findAndCount di TypeORM untuk mengambil data per halaman, bukan mengambil seluruh data (findAll) yang akan membebani memori server.

2.2 Frontend Pagination & Caching
[ ] Integrasi Pagination: Update LettersListPage.tsx untuk menampilkan navigasi halaman (Next/Prev) berdasarkan respon backend.

[ ] React Query: Ganti penggunaan useEffect + axios manual dengan library TanStack Query (React Query) untuk manajemen cache, loading state, dan refetching data yang lebih efisien.

🧠 3. Logika Bisnis & OCR
3.1 Peningkatan Parsing OCR
[ ] Fuzzy Matching: Ganti logika Regex yang kaku di ocr.parsers.ts dengan algoritma fuzzy matching (misal: Levenshtein distance).

Masalah saat ini: Jika OCR membaca "N0mor" (angka 0) bukan "Nomor", regex gagal.

Solusi: Toleransi kesalahan ketik 1-2 karakter.

[ ] Validasi Tanggal: Tingkatkan ekstraksi tanggal untuk mendukung format variatif (misal: "12-Des-24") menggunakan library parsing tanggal yang lebih kuat (seperti date-fns atau dayjs).

3.2 Manajemen File
[ ] Abstraksi Storage: Refactor FilesService agar logic penyimpanan tidak terikat mati ke diskStorage lokal. Buat interface agar di masa depan bisa mudah diganti ke S3/MinIO/Google Cloud Storage tanpa merombak controller.

🎨 4. User Experience (Frontend)
4.1 Feedback & Validasi
[ ] Toast Notifications: Ganti semua window.alert() di LettersFormPage.tsx dan UploadPage.tsx dengan komponen Toast (seperti react-hot-toast atau sonner) untuk pengalaman pengguna yang lebih profesional.

[ ] Error Handling: Tangani error HTTP (401/403/500) secara global di api/client.ts. Jika token kedaluwarsa, otomatis logout user dan arahkan ke login.

4.2 Type Safety
[ ] Fix Linting: Perbaiki konfigurasi ESLint dan Prettier yang menyebabkan error parsing (seperti di .prettierrc).

[ ] Strict Types: Hapus penggunaan any implisit di beberapa komponen dan definisikan interface TypeScript yang lebih ketat untuk respon API.