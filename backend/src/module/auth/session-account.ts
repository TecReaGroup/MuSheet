import { appConfig } from '../../config/app-config';
import { findUserByAccount, findUserById, type UserRow } from '../user/user-repository';
import { burnPasswordCheck, verifyPassword } from './password-hash';
import { equalsInConstantTime, type SessionClaim } from './session-token';

export const ROOT_USER_ID = 'root';

/** The authenticated caller of a request. */
export interface SessionAccount {
  id: string;
  account: string;
  isRoot: boolean;
  epoch: number;
}

const ROOT_ACCOUNT: SessionAccount = { id: ROOT_USER_ID, account: appConfig.admin.account, isRoot: true, epoch: 0 };

export function toSessionAccount(user: UserRow): SessionAccount {
  return { id: user.id, account: user.account, isRoot: false, epoch: user.sessionEpoch };
}

export async function authenticate(account: string, password: string): Promise<SessionAccount | undefined> {
  // User names can never equal root's (see user-repository), so a root name match settles it either way.
  if (equalsInConstantTime(account, appConfig.admin.account)) {
    return equalsInConstantTime(password, appConfig.admin.password) ? ROOT_ACCOUNT : undefined;
  }
  const user = await findUserByAccount(account);
  if (!user) {
    await burnPasswordCheck(password);
    return undefined;
  }
  return (await verifyPassword(password, user.passwordHash)) ? toSessionAccount(user) : undefined;
}

/** A claim stays valid only while its user exists and still has the epoch the token was issued with. */
export async function resolveSessionAccount(claim: SessionClaim): Promise<SessionAccount | undefined> {
  if (claim.userId === ROOT_USER_ID) return claim.epoch === ROOT_ACCOUNT.epoch ? ROOT_ACCOUNT : undefined;
  const user = await findUserById(claim.userId);
  return user && user.sessionEpoch === claim.epoch ? toSessionAccount(user) : undefined;
}
