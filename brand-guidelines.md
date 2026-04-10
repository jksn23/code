# Brand Guidelines: Sistem Ujian Online SMP Katolik St. Johanis Laikit

## Nama Merek (Brand Name)
[cite_start]Nama aplikasi yang secara resmi digunakan dalam antarmuka adalah **Sistem Ujian Online SMP Katolik St. Johanis Laikit**[cite: 2, 99]. [cite_start]Aplikasi ini berfokus pada digitalisasi proses evaluasi belajar dan penyajian analisis akademik[cite: 97, 105].

## Penggunaan Logo (Logo Usage)
* [cite_start]**Penempatan Utama:** Logo sekolah atau teks logo aplikasi harus diposisikan secara konsisten di **sudut kiri atas bagian Header** pada setiap halaman aplikasi[cite: 138].
* **Versi Logo:** * Gunakan logo versi **Berwarna Penuh (Full Color)** saat ditempatkan di atas latar belakang terang (seperti warna putih atau abu-abu terang).
    * Gunakan logo versi **Putih Solid (Monokrom)** jika header menggunakan latar belakang dengan warna gelap/Warna Primer.

## Palet Warna (Color Palette)
[cite_start]Karena sistem ini digunakan dalam institusi pendidikan formal tingkat menengah pertama [cite: 12, 171][cite_start], palet warna harus mencerminkan kesan akademis, fokus, bersih, dan meminimalisir kelelahan mata bagi siswa[cite: 128].

* **Warna Primer:** **#1D4ED8 (Royal Blue)**. Aplikasikan sebagai warna dominan untuk **tombol aksi utama (Login, Mulai Ujian, Submit Jawaban)**, **indikator status aktif** pada menu, dan elemen *highlight* penting.
* **Warna Sekunder:** **#3B82F6 (Light Blue)**. [cite_start]Gunakan untuk komponen sekunder seperti tautan teks (*hyperlinks*), *badges*, atau aksen warna pada grafik persentase ketuntasan belajar[cite: 114].
* **Warna Latar Belakang (Background):** **#F3F4F6 (Light Gray)**. [cite_start]Aplikasikan sebagai warna *body/background* dasar pada halaman untuk memberikan kontras yang nyaman saat pengguna menatap layar dalam waktu lama[cite: 128].
* **Warna Permukaan (Surface/Cards):** **#FFFFFF (Pure White)**. [cite_start]Wajib digunakan sebagai latar belakang area fokus seperti **Kontainer Soal Pilihan Ganda**, **Tabel Rekapitulasi Nilai**, dan **Kartu Widget Dasbor Analitik**[cite: 19].
* **Warna Teks Utama (Text):** **#1F2937 (Dark Gray)**. Terapkan pada semua teks (*Heading* dan *Body*) untuk memastikan tingkat keterbacaan yang optimal.
* **Warna Batas (Border/Divider):** **#E5E7EB (Lighter Gray)**. Gunakan sebagai garis pemisah tabel, batas *form input*, dan garis tepi kartu.
* **Warna Destruktif/Peringatan:** **#EF4444 (Red)**. [cite_start]Gunakan khusus untuk indikator **Timer Ujian** saat waktu hampir habis, atau tombol hapus data pada menu pengelola[cite: 15].

## Tipografi (Typography)
[cite_start]Sistem ini memuat teks-teks soal, kunci jawaban, dan laporan analisis[cite: 15], sehingga font yang digunakan harus memiliki tingkat kejelasan (*legibility*) yang sangat tinggi.

* **Font Heading (H1, H2, H3):** Wajib menggunakan **Inter** atau **Roboto** (Sans-serif modern). [cite_start]Terapkan ketebalan **Bold (700)** atau **Semi-Bold (600)** untuk judul halaman, nama mata pelajaran, dan angka metrik utama (seperti Nilai Rata-rata) pada laporan hasil[cite: 19, 114].
* **Font Body (Teks Paragraf, Pertanyaan Soal, Opsi Jawaban):** Gunakan **Inter** atau **Open Sans**. Terapkan ketebalan **Regular (400)** dengan ukuran  minimum **16px** agar siswa, khususnya anak SMP, dapat membaca soal dengan nyaman tanpa menyipitkan mata.

## Elemen UI (UI Elements)
[cite_start]Desain antarmuka harus ramah pengguna dan terstruktur untuk ketiga jenis pengguna (Admin, Guru, Siswa)[cite: 18, 233].

* **Gaya Sudut (Corners):** Aplikasikan sudut membulat atau **rounded corners (border-radius: 8px)** pada semua kartu informasi (*cards*), tombol (*buttons*), dan kolom input (*input fields*) agar UI terasa modern, dinamis, dan tidak kaku.
* **Efek Bayangan (Drop Shadow):** Berikan efek bayangan lembut atau **soft drop shadow (box-shadow: 0 4px 6px rgba(0,0,0,0.1))** secara konsisten pada **Cards (Kontainer Papan Statistik, Kontainer Soal)** dan elemen mengambang seperti **Sticky Header Timer**, guna menciptakan elevasi pemisah dari latar belakang abu-abu.
* **Interaksi Elemen (Hover States):** Semua elemen interaktif (tombol dan tautan) harus memiliki transisi warna yang menggelapkan warna aslinya sebesar **10-15%** saat terjadi efek **hover**.
* [cite_start]**Navigasi Input Soal:** Tata letak pilihan ganda harus menggunakan **Radio Buttons interaktif**, dan lompatan nomor soal harus menggunakan **Grid Tombol Navigasi** dengan bentuk kotak bersudut tumpul[cite: 113].

## Nada Bahasa & Konteks (Tone of Voice and Context)
* [cite_start]**Konteks Penggunaan:** Digunakan secara terpusat untuk keperluan evaluasi akademik, ujian resmi, dan rekapitulasi nilai sekolah[cite: 11, 14].
* **Gaya Komunikasi (Tone):** Teks dalam aplikasi harus bersifat **Profesional, Formal, Jelas, dan Bermanfaat**. Hindari jargon teknis yang membingungkan siswa, maupun bahasa gaul (*slang*).
* **Penerapan pada Interface:**
    * **Untuk Siswa:** Berikan instruksi yang lugas dan memandu. (Contoh *prompt* di UI: *"Waktu Anda mulai berjalan. Silakan pilih salah satu jawaban yang paling tepat."*)
    * [cite_start]**Untuk Guru & Admin:** Gunakan terminologi akademik baku yang sesuai dengan laporan pendidikan di Indonesia[cite: 15, 115]. (Gunakan label seperti: *"Kelola Bank Soal"*, *"Analisis Hasil Ujian"*, *"Nilai Rata-rata Kelas"*, *"Persentase Ketuntasan Belajar"*).