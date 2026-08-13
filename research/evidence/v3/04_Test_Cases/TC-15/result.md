# Test Case TC-15 — Rollback transaksi database (fault injection)

* **Expected HTTP**: 500
* **Actual HTTP**: 500
* **Status**: **PASS**

## Assertions
* `dbCountUnchanged`: ✅ (true)
* `dbHashUnchanged`: ✅ (true)
* `statusUnchanged`: ✅ (true)
* `correlationIdPresent`: ✅ (true)
* `httpIs500orFault`: ✅ (true)

## Notes
DB unchanged: count 1==1, hash true, correlationId=corr-1784080535554-jnk5xkwbr