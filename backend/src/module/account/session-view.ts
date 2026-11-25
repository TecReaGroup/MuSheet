import type { SessionView } from '../../../../contract/api';
import type { SessionAccount } from '../auth/session-account';
import { findAvatar } from './avatar-repository';

export async function describeSession(account: SessionAccount): Promise<SessionView> {
  return { id: account.id, account: account.account, isRoot: account.isRoot, avatar: await findAvatar(account.id) };
}
