import { defineText } from '@/shared/i18n/text';

export const LOGIN_TEXT = defineText({
  'zh-CN': {
    title: '欢迎回来',
    subtitle: '请登录账号以继续。',
    account: '账号',
    password: '密码',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    submit: '登录',
    submitting: '登录中…',
  },
  en: {
    title: 'Welcome back',
    subtitle: 'Log in to your account to continue.',
    account: 'Account',
    password: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Log in',
    submitting: 'Logging in…',
  },
});

export type LoginText = (typeof LOGIN_TEXT)['zh-CN'];
