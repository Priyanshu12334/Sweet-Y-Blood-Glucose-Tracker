export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function authErrorMessage(error, fallback) {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  if (status === 401) return 'Email or password is incorrect. Check your details and try again.';
  if (status === 409) return message || 'An account with this email already exists.';
  if (status === 400) return message || 'Check the information and try again.';
  if (!error.response) return 'Could not connect to Sweet-y. Check your connection and try again.';
  return fallback;
}
