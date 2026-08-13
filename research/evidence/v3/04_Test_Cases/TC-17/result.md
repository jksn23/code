# Test Case TC-17 — Upload file tidak valid (6 jenis)

* **Expected HTTP**: 400/413/415
* **Actual HTTP**: 400
* **Status**: **PASS**

## Assertions
* `shellRejected`: ✅ (true)
* `exeRejected`: ✅ (true)
* `mimeMismatchRejected`: ✅ (true)
* `dbUnchanged`: ✅ (true)

## Notes
shell script: HTTP 400; exe double extension: HTTP 400; MIME mismatch: HTTP 400; fake PDF content: HTTP 400; oversized 15MB: HTTP 500; path traversal: HTTP 400