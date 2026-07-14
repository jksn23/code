import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Calculator, CheckCircle2, Save } from 'lucide-react';
import {
  getSellerAsetKriteria,
  hitungSellerAsetSAW,
  saveSellerNilaiKriteria,
} from '../services/api.js';

const SCALE_OPTIONS = [1, 2, 3, 4, 5];
const SCALE_NOTES = [
  { value: 1, label: 'Sangat rendah / sangat buruk' },
  { value: 2, label: 'Rendah / kurang' },
  { value: 3, label: 'Cukup' },
  { value: 4, label: 'Baik' },
  { value: 5, label: 'Sangat baik / sangat tinggi' },
];

const STATUS_LABEL = {
  DRAFT: 'Draft',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  DISETUJUI: 'Disetujui',
  PERLU_REVISI: 'Perlu Revisi',
  DITOLAK: 'Ditolak',
};

const formatRp = (value) =>
  value == null
    ? '-'
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

const canEdit = (status) => ['DRAFT', 'PERLU_REVISI'].includes(status);

export default function SellerPenilaianPage() {
  const { asetId } = useParams();
  const [detail, setDetail] = useState(null);
  const [nilaiForm, setNilaiForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [alert, setAlert] = useState(null);

  const load = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const res = await getSellerAsetKriteria(asetId);
      setDetail(res.data);
      const map = {};
      (res.data?.kriteria || []).forEach((item) => {
        map[item.id] = item.nilai ?? '';
      });
      setNilaiForm(map);
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [asetId]);

  const nilaiList = () =>
    (detail?.kriteria || []).map((item) => ({
      kriteria_id: item.id,
      nilai: Number(nilaiForm[item.id]),
    }));

  const validateForm = () => {
    const invalid = nilaiList().filter((item) => !Number.isInteger(item.nilai) || item.nilai < 1 || item.nilai > 5);
    if (invalid.length > 0) {
      setAlert({ type: 'danger', msg: 'Semua kriteria wajib diisi dengan nilai 1 sampai 5.' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setAlert(null);
    try {
      const res = await saveSellerNilaiKriteria(asetId, { nilai_list: nilaiList() });
      setDetail(res.data);
      setAlert({ type: 'success', msg: 'Nilai kriteria berhasil disimpan.' });
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleHitung = async () => {
    if (!validateForm()) return;
    setCalculating(true);
    setAlert(null);
    try {
      await saveSellerNilaiKriteria(asetId, { nilai_list: nilaiList() });
      const res = await hitungSellerAsetSAW(asetId);
      setDetail(res.data);
      setAlert({ type: 'success', msg: 'Nilai preferensi berhasil dihitung dan dikirim ke admin.' });
    } catch (err) {
      setAlert({ type: 'danger', msg: err.message });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><span className="spinner" /></div>;
  }

  if (!detail) {
    return (
      <div className="card">
        <div className="empty-state">Data penilaian tidak tersedia.</div>
      </div>
    );
  }

  const disabled = !canEdit(detail.aset.statusPenilaian);

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <Link to="/aset" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Kembali
          </Link>
          <h2>Penilaian Aset</h2>
          <p>Isi nilai kriteria aset dengan skala 1 sampai 5 berdasarkan kategori aset.</p>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {detail.aset.statusPenilaian === 'PERLU_REVISI' && detail.aset.catatanPenilaian && (
        <div className="alert alert-warning" style={{ display: 'flex', gap: 10 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Catatan revisi admin:</strong>
            <div>{detail.aset.catatanPenilaian}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Aset</div>
            <strong>{detail.aset.nama}</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{detail.aset.kategori?.nama}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Harga Referensi Pasar</div>
            <strong>{formatRp(detail.aset.hargaPasar)}</strong>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Status Penilaian</div>
            <span className="badge badge-primary">{STATUS_LABEL[detail.aset.statusPenilaian] || detail.aset.statusPenilaian}</span>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Rekomendasi Nilai Limit Awal</div>
            <strong style={{ color: 'var(--success)' }}>{formatRp(detail.hasil?.nilaiLimit)}</strong>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Keterangan Skala</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {SCALE_NOTES.map((item) => (
            <div key={item.value} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
              <strong>Nilai {item.value}</strong>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Kriteria</th>
                <th>Tipe</th>
                <th>Bobot AHP</th>
                <th style={{ width: 180 }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {detail.kriteria.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nama}</strong></td>
                  <td><span className={`badge ${item.tipe === 'benefit' ? 'badge-success' : 'badge-warning'}`}>{item.tipe}</span></td>
                  <td>{item.bobot != null ? `${(Number(item.bobot) * 100).toFixed(2)}%` : '-'}</td>
                  <td>
                    <select
                      className="form-control"
                      value={nilaiForm[item.id] ?? ''}
                      disabled={disabled}
                      onChange={(event) => setNilaiForm((prev) => ({ ...prev, [item.id]: event.target.value }))}
                    >
                      <option value="">Pilih nilai</option>
                      {SCALE_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    {nilaiForm[item.id] && item.rubrik && item.rubrik.length > 0 && (
                      (() => {
                        const rub = item.rubrik.find(r => r.skor === Number(nilaiForm[item.id]));
                        return rub ? (
                          <div style={{ 
                            marginTop: 6, 
                            fontSize: 11, 
                            color: 'var(--text-muted)', 
                            background: '#f4f4f5', 
                            padding: '6px 10px', 
                            borderRadius: 6, 
                            border: '1px solid #e4e4e7' 
                          }}>
                            <strong>{rub.label}</strong>: {rub.deskripsi}
                            {rub.contohBukti && (
                              <div style={{ fontStyle: 'italic', marginTop: 2, opacity: 0.8 }}>
                                Bukti: {rub.contohBukti}
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          {disabled && (
            <div style={{ marginRight: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
              Nilai tidak dapat diubah pada status ini.
            </div>
          )}
          <button className="btn btn-secondary" onClick={handleSave} disabled={disabled || saving || calculating}>
            {saving ? <span className="spinner" /> : <><Save size={15} /> Simpan Nilai</>}
          </button>
          <button className="btn btn-primary" onClick={handleHitung} disabled={disabled || saving || calculating}>
            {calculating ? <span className="spinner" /> : <><Calculator size={15} /> Hitung Nilai Preferensi</>}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Hasil Penilaian</h3>
        {detail.hasil ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nilai Preferensi SAW</div>
              <strong>{Number(detail.hasil.nilaiPreferensi).toFixed(6)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Harga Referensi Pasar</div>
              <strong>{formatRp(detail.aset.hargaPasar)}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Rekomendasi Nilai Limit Awal</div>
              <strong style={{ color: 'var(--success)', fontSize: 16 }}>{formatRp(detail.hasil.nilaiLimit)}</strong>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 24 }}>
            <CheckCircle2 size={42} opacity={0.25} />
            <p>Hasil belum tersedia. Simpan nilai lalu jalankan perhitungan SAW.</p>
          </div>
        )}
      </div>
    </div>
  );
}
