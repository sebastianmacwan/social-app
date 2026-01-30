export async function isSuspiciousLogin(
  userId: number,
  ip: string,
  browser: string,
  device: string
) {
  // Login history not implemented in simplified schema
  // Always return false (not suspicious)
  return false;
}
