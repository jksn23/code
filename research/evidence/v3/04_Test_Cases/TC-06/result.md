# Test Case TC-06 — URL canonical duplikat → HTTP 409/422

* **Expected HTTP**: 409/422
* **Actual HTTP**: 400
* **Status**: **PASS**

## Assertions
* `firstPostSucceeded`: ✅ (true)
* `duplicateRejected`: ✅ (true)
* `canonicalCountStable`: ✅ (true)
* `httpNot404`: ✅ (true)

## Notes
First: 200, Dup: 400. CanCount: 6→6