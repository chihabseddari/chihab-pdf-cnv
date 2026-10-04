import bcrypt from "bcryptjs";

const ROUNDS = 12;
let dummyHash: string | null = null;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string | null) {
  dummyHash ??= bcrypt.hashSync("qirtas-unused-password", ROUNDS);
  return bcrypt.compare(password, passwordHash ?? dummyHash);
}
