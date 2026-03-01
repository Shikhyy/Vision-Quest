import { useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { usePlayerStore } from './store/playerStore';
import Landing from './screens/Landing';
import CameraSetup from './screens/CameraSetup';
import VillageMap from './screens/VillageMap';
import ZoneTransition from './screens/ZoneTransition';
import NPCEncounter from './screens/NPCEncounter';
import RewardScreen from './screens/RewardScreen';
import PlayerProfile from './screens/PlayerProfile';
import Settings from './screens/Settings';
import LevelUpOverlay from './components/LevelUpOverlay';

// ── Screen Router ──
function ScreenRouter() {
  const currentScreen = useGameStore((s) => s.currentScreen);

  const screens: Record<string, React.ReactNode> = {
    'landing': <Landing />,
    'camera-setup': <CameraSetup />,
    'village-map': <VillageMap />,
    'zone-transition': <ZoneTransition />,
    'npc-encounter': <NPCEncounter />,
    'reward': <RewardScreen />,
    'player-profile': <PlayerProfile />,
    'settings': <Settings />,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', height: '100%' }}
      >
        {screens[currentScreen] || <Landing />}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main App ──
export default function App() {
  const showCRT = useGameStore((s) => s.showCRT);
  const navigateTo = useGameStore((s) => s.navigateTo);
  const currentScreen = useGameStore((s) => s.currentScreen);
  const level = usePlayerStore((s) => s.level);
  const title = usePlayerStore((s) => s.title);

  // Track level for level-up detection
  const [prevLevel, setPrevLevel] = useState(level);
  const [levelUpData, setLevelUpData] = useState<{
    prevLevel: number;
    newLevel: number;
    newTitle: string;
  } | null>(null);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 0) {
      setLevelUpData({ prevLevel, newLevel: level, newTitle: title });
    }
    setPrevLevel(level);
  }, [level, prevLevel, title]);

  // ── Keyboard shortcuts ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentScreen !== 'landing' && currentScreen !== 'village-map') {
          navigateTo('village-map');
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        if (currentScreen === 'village-map') {
          navigateTo('player-profile');
        }
      }
      if (e.key === 's' || e.key === 'S') {
        if (currentScreen === 'village-map') {
          navigateTo('settings');
        }
      }
    },
    [currentScreen, navigateTo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="game-viewport game-cursor">
      <ScreenRouter />
      {/* CRT Scanline Overlay */}
      {showCRT && <div className="crt-overlay" />}
      {/* Level Up Celebration */}
      {levelUpData && (
        <LevelUpOverlay
          prevLevel={levelUpData.prevLevel}
          newLevel={levelUpData.newLevel}
          newTitle={levelUpData.newTitle}
          onComplete={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}
