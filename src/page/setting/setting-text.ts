import { defineText } from '@/shared/i18n/text';

export type SettingSectionKey = 'account' | 'appearance' | 'language' | 'reading' | 'about';

interface SettingText {
  setting: string;
  section: Record<SettingSectionKey, string>;
  theme: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  interfaceLanguage: string;
  nightScore: string;
  nightScoreDescription: string;
  logout: string;
  logoutAction: string;
  version: (version: string) => string;
  tagline: string;
}

export const SETTING_TEXT = defineText<SettingText>({
  'zh-CN': {
    setting: '设置',
    section: { account: '账号', appearance: '外观', language: '语言', reading: '阅读', about: '关于' },
    theme: '主题',
    themeSystem: '自动',
    themeLight: '浅色',
    themeDark: '深色',
    interfaceLanguage: '界面语言',
    nightScore: '夜间乐谱',
    nightScoreDescription: '反转乐谱颜色，适合暗场演出。',
    logout: '退出登录',
    logoutAction: '退出',
    version: version => `版本 ${version}`,
    tagline: '为乐手打造的数字乐谱阅读器',
  },
  en: {
    setting: 'Settings',
    section: { account: 'Account', appearance: 'Appearance', language: 'Language', reading: 'Reading', about: 'About' },
    theme: 'Theme',
    themeSystem: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    interfaceLanguage: 'Interface language',
    nightScore: 'Night mode',
    nightScoreDescription: 'Inverts score colors for dark stages.',
    logout: 'Log out',
    logoutAction: 'Log out',
    version: version => `Version ${version}`,
    tagline: 'A digital sheet music reader built for musicians',
  },
});
