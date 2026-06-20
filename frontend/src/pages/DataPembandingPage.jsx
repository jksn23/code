import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getPembandingByAset, 
  searchPembanding, 
  addManualPembanding, 
  hitungMedianPembanding, 
  selectPembanding 
} from '../services/api';

const DataPembandingPage = () => {
  const { asetId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [hargaReferensi, setHargaReferensi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Form Manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({
    judul: '',
    sumber: '',
    sourceUrl: '',
    harga: '',
    lokasi: '',
    tahun: '',
    kondisi: '',
    spesifikasi: ''
  });

  useEffect(() => {
    fetchData();
  }, [asetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPembandingByAset(asetId);
      setData(res.data || []);
      setHargaReferensi(res.hargaReferensiPasar);
    } catch (error) {
      alert('Gagal mengambil data pembanding');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const res = await searchPembanding(asetId);
      alert(res.message);
      fetchData();
    } catch (error) {
      alert(error.message || 'Gagal mencari data');
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleSelect = async (id, currentStatus) => {
    try {
      await selectPembanding(id, { dipilihPenjual: !currentStatus });
      fetchData(); // Refresh data
    } catch (error) {
      alert('Gagal mengubah status');
    }
  };

  const handleHitungMedian = async () => {
    const selectedCount = data.filter(d => d.dipilihPenjual && d.statusValidasi !== 'DITOLAK').length;
    if (selectedCount < 3) {
      alert('Minimal pilih 3 data pembanding yang tidak ditolak');
      return;
    }
    
    try {
      const res = await hitungMedianPembanding(asetId);
      alert(res.message);
      setHargaReferensi(res.data.median);
    } catch (error) {
      alert(error.message || 'Gagal menghitung referensi pasar');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await addManualPembanding(asetId, manualData);
      alert('Data manual berhasil ditambahkan');
      setShowManualForm(false);
      setManualData({ judul: '', sumber: '', sourceUrl: '', harga: '', lokasi: '', tahun: '', kondisi: '', spesifikasi: '' });
      fetchData();
    } catch (error) {
      alert('Gagal menambahkan data manual');
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Pembanding Aset</h1>
          <p className="text-gray-600">Cari dan pilih minimal 3 data pembanding untuk aset ini.</p>
        </div>
        <button onClick={() => navigate('/aset')} className="btn btn-ghost">Kembali</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl p-6">
          <h2 className="card-title text-primary mb-2">Harga Referensi Pasar</h2>
          <div className="text-3xl font-bold">
            {hargaReferensi ? formatRupiah(hargaReferensi) : 'Belum dihitung'}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Harga ini dihitung dari median data pembanding yang dipilih.
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl p-6 md:col-span-2 flex flex-col justify-center">
          <div className="flex gap-4">
            <button 
              className="btn btn-primary flex-1" 
              onClick={handleSearch} 
              disabled={isSearching}
            >
              {isSearching ? <span className="loading loading-spinner"></span> : 'Cari Otomatis'}
            </button>
            <button 
              className="btn btn-outline flex-1" 
              onClick={() => setShowManualForm(!showManualForm)}
            >
              Tambah Manual
            </button>
            <button 
              className="btn btn-secondary flex-1" 
              onClick={handleHitungMedian}
            >
              Hitung Referensi
            </button>
          </div>
        </div>
      </div>

      {showManualForm && (
        <div className="card bg-base-100 shadow-xl mb-8 p-6">
          <h3 className="font-bold text-lg mb-4">Tambah Data Manual</h3>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input input-bordered" placeholder="Judul Iklan/Aset" value={manualData.judul} onChange={e => setManualData({...manualData, judul: e.target.value})} required />
            <input className="input input-bordered" placeholder="Sumber (Misal: OLX, Carmudi)" value={manualData.sumber} onChange={e => setManualData({...manualData, sumber: e.target.value})} required />
            <input className="input input-bordered" placeholder="URL Sumber" type="url" value={manualData.sourceUrl} onChange={e => setManualData({...manualData, sourceUrl: e.target.value})} required />
            <input className="input input-bordered" placeholder="Harga" type="number" value={manualData.harga} onChange={e => setManualData({...manualData, harga: e.target.value})} required />
            <input className="input input-bordered" placeholder="Tahun" type="number" value={manualData.tahun} onChange={e => setManualData({...manualData, tahun: e.target.value})} />
            <input className="input input-bordered" placeholder="Lokasi" value={manualData.lokasi} onChange={e => setManualData({...manualData, lokasi: e.target.value})} />
            <button type="submit" className="btn btn-primary md:col-span-2">Simpan</button>
          </form>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Pilih</th>
                <th>Judul & Sumber</th>
                <th>Harga</th>
                <th>Detail</th>
                <th>Skor</th>
                <th>Status Validasi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4"><span className="loading loading-spinner"></span></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">Belum ada data pembanding</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-primary"
                        checked={item.dipilihPenjual}
                        onChange={() => handleToggleSelect(item.id, item.dipilihPenjual)}
                      />
                    </td>
                    <td>
                      <div className="font-bold">{item.judul}</div>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">{item.sumber}</a>
                    </td>
                    <td className="font-semibold text-green-600">{formatRupiah(item.harga)}</td>
                    <td className="text-sm">
                      {item.tahun && <div>Tahun: {item.tahun}</div>}
                      {item.lokasi && <div>Lokasi: {item.lokasi}</div>}
                    </td>
                    <td>
                      <div className="radial-progress text-primary text-xs" style={{"--value": item.skorKecocokan, "--size": "2.5rem"}}>
                        {item.skorKecocokan}%
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.statusValidasi === 'DITERIMA' ? 'badge-success' : 
                        item.statusValidasi === 'DITOLAK' ? 'badge-error' : 'badge-warning'
                      }`}>
                        {item.statusValidasi}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataPembandingPage;
