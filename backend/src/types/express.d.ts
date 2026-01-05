import 'express';

export type AuthUser = {
  id: string;
  role: 'ADMIN' | 'USER';
  planStatus: 'ACTIVE' | 'INACTIVE';
  planActiveUntil: Date | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      rawBody?: Buffer;
    }
  }
}
