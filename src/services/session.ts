/** An authenticated session must eventually come from the selected auth provider. */
export type UserSession =
  | { readonly status: 'anonymous' }
  | { readonly status: 'authenticated'; readonly userId: string; readonly displayName: string };

export interface SessionService {
  getSession(): Promise<UserSession>;
}

/** Jam play requires no identity, account creation, credential or network request. */
export class AnonymousSessionService implements SessionService {
  async getSession(): Promise<UserSession> {
    return Object.freeze({ status: 'anonymous' as const });
  }
}
