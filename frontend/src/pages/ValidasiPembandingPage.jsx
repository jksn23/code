import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPembandingByAset, validasiPembanding } from '../services/api';
import { useModal } from '../context/ModalContext';

const ValidasiPembandingPage = () => {
  const { showAlert } = useModal();
  const { asetId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [asetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPembandingByAset(asetId);
      setData(res.data || []);
    } catch {
      showAlert('Gagal mengambil data pembanding', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidasi = async (id, statusValidasi) => {
    try {
      await validasiPembanding(id, { statusValidasi });
      showAlert(`Berhasil mengubah status menjadi ${statusValidasi}`, 'success');
      fetchData();
    } catch {
      showAlert('Gagal mengubah status validasi', 'error');
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  const dataDipilih = data.filter(d => d.dipilihPenjual);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Validasi Data Pembanding</h1>
          <p className="text-gray-600">Review dan validasi data pembanding yang diajukan oleh penjual.</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">Kembali</button>
      </div>

      <div className="card bg-base-100 shadow-xl overflow-hidden mb-8">
        <div className="card-body">
          <h2 className="card-title">Data yang Diajukan Penjual</h2>
          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200">
                <tr>
                  <th>Judul & Sumber</th>
                  <th>Harga</th>
                  <th>Detail</th>
                  <th>Skor</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4"><span className="loading loading-spinner"></span></td></tr>
                ) : dataDipilih.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4">Belum ada data yang diajukan penjual</td></tr>
                ) : (
                  dataDipilih.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-bold">{item.judul}</div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">
                            {item.sumber}
                          </a>
                          {item.sourceDomain && (
                            <span className="badge badge-outline text-[10px] opacity-75">
                              {item.sourceDomain}
                            </span>
                          )}
                          <span className={`badge text-[10px] ${
                            item.statusIntegritasUrl === 'DETAIL_IKLAN' ? 'badge-success badge-outline' : 'badge-error'
                          }`}>
                            {item.statusIntegritasUrl || 'BELUM_DIVERIFIKASI'}
                          </span>
                        </div>
                      </td>
                      <td className="font-semibold text-green-600">{formatRupiah(item.harga)}</td>
                      <td className="text-sm">
                        {item.tahun && <div>Tahun: {item.tahun}</div>}
                        {item.lokasi && <div>Lokasi: {item.lokasi}</div>}
                        {item.kondisi && <div className="text-gray-400 text-xs">{item.kondisi}</div>}
                      </td>
                      <td>
                        <div className="flex flex-col items-center gap-1">
                          <div className="radial-progress text-primary text-xs font-bold" style={{"--value": item.skorKecocokan || Math.round((item.similarity || 0) * 100), "--size": "2.5rem"}}>
                            {item.skorKecocokan || Math.round((item.similarity || 0) * 100)}%
                          </div>
                          <span className={`badge badge-sm font-bold text-[9px] ${
                            item.statusKecocokan === 'LAYAK' ? 'badge-success' :
                            item.statusKecocokan === 'PERLU_TINJAU' ? 'badge-warning' : 'badge-error'
                          }`}>
                            {item.statusKecocokan || 'BELUM_DIEVALUASI'}
                          </span>
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
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-sm btn-success text-white" 
                            onClick={() => handleValidasi(item.id, 'DITERIMA')}
                            disabled={item.statusValidasi === 'DITERIMA' || item.statusIntegritasUrl !== 'DETAIL_IKLAN'}
                            title={item.statusIntegritasUrl !== 'DETAIL_IKLAN' ? 'Tautan harus berupa detail iklan untuk dapat diterima' : 'Terima data pembanding'}
                          >
                            Terima
                          </button>
                          <button 
                            className="btn btn-sm btn-error text-white" 
                            onClick={() => handleValidasi(item.id, 'DITOLAK')}
                            disabled={item.statusValidasi === 'DITOLAK'}
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidasiPembandingPage;
