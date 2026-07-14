/**
 * SCRIPT: Buat template dokumen .docx menggunakan placeholder
 * 
 * Jalankan sekali untuk membuat file template:
 *   node scripts/buat_template_dokumen.js
 * 
 * File yang dibuat:
 * - templates/surat_penetapan.docx
 * - templates/berita_acara.docx  
 * - templates/dokumen_hasil_lelang.docx
 * - templates/surat_permohonan.docx
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templateDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templateDir)) {
  fs.mkdirSync(templateDir, { recursive: true });
}

/**
 * Karena docxtemplater perlu file .docx sebagai template base,
 * kita akan menggunakan file DOCX yang sudah ada atau membuat placeholder.
 * 
 * Script ini mencetak instruksi manual untuk membuat template.
 */

console.log('='.repeat(60));
console.log('PANDUAN PEMBUATAN TEMPLATE DOKUMEN');
console.log('='.repeat(60));
console.log(`
Buat file .docx template di folder: ${templateDir}

File yang dibutuhkan:
1. surat_penetapan.docx       -> Surat Penetapan Lelang
2. berita_acara.docx          -> Berita Acara Hasil Lelang
3. dokumen_hasil_lelang.docx  -> Dokumen Hasil Lelang
4. surat_permohonan.docx      -> Surat Permohonan Lelang

Daftar placeholder yang tersedia (gunakan format {placeholder}):
- {nomor_surat}         -> Nomor surat / invoice lelang
- {tanggal}             -> Tanggal generate dokumen
- {tahun}               -> Tahun saat ini
- {nama_penjual}        -> Nama penjual aset
- {email_penjual}       -> Email penjual aset
- {nama_aset}           -> Nama aset yang dilelang
- {kategori_aset}       -> Kategori aset
- {harga_referensi}     -> Harga referensi/pasar aset
- {nilai_limit}         -> Nilai limit hasil SPK
- {nilai_preferensi}    -> Nilai preferensi SAW
- {waktu_buka}          -> Waktu pembukaan lelang
- {waktu_tutup}         -> Waktu penutupan lelang
- {nama_pemenang}       -> Nama pembeli pemenang lelang
- {email_pemenang}      -> Email pemenang lelang
- {harga_terjual}       -> Harga penawaran tertinggi/terjual
- {nama_admin}          -> Nama admin/pejabat lelang
- {status_pembayaran}   -> Status pembayaran pemenang
- {catatan_pembayaran}  -> Catatan verifikasi pembayaran

Catatan: Setelah membuat template .docx, sistem siap digunakan.
`);

console.log('Folder template:', templateDir);
console.log('Script selesai. Buat file template .docx secara manual di folder di atas.');
