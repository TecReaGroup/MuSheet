import { defineText } from '@/shared/i18n/text';

export const LIBRARY_STAT_TEXT = defineText({
  'zh-CN': {
    description: '整个服务器上的数据总量，私有一栏为所有成员之和',
    user: '用户',
    part: '声部',
    annotatedPage: '已批注页',
    storage: 'PDF 存储',
    pdfFileCount: (count: number) => `${count} 个文件`,
    spaceSplit: (personal: number, team: number) => `私有 ${personal} · 共享 ${team}`,
  },
  en: {
    description: 'Totals across the whole server. Personal counts add up every member\'s library',
    user: 'Users',
    part: 'Parts',
    annotatedPage: 'Annotated pages',
    storage: 'PDF storage',
    pdfFileCount: (count: number) => `${count} ${count === 1 ? 'file' : 'files'}`,
    spaceSplit: (personal: number, team: number) => `Personal ${personal} · Team ${team}`,
  },
});
