# Test Case TC-11 — Preferensi floating-point clamp ≤ 1.0

* **Expected HTTP**: 200
* **Actual HTTP**: 200
* **Status**: **PASS**

## Assertions
* `safePrefLeq1`: ✅ (true)
* `storedPrefLeq1`: ✅ (true)
* `storedPrefNotNull`: ✅ (true)
* `nilaiLimitLeqHargaRef`: ✅ (true)

## Notes
rawPref=0.999999, safePref=0.999999, stored=0.999999