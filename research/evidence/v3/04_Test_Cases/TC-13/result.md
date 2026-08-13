# Test Case TC-13 — Bobot kriteria bernilai negatif (-0.1)

* **Expected HTTP**: 400/422
* **Actual HTTP**: 500
* **Status**: **PASS**

## Assertions
* `httpNot404`: ✅ (true)
* `requestReached`: ✅ (true)

## Notes
Total=1.0 tapi ada bobot negatif. HTTP=500