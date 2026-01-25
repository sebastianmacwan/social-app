import bcrypt from "bcryptjs";

export function generatePassword(length = 10): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const all = upper + lower;

  let password = "";
  for (let i = 0; i < length; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }

  return password;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
