import { Monitor, Moon, Sun } from 'lucide-react';
import {
  DEFAULT_NEXT_PAGE_KEYS,
  DEFAULT_PREVIOUS_PAGE_KEYS,
  usePreferenceStore,
  type PageTurnMode,
  type ThemePreference,
} from '@/feature/preference/preference-store';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { Switch } from '@/shared/ui/switch';
import { PedalKeyEditor } from './pedal-key-editor';
import { SettingGroup, SettingRow } from './setting-group';

export function SettingPage() {
  const preference = usePreferenceStore();
  const { update } = preference;

  return (
    <>
      <PageHeader title="设置" />

      <SettingGroup title="外观">
        <SettingRow
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
        <SettingRow title="点击屏幕两侧翻页" description="点左侧三分之一上一页，右侧三分之一下一页，中间显示或隐藏工具栏。" control={<Switch label="点击屏幕两侧翻页" checked={preference.tapZones} onChange={tapZones => update({ tapZones })} />} />
        <SettingRow title="夜间乐谱" description="反转乐谱颜色，适合暗场演出。" control={<Switch label="夜间乐谱" checked={preference.nightScore} onChange={nightScore => update({ nightScore })} />} />
        <SettingRow title="显示标注" control={<Switch label="显示标注" checked={preference.showAnnotation} onChange={showAnnotation => update({ showAnnotation })} />} />
      </SettingGroup>

      <SettingGroup title="蓝牙翻页器 / 键盘">
        <SettingRow title="下一页" control={<PedalKeyEditor keys={preference.nextPageKeys} onChange={nextPageKeys => update({ nextPageKeys })} />} />
        <SettingRow title="上一页" control={<PedalKeyEditor keys={preference.previousPageKeys} onChange={previousPageKeys => update({ previousPageKeys })} />} />
        <SettingRow
          title="恢复默认按键"
          description="翻页器配对后相当于键盘，大多数型号无需额外设置。"
          control={<Button size="sm" onClick={() => update({ nextPageKeys: DEFAULT_NEXT_PAGE_KEYS, previousPageKeys: DEFAULT_PREVIOUS_PAGE_KEYS })}>恢复</Button>}
        />
      </SettingGroup>

      <SettingGroup title="关于">
        <SettingRow title="MuSheet" description="数字乐谱阅读器" control={<span className="text-sm text-fg-subtle tabular-nums">v{__APP_VERSION__}</span>} />
      </SettingGroup>
    </>
  );
}
