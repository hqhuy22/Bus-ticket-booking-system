export interface User {
  id: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  role?: string;
  verified_at?: string | null;
  created_at?: string;
}
