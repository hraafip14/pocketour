# Pocketour — Personal Finance App

Aplikasi web manajemen keuangan pribadi bersama yang elegan, cepat, dan responsif. Dibangun dengan **React 19 + Vite 8**, **CSS Modules**, **Supabase PostgreSQL**, dan siap di-deploy langsung ke **Netlify** dari repositori GitHub tanpa pemisahan folder frontend dan backend.

---

## 🌟 Fitur Utama

1. **Gaya Visual & Anti-AI Slop**:
   - Styling terisolasi dengan **CSS Modules** (`[Komponen].module.css`).
   - Mobile-first responsive (nyaman di smartphone, leluasa di desktop).
   - Animasi halus pada modal, sidebar, hover, dan pergantian tema.
   - **Dual Theme** dengan floating button di pojok kanan bawah:
     - **Dark Mode**: warna utama **Dark Plum (`#2E2A38`)** & aksen **Electric Blue (`#00D2FF`)**.
     - **Light Mode**: warna utama **Floral White (`#FFFAF0`)** & aksen **Deep Rose Pink (`#C94472`)**.

2. **Feedback & Keamanan UI/UX**:
   - **Toast Notifications** otomatis di pojok kanan atas untuk status berhasil maupun gagal saat menyimpan, menghapus, mengirim email, atau mengganti password.
   - **Modal Konfirmasi Interaktif** sebelum melakukan Logout dan sebelum menghapus insentif maupun catatan pengeluaran.

3. **Autentikasi & RBAC (Role-Based Access Control)**:
   - 2 akun terdaftar:
     - `hasajalah74@gmail.com` -> **Hasby Muhammad Raafi Prasetyo**
     - `nidaliyana14@gmail.com` -> **Nida Liyana Nurrohmah**
     - Password awal: `LiyaAby14`
   - Halaman **Pilih Profil Keuangan**:
     - User mendapatkan peran **Editor** pada profilnya sendiri (akses penuh: input, ubah, hapus data).
     - User mendapatkan peran **Pelihat** pada profil pasangannya (read-only: semua form dinonaktifkan, tombol aksi disembunyikan).

4. **Halaman Gaji**:
   - Berbentuk card bulanan dimulai dari **November 2026**.
   - Input gaji pokok + daftar insentif/tunjangan dinamis dengan tombol Tambah dan Hapus (modal konfirmasi).
   - Total gaji otomatis dihitung di footer card.
   - **Aturan Periode Otomatis**: Menambahkan card gaji bulan baru secara otomatis saat memasuki tanggal 1 bulan berikutnya.

5. **Halaman Pengeluaran**:
   - Header periode: `Bulan Sekarang - Bulan Selanjutnya` (contoh: `November 2026 - Desember 2026`).
   - 3 Kantong Utama:
     - **Kebutuhan** (default `50%`)
     - **Jajan** (default `30%`)
     - **Investasi** (default `20%`)
   - Persentase masing-masing kantong dapat disesuaikan oleh Editor (validasi total = `100%`) dan otomatis menghitung nominal batas anggaran dari total gaji.
   - Catat transaksi pengeluaran dan hapus pengeluaran dengan modal konfirmasi.

6. **Dashboard & Laporan (Wajib Preview)**:
   - Ringkasan 4 metrik utama: Pemasukan Gaji, Total Pengeluaran, Sisa Gaji Bersih, dan Tingkat Penghematan (%).
   - Visualisasi grafis batang interaktif (Batas Anggaran vs Aktual Terpakai) dengan Recharts.
   - Modal **Pratinjau Laporan Keuangan (Wajib Preview)** sebelum melakukan aksi ekspor.
   - **Export ke Excel (.xlsx)** langsung di browser.
   - **Export ke PDF (.pdf)** langsung di browser.
   - **Kirim Email Laporan** via serverless function ke kedua akun (`hasajalah74@gmail.com` & `nidaliyana14@gmail.com`).

