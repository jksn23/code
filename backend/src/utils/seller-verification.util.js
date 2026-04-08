export const SELLER_VERIFICATION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

export const resolveSellerVerificationStatus = (seller) => {
  if (!seller) return SELLER_VERIFICATION_STATUS.PENDING;
  if (seller.verificationStatus) return seller.verificationStatus;
  return seller.isVerified
    ? SELLER_VERIFICATION_STATUS.APPROVED
    : SELLER_VERIFICATION_STATUS.PENDING;
};

export const isSellerApproved = (seller) =>
  resolveSellerVerificationStatus(seller) === SELLER_VERIFICATION_STATUS.APPROVED;

export const toLegacySellerVerifiedFlag = (seller) => isSellerApproved(seller);
