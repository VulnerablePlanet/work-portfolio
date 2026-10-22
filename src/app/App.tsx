import { SessionController } from '@/app/session/SessionController';
import { useSessionStore } from '@/store/useSessionStore';
import { isFeatureEnabled } from '@/config/feature-flags';
import { ExperienceCanvas } from '@/scene/ExperienceCanvas';
import { Minimap } from '@/ui/hud/Minimap';
import { ProgressTracker } from '@/ui/hud/ProgressTracker';
import { DebugHud } from '@/ui/overlay/DebugHud';
import { MainMenu } from '@/ui/overlay/MainMenu';
import { Reticle } from '@/ui/overlay/Reticle';
import { SessionNotice } from '@/ui/overlay/SessionNotice';
import { FocusPanel } from '@/ui/panels/FocusPanel';

export function App() {
  const screen = useSessionStore((state) => state.screen);
  const look = useSessionStore((state) => state.look);
  const gameActive = screen === 'exploring' && look === 'pointer';

  return (
    <div className="app-shell" data-game-active={gameActive ? 'true' : 'false'}>
      <SessionController />
      <ExperienceCanvas />
      <Reticle />
      <MainMenu />
      <FocusPanel />
      {isFeatureEnabled('miniMap') ? <Minimap /> : null}
      {isFeatureEnabled('progressHud') ? <ProgressTracker /> : null}
      <SessionNotice />
      <DebugHud />
    </div>
  );
}
