import type { PartView, ScoreSummary } from '@contract/api';
import { ChevronDown, ChevronLeft, Ellipsis, Info, ListMusic, Maximize, Minimize } from 'lucide-react';
import { useNavigate } from 'react-router';
import { partLabel } from '@/entity/part/instrument';
import { usePreferenceStore } from '@/feature/preference/preference-store';
import { useFullscreen } from '@/feature/performance-mode/use-fullscreen';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { cn } from '@/shared/lib/class-name';
import { useGoBack } from '@/shared/lib/use-go-back';
import { IconButton } from '@/shared/ui/button';
import { Menu, MenuCheckItem, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from '@/shared/ui/menu';
import { VIEWER_TEXT } from './viewer-text';

interface ViewerTopBarProps {
  score: ScoreSummary;
  part: PartView;
  visible: boolean;
  isSpreadAvailable: boolean;
  backFallback: string;
  setlistName?: string;
  onSwitchPart: (part: PartView) => void;
  onOpenSetlist?: () => void;
}

export function ViewerTopBar({ score, part, visible, isSpreadAvailable, backFallback, setlistName, onSwitchPart, onOpenSetlist }: ViewerTopBarProps) {
  const navigate = useNavigate();
  const goBack = useGoBack(backFallback);
  const fullscreen = useFullscreen();
  const text = useText(VIEWER_TEXT);
  const commonText = useText(COMMON_TEXT);
  const { nightScore, twoPageView, update } = usePreferenceStore();

  return (
    <header
      onPointerDown={event => event.stopPropagation()}
      className={cn(
        'pt-safe absolute inset-x-0 top-0 z-20 border-b border-border bg-surface/90 backdrop-blur transition-all duration-200',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        <IconButton label={commonText.back} onClick={goBack}><ChevronLeft /></IconButton>

        <div className="flex min-w-0 flex-1 justify-center">
          <Menu>
            <MenuTrigger asChild>
              <button type="button" className="min-w-0 max-w-full rounded-card px-3 py-1 text-center hover:bg-muted">
                <span className="flex items-center justify-center gap-1">
                  <span className="truncate text-body font-semibold">{score.title}</span>
                  {score.parts.length > 1 && <ChevronDown className="size-4 shrink-0 text-fg-subtle" />}
                </span>
                <span className="block truncate text-xs text-fg-muted">
                  {[score.composer, partLabel(part), setlistName].filter(Boolean).join(' · ')}
                </span>
              </button>
            </MenuTrigger>
            <MenuContent align="center">
              <MenuLabel>{text.switchPart}</MenuLabel>
              {score.parts.map(candidate => (
                <MenuCheckItem key={candidate.id} checked={candidate.id === part.id} onSelect={() => onSwitchPart(candidate)}>
                  {partLabel(candidate)}
                </MenuCheckItem>
              ))}
            </MenuContent>
          </Menu>
        </div>

        {onOpenSetlist && <IconButton label={commonText.setlist} onClick={onOpenSetlist}><ListMusic /></IconButton>}
        <Menu>
          <MenuTrigger asChild>
            <IconButton label={commonText.more}><Ellipsis /></IconButton>
          </MenuTrigger>
          <MenuContent>
            {fullscreen.isSupported && (
              <MenuItem icon={fullscreen.isFullscreen ? <Minimize /> : <Maximize />} onSelect={fullscreen.toggle}>
                {fullscreen.isFullscreen ? text.exitFullscreen : text.fullscreen}
              </MenuItem>
            )}
            {isSpreadAvailable && (
              <MenuCheckItem checked={twoPageView} onCheckedChange={checked => update({ twoPageView: checked })}>{text.twoPageView}</MenuCheckItem>
            )}
            <MenuCheckItem checked={nightScore} onCheckedChange={checked => update({ nightScore: checked })}>{text.nightScore}</MenuCheckItem>
            <MenuSeparator />
            <MenuItem icon={<Info />} onSelect={() => navigate(`/score/${score.id}`)}>{text.scoreDetails}</MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </header>
  );
}
