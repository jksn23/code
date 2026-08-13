# Test Case TC-16 — Sanitasi XSS — payload tidak dieksekusi

* **Expected HTTP**: 200/400
* **Actual HTTP**: 200
* **Status**: **PASS**

## Assertions
* `allEndpointsResponded`: ✅ (true)
* `noExecutableTagsExecuted`: ✅ (true)
* `httpNot404_all`: ✅ (true)

## Notes
Endpoint yang benar: /api/pembanding/aset/:id/manual