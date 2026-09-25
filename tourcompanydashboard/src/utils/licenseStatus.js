export const normalizeVerificationStatus = (value) => {
  switch (String(value || '').toLowerCase()) {
    case 'approved':
    case 'verified':
      return 'Approved';
    case 'pending':
      return 'Pending';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Not Verified';
  }
};

export const statusLabel = (status) => {
  switch (status) {
    case 'Approved':
      return 'Verified';
    case 'Pending':
      return 'Pending';
    case 'Rejected':
      return 'Rejected';
    default:
      return 'Not Verified';
  }
};

export const statusClassName = (status) => {
  if (status === 'Approved') return 'verified';
  if (status === 'Pending') return 'pending';
  return 'not-verified';
};

export const statusCanEdit = (status) => status !== 'Pending' && status !== 'Approved';
export const statusCanRequest = (status) => status !== 'Pending' && status !== 'Approved';
