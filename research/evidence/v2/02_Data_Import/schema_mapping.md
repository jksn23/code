# Skema Pemetaan Impor Dataset JCIS V2

| Data Sumber | Sheet/Kolom | Tabel Tujuan | Kolom Tujuan | Transformasi | Validasi |
|---|---|---|---|---|---|
| Group_AHP_Bukti_Autentik_Terverifikasi.xlsx | Ringkasan / Bobot Group AHP | bobot_ahp | bobot | Decimal parsing | Jumlah = 1.0 ± 1e-9 |
| Group_AHP_Bukti_Autentik_Terverifikasi.xlsx | Ringkasan / CR kelompok | bobot_version | cr, ci | Decimal mapping | CR <= 0.10 |
| Data_Pembanding_45_Aset_Lelang_Validasi_Median.xlsx | Data_Pembanding | data_pembanding | * | Hash canonical, enum mapping | 45 data, 5 per aset, 26 Diterima, 19 Bersyarat |
| Lampiran_Analisis_Revisi_JCIS_Final.xlsx | SAW_TB, SAW_KD, SAW_EL | nilai_aset | nilai | Integer mapping | Skala 1-5 |
