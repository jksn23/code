# Test Case TC-05 — Total bobot AHP != 1.0 → HTTP 422

* **Expected HTTP**: 422
* **Actual HTTP**: 422
* **Status**: **PASS**

## Assertions
* `httpIs422`: ✅ (true)
* `codeIsINVALID_TOTAL_WEIGHT`: ✅ (true)
* `httpNot404`: ✅ (true)

## Notes
Used POST /api/spk/hitung-saw with deliberately invalid total weight