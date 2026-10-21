import { ExperienceCanvas } from '@/scene/ExperienceCanvas';
import { useAppStore } from '@/store/useAppStore';
import { isFeatureEnabled } from '@/config/feature-flags';
import { DebugHud } from '@/ui/overlay/DebugHud';
import { MainMenu } from '@/ui/overlay/MainMenu';
import { Reticle } from '@/ui/overlay/Reticle';
import { Minimap } from '@/ui/hud/Minimap';
import { ProgressTracker } from '@/ui/hud/ProgressTracker';
import { FocusPanel } from '@/ui/panels/FocusPanel';

export function App() {
  const pointerLockActive = useAppStore((state) => state.pointerLockActive);
  const fallbackLookActive = useAppStore((state) => state.fallbackLookActive);
  const gamePaused = useAppStore((state) => state.gamePaused);
  const gameActive = !gamePaused && (pointerLockActive || fallbackLookActive);

  return (
    <div className="app-shell" data-game-active={gameActive ? 'true' : 'false'}>
      <ExperienceCanvas />
      <Reticle />
      <MainMenu />
      <FocusPanel />
      {isFeatureEnabled('miniMap') ? <Minimap /> : null}
      {isFeatureEnabled('progressHud') ? <ProgressTracker /> : null}
      <DebugHud />
    </div>
  );
}
