import { PASSWORD_MIN_LENGTH } from '@contract/api';
import { defineText } from '@/shared/i18n/text';

export const USER_ADMIN_TEXT = defineText({
  'zh-CN': {
    title: '账号管理',
    newUser: '新建账号',
    noUsers: '还没有其他账号',
    username: '用户名',
    password: '初始密码',
    newPassword: '新密码',
    passwordHint: `至少 ${PASSWORD_MIN_LENGTH} 位`,
    create: '创建',
    created: (account: string) => `已创建账号 ${account}`,
    resetPassword: '重置密码',
    resetTitle: (account: string) => `重置 ${account} 的密码`,
    resetDone: '密码已重置，该账号需要重新登录',
    deleteUser: '删除账号',
    deleted: (account: string) => `已删除账号 ${account}`,
  },
  en: {
    title: 'Accounts',
    newUser: 'New account',
    noUsers: 'No other accounts yet',
    username: 'Username',
    password: 'Initial password',
    newPassword: 'New password',
    passwordHint: `At least ${PASSWORD_MIN_LENGTH} characters.`,
    create: 'Create',
    created: (account: string) => `Created account ${account}`,
    resetPassword: 'Reset password',
    resetTitle: (account: string) => `Reset password for ${account}`,
    resetDone: 'Password reset; the account must log in again',
    deleteUser: 'Delete account',
    deleted: (account: string) => `Deleted account ${account}`,
  },
});
