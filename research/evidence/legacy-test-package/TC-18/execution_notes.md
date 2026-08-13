### TC-18 Execution Notes
- Menangani URL yang tidak aktif/mati secara preventif via Admin check.
- Status Check: HTTP 404 (Not Found (Mock)), HTTP 410 (Gone (Mock)), HTTP 0 (Request timeout (Mock)), HTTP 500 (Internal Server Error (Mock)), HTTP 404 (Not Found (Mock)), HTTP 410 (Gone (Mock))
- Hasil hitung-median: 400 (Expected: 400/422)
- Database tidak melakukan kalkulasi jika data aktif kurang dari 3.