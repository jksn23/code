import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  // Alert state
  const [alertConfig, setAlertConfig] = useState(null); // { message, title, type, resolve }
  // Confirm state
  const [confirmConfig, setConfirmConfig] = useState(null); // { message, title, type, confirmText, cancelText, resolve }

  const showAlert = useCallback((message, type = 'info', title = null) => {
    return new Promise((resolve) => {
      setAlertConfig({
        message,
        title: title || (type === 'success' ? 'Sukses' : type === 'error' ? 'Kesalahan' : type === 'warning' ? 'Peringatan' : 'Informasi'),
        type,
        resolve,
      });
    });
  }, []);

  const showConfirm = useCallback((message, { title = 'Konfirmasi Action', type = 'warning', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal' } = {}) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        message,
        title,
        type,
        confirmText,
        cancelText,
        resolve,
      });
    });
  }, []);

  const handleCloseAlert = () => {
    if (alertConfig?.resolve) alertConfig.resolve(true);
    setAlertConfig(null);
  };

  const handleConfirmAction = (isConfirmed) => {
    if (confirmConfig?.resolve) confirmConfig.resolve(isConfirmed);
    setConfirmConfig(null);
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Custom Theme Alert Modal */}
      {alertConfig && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              {alertConfig.type === 'success' && <CheckCircle2 size={24} style={{ color: 'var(--success)', flexShrink: 0 }} />}
              {alertConfig.type === 'error' && <XCircle size={24} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
              {alertConfig.type === 'warning' && <AlertTriangle size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />}
              {alertConfig.type === 'info' && <Info size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />}

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{alertConfig.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{alertConfig.message}</p>
              </div>

              <button className="btn btn-secondary btn-sm" style={{ padding: 4 }} onClick={handleCloseAlert}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-primary" style={{ minWidth: 100 }} onClick={handleCloseAlert}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Confirm Modal */}
      {confirmConfig && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
              {confirmConfig.type === 'danger' ? (
                <XCircle size={26} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={26} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              )}

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{confirmConfig.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{confirmConfig.message}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleConfirmAction(false)}
              >
                {confirmConfig.cancelText}
              </button>
              <button
                className={`btn ${confirmConfig.type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleConfirmAction(true)}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
