import { defineText } from '@/shared/i18n/text';

export type SettingSectionKey = 'account' | 'general' | 'appearance' | 'library' | 'about';

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
  partName: string;
  partNameDescription: string;
  partNamePlaceholder: string;
  addPartName: string;
  removePartName: (name: string) => string;
  partNameExists: string;
  logout: string;
  logoutAction: string;
  version: (version: string) => string;
  tagline: string;
}

export const SETTING_TEXT = defineText<SettingText>({
  'zh-CN': {
    setting: '设置',
    section: { account: '账号', general: '通用', appearance: '外观', library: '曲库', about: '关于' },
    theme: '主题',
    themeSystem: '自动',
    themeLight: '浅色',
    themeDark: '深色',
    interfaceLanguage: '界面语言',
    nightScore: '夜间乐谱',
    nightScoreDescription: '反转乐谱颜色，适合暗场演出',
    twoPageView: '双页显示',
    twoPageViewDescription: '横屏且空间足够时并排显示两页',
    partName: '声部',
    partNameDescription: '导入乐谱时可选的声部，所有成员共用这份列表',
    partNamePlaceholder: '新声部名称',
    addPartName: '添加',
    removePartName: name => `删除声部「${name}」`,
    partNameExists: '已有同名声部',
    logout: '退出登录',
    logoutAction: '退出',
    version: version => `版本 ${version}`,
    tagline: '为乐手打造的数字乐谱阅读器',
  },
  en: {
    setting: 'Settings',
    section: { account: 'Account', general: 'General', appearance: 'Appearance', library: 'Library', about: 'About' },
    theme: 'Theme',
    themeSystem: 'Auto',
    themeLight: 'Light',
    themeDark: 'Dark',
    interfaceLanguage: 'Interface language',
    nightScore: 'Night mode',
    nightScoreDescription: 'Inverts score colors for dark stages.',
    twoPageView: 'Two-page view',
    twoPageViewDescription: 'Shows two pages side by side in landscape when they fit.',
    partName: 'Parts',
    partNameDescription: 'Parts to choose from when importing scores. Everyone shares this list.',
    partNamePlaceholder: 'New part name',
    addPartName: 'Add',
    removePartName: name => `Remove the "${name}" part`,
    partNameExists: 'A part with this name already exists',
    logout: 'Log out',
    logoutAction: 'Log out',
    version: version => `Version ${version}`,
    tagline: 'A digital sheet music reader built for musicians',
  },
});
