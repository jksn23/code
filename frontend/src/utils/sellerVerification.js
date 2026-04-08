export const SELLER_VERIFICATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

export function resolveSellerStatus(source) {
  if (!source) return SELLER_VERIFICATION_STATUS.PENDING;
  if (source.sellerVerificationStatus) return source.sellerVerificationStatus;
  if (source.verificationStatus) return source.verificationStatus;
  if (source.penjual?.verificationStatus) return source.penjual.verificationStatus;
  if (typeof source.isVerified === 'boolean') {
    return source.isVerified ? SELLER_VERIFICATION_STATUS.APPROVED : SELLER_VERIFICATION_STATUS.PENDING;
  }
  if (typeof source.penjual?.isVerified === 'boolean') {
    return source.penjual.isVerified ? SELLER_VERIFICATION_STATUS.APPROVED : SELLER_VERIFICATION_STATUS.PENDING;
  }
  return SELLER_VERIFICATION_STATUS.PENDING;
}

export function isSellerApprovedStatus(status) {
  return status === SELLER_VERIFICATION_STATUS.APPROVED;
}

export function getSellerStatusMeta(status) {
  const map = {
    PENDING: { label: 'Menunggu Review', shortLabel: 'Pending', bg: '#fef3c7', color: '#92400e' },
    APPROVED: { label: 'Terverifikasi', shortLabel: 'Approved', bg: '#dcfce7', color: '#166534' },
    REJECTED: { label: 'Perlu Revisi', shortLabel: 'Rejected', bg: '#fee2e2', color: '#b91c1c' },
  };
  return map[status] || map.PENDING;
}
