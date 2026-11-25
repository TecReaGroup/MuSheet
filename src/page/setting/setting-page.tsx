import { BookOpen, Eye, Hand, LogOut, Monitor, Moon, MoonStar, Palette, RotateCcw, SkipBack, SkipForward, Sun } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { logout, useSession } from '@/feature/auth/session-api';
import {
  DEFAULT_NEXT_PAGE_KEYS,
  DEFAULT_PREVIOUS_PAGE_KEYS,
  usePreferenceStore,
  type PageTurnMode,
  type ThemePreference,
} from '@/feature/preference/preference-store';
import { describeError } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { AppIcon, Wordmark } from '@/shared/ui/logo';
import { PageHeader } from '@/shared/ui/page-header';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Switch } from '@/shared/ui/switch';
import { PedalKeyEditor } from './pedal-key-editor';
import { SettingGroup, SettingRow } from './setting-group';

export function SettingPage() {
  const preference = usePreferenceStore();
  const { update } = preference;
  const session = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(describeError(error));
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="设置" />

      <SettingGroup title="外观">
        <SettingRow
          icon={<Palette />}
          title="主题"
          control={(
            <SegmentedControl<ThemePreference>
              label="主题"
              value={preference.theme}
              onChange={theme => update({ theme })}
              options={[
                { value: 'system', label: '自动', icon: <Monitor /> },
                { value: 'light', label: '浅色', icon: <Sun /> },
                { value: 'dark', label: '深色', icon: <Moon /> },
              ]}
            />
          )}
        />
      </SettingGroup>

      <SettingGroup title="阅读">
        <SettingRow
          icon={<BookOpen />}
          title="翻页方式"
          description="半页翻页：先把上半屏换成下一页，读到下半屏时再完整翻过，视线不会被翻页打断。"
          control={(
            <SegmentedControl<PageTurnMode>
              label="翻页方式"
              value={preference.pageTurn}
              onChange={pageTurn => update({ pageTurn })}
              options={[{ value: 'page', label: '整页' }, { value: 'half', label: '半页' }]}
            />
          )}
        />
        <SettingRow icon={<Hand />} title="点击屏幕两侧翻页" description="点左侧三分之一上一页，右侧三分之一下一页，中间显示或隐藏工具栏。" control={<Switch label="点击屏幕两侧翻页" checked={preference.tapZones} onChange={tapZones => update({ tapZones })} />} />
        <SettingRow icon={<MoonStar />} title="夜间乐谱" description="反转乐谱颜色，适合暗场演出。" control={<Switch label="夜间乐谱" checked={preference.nightScore} onChange={nightScore => update({ nightScore })} />} />
        <SettingRow icon={<Eye />} title="显示标注" control={<Switch label="显示标注" checked={preference.showAnnotation} onChange={showAnnotation => update({ showAnnotation })} />} />
      </SettingGroup>

      <SettingGroup title="蓝牙翻页器 / 键盘">
        <SettingRow icon={<SkipForward />} title="下一页" control={<PedalKeyEditor keys={preference.nextPageKeys} onChange={nextPageKeys => update({ nextPageKeys })} />} />
        <SettingRow icon={<SkipBack />} title="上一页" control={<PedalKeyEditor keys={preference.previousPageKeys} onChange={previousPageKeys => update({ previousPageKeys })} />} />
        <SettingRow
          icon={<RotateCcw />}
          title="恢复默认按键"
          description="翻页器配对后相当于键盘，大多数型号无需额外设置。"
          control={<Button size="sm" onClick={() => update({ nextPageKeys: DEFAULT_NEXT_PAGE_KEYS, previousPageKeys: DEFAULT_PREVIOUS_PAGE_KEYS })}>恢复</Button>}
        />
      </SettingGroup>

      <SettingGroup title="账号">
        <SettingRow
          icon={<LogOut />}
          title="退出登录"
          description={session.data ? `当前账号：${session.data.account}` : undefined}
          control={<Button size="sm" variant="danger" onClick={() => void handleLogout()}>退出</Button>}
        />
      </SettingGroup>

      <SettingGroup title="关于">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <AppIcon className="size-20" />
          <Wordmark className="mt-4 text-[32px]" />
          <p className="mt-1 text-sm text-fg-quiet tabular-nums">版本 {__APP_VERSION__}</p>
          <p className="mt-3 max-w-sm text-[13px] text-fg-subtle">为乐手打造的数字乐谱阅读器</p>
        </div>
      </SettingGroup>
    </div>
  );
}
