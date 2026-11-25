import { defineText } from '@/shared/i18n/text';

export const HOME_TEXT = defineText({
  'zh-CN': {
    title: '首页',
    welcomeTitle: '欢迎使用 MuSheet',
    welcomeDescription: '导入第一份 PDF 乐谱，开始你的数字谱架。',
    recentSetlists: '最近曲目单',
    recentScores: '最近乐曲',
    searchPlaceholder: '搜索乐曲、作曲者或曲目单',
    noMatchTitle: '没有找到匹配的内容',
    noMatchDescription: '试试乐曲名、作曲者或曲目单名称',
  },
  en: {
    title: 'Home',
    welcomeTitle: 'Welcome to MuSheet',
    welcomeDescription: 'Import your first PDF score to start your digital music stand.',
    recentSetlists: 'Recent setlists',
    recentScores: 'Recent scores',
    searchPlaceholder: 'Search scores, composers or setlists',
    noMatchTitle: 'Nothing matches your search',
    noMatchDescription: 'Try a score title, composer or setlist name',
  },
});
