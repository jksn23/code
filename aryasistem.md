# System Instructions: Web-Based Online Exam & Analytics System

## Tujuan dan Konsep Utama
[cite_start]Buatlah sebuah aplikasi **Sistem Ujian Online Berbasis Web** yang terintegrasi penuh[cite: 2]. [cite_start]Aplikasi ini bertujuan utama untuk memfasilitasi pelaksanaan **ujian pilihan ganda secara daring**, melakukan **koreksi otomatis**, serta menyajikan **analisis hasil ujian siswa** secara real-time untuk keperluan evaluasi akademik[cite: 14, 15, 113]. [cite_start]Sistem ini harus dibangun menggunakan bahasa pemrograman **PHP** dengan basis data **MySQL**, dan dirancang untuk diakses oleh tiga entitas pengguna utama: **Admin**, **Guru**, dan **Siswa**[cite: 18, 143, 147]. [cite_start]Pastikan seluruh perhitungan analisis diproses menggunakan **Query Agregasi Data**[cite: 149].

## Fungsionalitas dan Alur Pengguna (User Flow)
Bangun sistem dengan pembagian alur kerja yang ketat berdasarkan peran (role) pengguna:
* [cite_start]**Alur Pengguna - Siswa:** Siswa harus dapat melakukan **Login** ke dalam sistem, melihat **Jadwal Ujian Aktif** yang tersedia, dan masuk ke antarmuka pengerjaan soal[cite: 193, 199]. [cite_start]Saat ujian berlangsung, siswa harus mengerjakan **Soal Pilihan Ganda** yang dibatasi oleh **Timer**[cite: 113, 193, 199]. [cite_start]Setelah menekan tombol **Selesai/Submit**, sistem harus melakukan **Koreksi Otomatis** dan langsung menampilkan **Skor Akhir Individu** kepada siswa[cite: 199].
* [cite_start]**Alur Pengguna - Guru:** Guru harus dapat melakukan **Login** dan diarahkan ke **Dasbor Guru**[cite: 199]. [cite_start]Guru memiliki otoritas penuh untuk melakukan **Kelola Bank Soal** (menambah, mengedit, menghapus soal beserta kunci jawaban) dan **Kelola Jadwal Ujian**[cite: 193]. [cite_start]Selain itu, guru harus dapat membuka **Menu Laporan Hasil Ujian** untuk melihat **Analisis Hasil Ujian** yang dihasilkan secara otomatis[cite: 193, 199].
* [cite_start]**Alur Pengguna - Admin:** Admin bertugas mengelola infrastruktur data dengan melakukan **Login** lalu mengakses menu **Kelola Data Pengguna** untuk mendaftarkan akun guru dan siswa, serta **Kelola Data Master Akademik** untuk mengatur data kelas dan mata pelajaran[cite: 193].

## Struktur Navigasi Utama
Terapkan struktur navigasi yang responsif dan intuitif:
* **Top Header:** Harus selalu terlihat di semua halaman setelah otentikasi. [cite_start]Header harus menampilkan **Nama Pengguna**, **Peran Pengguna (Admin/Guru/Siswa)**, dan **Tombol Logout**[cite: 193].
* **Sidebar Navigation Menu:** Gunakan navigasi menu di sebelah kiri (*sidebar*) yang **merender tautan secara dinamis berdasarkan peran pengguna** yang sedang *login*.
    * [cite_start]*Jika Admin:* Tampilkan menu **Data Pengguna** dan **Data Akademik**[cite: 193].
    * [cite_start]*Jika Guru:* Tampilkan menu **Bank Soal**, **Jadwal Ujian**, dan **Laporan Analisis**[cite: 193].
    * [cite_start]*Jika Siswa:* Tampilkan menu **Ujian Aktif** dan **Riwayat Nilai**[cite: 193].

## Detail Komponen per Halaman
Rancang dan bangun halaman-halaman berikut dengan komponen UI yang spesifik:

* **Halaman Login**
    * [cite_start]**Form Input Username** dan **Form Input Password**[cite: 200].
    * [cite_start]**Dropdown Pemilihan Peran** (Admin/Guru/Siswa)[cite: 200].
    * [cite_start]**Tombol Login Utama**[cite: 193].

* **Halaman Dasbor Utama (Siswa)**
    * [cite_start]**Kartu Informasi Ujian (Exam Cards):** Menampilkan daftar ujian yang sedang aktif beserta **Nama Mata Pelajaran** dan **Durasi**[cite: 200].
    * [cite_start]**Tombol "Mulai Ujian"** yang hanya aktif jika waktu saat ini sesuai dengan rentang **Waktu Mulai** dan **Waktu Selesai** ujian[cite: 200].

* **Halaman Pengerjaan Ujian (Siswa)**
    * [cite_start]**Header Status Bar yang bersifat lengket (Sticky):** Harus menampilkan indikator **Timer Ujian** (waktu mundur yang berjalan aktif)[cite: 193, 199].
    * [cite_start]**Kontainer Pertanyaan:** Menampilkan teks soal secara jelas[cite: 200].
    * [cite_start]**Radio Button Interaktif:** Untuk memilih opsi jawaban **Pilihan Ganda** (opsi_a, opsi_b, opsi_c, opsi_d)[cite: 200].
    * **Grid Navigasi Nomor Soal:** Tombol angka untuk melompat antar pertanyaan.
    * [cite_start]**Tombol "Submit Jawaban"** di bagian akhir halaman untuk memicu proses **Koreksi Otomatis**[cite: 199].

* **Halaman Kelola Bank Soal & Jadwal (Guru)**
    * [cite_start]**Tabel Data Bank Soal:** Dilengkapi fungsi CRUD (Create, Read, Update, Delete) untuk soal dan penentuan **Jawaban Benar**[cite: 193, 200].
    * [cite_start]**Form Input Jadwal Ujian:** Form terpadu untuk menentukan **Tanggal**, **Waktu Mulai**, **Waktu Selesai**, dan batas minimum kelulusan (**KKM**)[cite: 200].

* **Halaman Laporan Analisis Hasil Ujian (Guru) - *KOMPONEN KRUSIAL***
    * **Bagian Papan Statistik Deskriptif (Dashboard Widget):** Tampilkan empat (4) kartu ringkasan visual (*summary cards*) yang nilainya diambil dari eksekusi *Query Agregasi* basis data:
        1.  [cite_start]**Kartu Nilai Rata-Rata (AVG)**[cite: 114, 149].
        2.  [cite_start]**Kartu Nilai Tertinggi (MAX)**[cite: 114, 149].
        3.  [cite_start]**Kartu Nilai Terendah (MIN)**[cite: 114, 149].
        4.  [cite_start]**Grafik Persentase Ketuntasan Belajar**[cite: 114].
    * **Tabel Rekapitulasi Nilai:** Menampilkan daftar siswa, **Jumlah Benar**, **Jumlah Salah**, **Nilai Akhir**, dan **Status Kelulusan**[cite: 200].

* **Halaman Manajemen Data (Admin)**
    * **Tabel Manajemen Pengguna:** Fasilitas CRUD untuk tabel Guru dan tabel Siswa[cite: 193, 200].
    * [cite_start]**Tabel Master Akademik:** Fasilitas CRUD untuk mengelola entitas Mata Pelajaran[cite: 193, 200].