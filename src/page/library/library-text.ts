import { defineText } from '@/shared/i18n/text';

export const LIBRARY_TEXT = defineText({
  'zh-CN': {
    title: { personal: '曲库', team: '团队' },
    copyFromLibrary: '从我的曲库选取',
    importFromDevice: '从本地导入',
    teamAdd: {
      score: { title: '添加乐谱到团队', fromLibrary: '复制你曲库里的乐谱，两边各自修改互不影响', fresh: '上传设备上的 PDF 乐谱' },
      setlist: { title: '添加谱单到团队', fromLibrary: '连同其中的乐谱一起复制到团队', fresh: '在团队中新建一个谱单' },
    },
    collectionType: '内容类型',
    counts: (setlistCount: number, scoreCount: number) => `${setlistCount} 个谱单 · ${scoreCount} 份乐谱`,
    searchScores: '搜索乐谱或作曲',
    searchSetlists: '搜索谱单',
    noMatchingScores: '没有匹配的乐谱',
    noScoresTitle: '还没有乐谱',
    noScoresDescription: { personal: '导入 PDF 乐谱，或直接把文件拖进窗口', team: '团队是全队共享的曲库。从你的曲库导入，或上传本地 PDF' },
    noMatchingSetlists: '没有匹配的谱单',
    noSetlistsTitle: '还没有谱单',
    noSetlistsDescription: '把演出或排练要用的乐谱按顺序排好，翻页时自动衔接下一首',
    importScore: '导入乐谱',
    newSetlist: '新建谱单',
  },
  en: {
    title: { personal: 'Library', team: 'Team' },
    copyFromLibrary: 'From my library',
    importFromDevice: 'Import from device',
    teamAdd: {
      score: { title: 'Add scores to Team', fromLibrary: 'Copies are edited independently', fresh: 'Upload PDF scores from this device' },
      setlist: { title: 'Add setlists to Team', fromLibrary: 'Copy setlists together with their scores', fresh: 'Start a new setlist in Team' },
    },
    collectionType: 'Content type',
    counts: (setlistCount: number, scoreCount: number) =>
      `${setlistCount} ${setlistCount === 1 ? 'setlist' : 'setlists'} · ${scoreCount} ${scoreCount === 1 ? 'score' : 'scores'}`,
    searchScores: 'Search scores or composers',
    searchSetlists: 'Search setlists',
    noMatchingScores: 'No matching scores',
    noScoresTitle: 'No scores yet',
    noScoresDescription: { personal: 'Import PDF scores, or drag files into the window.', team: 'Team is the library shared by everyone. Import from your library or upload local PDFs.' },
    noMatchingSetlists: 'No matching setlists',
    noSetlistsTitle: 'No setlists yet',
    noSetlistsDescription: 'Put the scores for a gig or rehearsal in order; turning past the last page moves on to the next one.',
    importScore: 'Import score',
    newSetlist: 'New setlist',
  },
});
