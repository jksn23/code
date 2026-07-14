# Test Case TC-14 - Deteksi network offline / backend tidak tersedia

* **Expected**: Frontend memperlihatkan pesan error (503)
* **Actual**: HTTP 503 - ECONNREFUSED
* **HTTP Status**: 503
* **Status**: PASS
* **Notes**: Backend tidak tersedia → frontend menampilkan pesan error graceful
