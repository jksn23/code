# Test Case TC-09 — Harga pembanding negatif dan nol ditolak

* **Expected HTTP**: 400/422
* **Actual HTTP**: 400
* **Status**: **PASS**

## Assertions
* `negativeRejected`: ✅ (true)
* `zeroRejected`: ✅ (true)
* `httpNot404_negative`: ✅ (true)
* `httpNot404_zero`: ✅ (true)
* `dbUnchanged`: ✅ (true)

## Notes
negative: 400, zero: 400