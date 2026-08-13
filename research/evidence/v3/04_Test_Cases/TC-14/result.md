# Test Case TC-14 — Backend tidak tersedia (ECONNREFUSED)

* **Expected HTTP**: 503
* **Actual HTTP**: 503
* **Status**: **PASS**

## Assertions
* `connectionRefused`: ✅ (true)
* `errorPresent`: ✅ (true)

## Notes
Frontend harus menampilkan pesan error graceful