import { AsyncLocalStorage } from 'node:async_hooks';

export interface PersistenceContext {
  organizationId: string;
  userId: string;
  accessToken: string;
}

const persistenceContext = new AsyncLocalStorage<PersistenceContext>();

export function runPersistenceContext<T>(context: PersistenceContext, callback: () => T): T {
  return persistenceContext.run(context, callback);
}

export function getPersistenceContext(): PersistenceContext | null {
  return persistenceContext.getStore() || null;
}