7. **Halaman Pengaturan**:
   - Ubah password akun yang sedang login dengan validasi dan notifikasi toast.

---

## 🛠️ Arsitektur & Struktur Folder

```
pocketour/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml                  # Konfigurasi SPA rewrite & Netlify Functions
├── .env.example                  # Template konfigurasi environment
├── supabase_schema.sql           # Skema lengkap Supabase PostgreSQL & RLS
│
├── netlify/
│   └── functions/
│       └── send-report-email.js  # Serverless function pengiriman email via Resend
│
└── src/
    ├── main.jsx                  # Entry point, providers, styles
    ├── App.jsx                   # Router & Route Guards
    │
    ├── styles/
    │   ├── global.css            # Variabel warna Dark/Light & reset CSS
    │   ├── animations.css        # Keyframe transisi halus
    │   └── theme.js
    │
    ├── contexts/
    │   ├── AuthContext.jsx       # Supabase Auth + akun baku & fallback
    │   ├── ThemeContext.jsx      # Dark / Light theme switch
    │   ├── ProfileContext.jsx    # Profil keuangan aktif & peran Editor/Pelihat
    │   └── ToastContext.jsx      # Antrean notifikasi toast
    │
    ├── hooks/
    │   ├── useSalary.js          # CRUD Gaji & auto-create bulan baru
    │   └── useExpense.js         # CRUD Kantong & Transaksi Pengeluaran
    │
    ├── lib/
    │   ├── supabase.js           # Client Supabase
    │   ├── exportExcel.js        # Generator SheetJS XLSX
    │   ├── exportPdf.js          # Generator jsPDF
    │   └── sendEmail.js          # Pemanggil Netlify Function
    │
    ├── components/
    │   ├── layout/               # Sidebar, TopBar, AppLayout
    │   ├── ui/                   # Button, Input, Card, Toast, ConfirmModal, ThemeToggle
    │   ├── salary/               # SalaryCard, IncentiveRow
    │   ├── expense/              # ExpenseCard, PocketSection, ExpenseRow
    │   └── dashboard/            # SummaryCards, MonthSelector, PocketBreakdown, ReportPreview
    │
    └── pages/
        ├── LoginPage.jsx
        ├── ProfileSelectPage.jsx
        ├── DashboardPage.jsx
        ├── SalaryPage.jsx
        ├── ExpensePage.jsx
        └── SettingsPage.jsx
```

---

## 🚀 Panduan Setup & Menjalankan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment
Salin file `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Isi variabel dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database Supabase
1. Buka [Supabase Dashboard](https://supabase.com).
2. Buat project baru.
3. Masuk ke menu **SQL Editor**, buka file `supabase_schema.sql` di repositori ini, dan jalankan seluruh query SQL untuk membuat tabel:
   - `profiles`
   - `salaries`
   - `incentives`
   - `pockets`
   - `expenses`
   - Serta policy **Row Level Security (RLS)** dan trigger profil otomatis.
4. Buat 2 user di menu **Authentication → Users**:
   - `hasajalah74@gmail.com` (Password: `LiyaAby14`)
   - `nidaliyana14@gmail.com` (Password: `LiyaAby14`)

*(Catatan: Aplikasi ini juga dilengkapi fallback otomatis lokal sehingga langsung dapat diuji coba di browser bahkan sebelum Supabase dikonfigurasi).*

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser pada `http://localhost:5173`.

### 5. Build Produksi & Deploy ke Netlify
```bash
npm run build
```
File hasil kompilasi siap di folder `dist/`. Anda cukup menghubungkan repositori GitHub ini langsung ke Netlify:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`
- Di Netlify Dashboard, tambahkan environment variable:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `RESEND_API_KEY` (untuk pengiriman email laporan)
  - `REPORT_RECIPIENTS` (default: `hasajalah74@gmail.com,nidaliyana14@gmail.com`)
