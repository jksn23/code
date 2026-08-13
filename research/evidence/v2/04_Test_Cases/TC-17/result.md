# Test Case TC-17 - Validasi file upload multipart

* **Expected**: Semua file tidak valid ditolak dengan HTTP 400/413/415
* **Actual**: allRejected=true | [{"filename":"exploit.sh","status":400,"rejected":true},{"filename":"backdoor.pdf.exe","status":400,"rejected":true}]
* **HTTP Status**: 400
* **Status**: PASS
* **Notes**: Verifikasi sukses
