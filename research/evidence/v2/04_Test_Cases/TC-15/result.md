# Test Case TC-15 - Rollback transaksi database

* **Expected**: Rollback terjadi — DB before = DB after, tidak ada record tersimpan
* **Actual**: HTTP 500 | DB unchanged=true
* **HTTP Status**: 500
* **Status**: PASS
* **Notes**: correlation_id: corr-1784058248999-j1he2gl5w
