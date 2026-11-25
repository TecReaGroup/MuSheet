import { defineText } from '@/shared/i18n/text';

export type SettingSectionKey = 'account' | 'appearance' | 'tag' | 'language' | 'about';

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
  twoPageView: string;
  twoPageViewDescription: string;
  tagDescription: string;
  tagPlaceholder: string;
  addTag: string;
  removeTag: (tag: string) => string;
  tagExists: string;
  logout: string;
  logoutAction: string;
  version: (version: string) => string;
  tagline: string;
}

export const SETTING_TEXT = defineText<SettingText>({
  'zh-CN': {
    setting: '设置',
    section: { account: '账号', appearance: '外观', tag: '标签', language: '语言', about: '关于' },
    theme: '主题',
    themeSystem: '自动',
    themeLight: '浅色',
    themeDark: '深色',
    interfaceLanguage: '界面语言',
    nightScore: '夜间乐谱',
    nightScoreDescription: '反转乐谱颜色，适合暗场演出。',
    twoPageView: '双页显示',
    twoPageViewDescription: '横屏且空间足够时并排显示两页。',
    tagDescription: '导入乐谱时可选的标签，所有成员共用这份列表。',
    tagPlaceholder: '新标签名称',
    addTag: '添加',
    removeTag: tag => `删除标签「${tag}」`,
    tagExists: '已有同名标签',
    logout: '退出登录',
    logoutAction: '退出',
    version: version => `版本 ${version}`,
    tagline: '为乐手打造的数字乐谱阅读器',
  },
  en: {
    setting: 'Settings',
    section: { account: 'Account', appearance: 'Appearance', tag: 'Tags', language: 'Language', about: 'About' },
    theme: 'Theme',
    themeSystem: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    interfaceLanguage: 'Interface language',
    nightScore: 'Night mode',
    nightScoreDescription: 'Inverts score colors for dark stages.',
    twoPageView: 'Two-page view',
    twoPageViewDescription: 'Shows two pages side by side in landscape when they fit.',
    tagDescription: 'Tags to choose from when importing scores. Everyone shares this list.',
    tagPlaceholder: 'New tag name',
    addTag: 'Add',
    removeTag: tag => `Remove the "${tag}" tag`,
    tagExists: 'A tag with this name already exists',
    logout: 'Log out',
    logoutAction: 'Log out',
    version: version => `Version ${version}`,
    tagline: 'A digital sheet music reader built for musicians',
  },
});
