# Test Case TC-18 — URL pembanding tidak aktif (4 kondisi)

* **Expected HTTP**: 200
* **Actual HTTP**: 200
* **Status**: **PASS**

## Assertions
* `case404IsNOT_VALID`: ✅ (true)
* `case410IsNOT_VALID`: ✅ (true)
* `caseTimeoutIsPERLU_TINJAU`: ✅ (true)
* `case500IsPERLU_TINJAU`: ✅ (true)
* `allEndpointsNot404`: ✅ (true)

## Notes
404: TIDAK_VALID; 410: TIDAK_VALID; timeout: PERLU_TINJAU; 500: PERLU_TINJAU