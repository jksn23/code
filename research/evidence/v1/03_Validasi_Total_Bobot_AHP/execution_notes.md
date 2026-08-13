### TC-05 Execution Notes
- Menolak perhitungan SAW jika total bobot kriteria tidak bernilai 1.0.
- Status: 422 (Expected: 400/500)
- Pesan error: {"success":false,"message":"Total bobot harus sama dengan 1.","code":"INVALID_TOTAL_WEIGHT","totalWeight":1.5,"correlationId":"corr-1784052146859-l07dubmxv"}