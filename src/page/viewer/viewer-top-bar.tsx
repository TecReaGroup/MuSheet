import type { PartView, ScoreSummary } from '@contract/api';
import { ChevronDown, ChevronLeft, Ellipsis, Info, ListMusic, Maximize, Minimize } from 'lucide-react';
import { useNavigate } from 'react-router';
import { partLabel } from '@/entity/part/instrument';
import { usePreferenceStore } from '@/feature/preference/preference-store';
import { useFullscreen } from '@/feature/performance-mode/use-fullscreen';
import { cn } from '@/shared/lib/class-name';
import { useGoBack } from '@/shared/lib/use-go-back';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuCheckItem, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';

interface ViewerTopBarProps {
  score: ScoreSummary;
  part: PartView;
  visible: boolean;
  backFallback: string;
  setlistName?: string;
  onSwitchPart: (part: PartView) => void;
  onOpenSetlist?: () => void;
}

export function ViewerTopBar({ score, part, visible, backFallback, setlistName, onSwitchPart, onOpenSetlist }: ViewerTopBarProps) {
  const navigate = useNavigate();
  const goBack = useGoBack(backFallback);
  const fullscreen = useFullscreen();
  const { nightScore, showAnnotation, pageTurn, update } = usePreferenceStore();

  return (
    <header
      onPointerDown={event => event.stopPropagation()}
      className={cn(
        'pt-safe absolute inset-x-0 top-0 z-20 border-b border-border bg-surface/90 backdrop-blur transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        <IconButton label="返回" onClick={goBack}><ChevronLeft /></IconButton>

        <div className="flex min-w-0 flex-1 justify-center">
          <Menu>
            <MenuTrigger asChild>
              <button type="button" className="min-w-0 max-w-full rounded-card px-3 py-1 text-center hover:bg-muted">
                <span className="flex items-center justify-center gap-1">
                  <span className="truncate text-[15px] font-semibold">{score.title}</span>
                  {score.parts.length > 1 && <ChevronDown className="size-4 shrink-0 text-fg-subtle" />}
                </span>
                <span className="block truncate text-xs text-fg-muted">
                  {[score.composer, partLabel(part), setlistName].filter(Boolean).join(' · ')}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent align="center">
              <MenuLabel>切换声部</MenuLabel>
              {score.parts.map(candidate => (
                <MenuCheckItem key={candidate.id} checked={candidate.id === part.id} onSelect={() => onSwitchPart(candidate)}>
                  {partLabel(candidate)}
                </MenuCheckItem>
              ))}
            </MenuContent>
          </Menu>
        </div>

        {onOpenSetlist && <IconButton label="曲目单" onClick={onOpenSetlist}><ListMusic /></IconButton>}
        <Menu>
          <MenuTrigger asChild>
            <IconButton label="更多"><Ellipsis /></IconButton>
          </MenuTrigger>
          <MenuContent>
            {fullscreen.isSupported && (
              <MenuItem icon={fullscreen.isFullscreen ? <Minimize /> : <Maximize />} onSelect={fullscreen.toggle}>
                {fullscreen.isFullscreen ? '退出全屏' : '全屏'}
              </MenuItem>
            )}
            <MenuCheckItem checked={pageTurn === 'half'} onCheckedChange={checked => update({ pageTurn: checked ? 'half' : 'page' })}>半页翻页</MenuCheckItem>
            <MenuCheckItem checked={nightScore} onCheckedChange={checked => update({ nightScore: checked })}>夜间乐谱</MenuCheckItem>
            <MenuCheckItem checked={showAnnotation} onCheckedChange={checked => update({ showAnnotation: checked })}>显示标注</MenuCheckItem>
            <MenuSeparator />
            <MenuItem icon={<Info />} onSelect={() => navigate(`/score/${score.id}`)}>乐曲详情</MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  );
}
