import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScreenId, ZoneId } from '../types';

interface GameState {
    currentScreen: ScreenId;
    previousScreen: ScreenId | null;
    transitionZone: ZoneId | null;
    showCRT: boolean;
    isLoading: boolean;

    // Actions
    navigateTo: (screen: ScreenId) => void;
    startZoneTransition: (zoneId: ZoneId) => void;
    toggleCRT: () => void;
    setLoading: (loading: boolean) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            currentScreen: 'landing',
            previousScreen: null,
            transitionZone: null,
            showCRT: true,
            isLoading: false,

            navigateTo: (screen) => {
                // Only clear transitionZone when leaving zone flow entirely
                const zoneFlowScreens: ScreenId[] = ['zone-transition', 'npc-encounter', 'reward'];
                const shouldKeepZone = zoneFlowScreens.includes(screen);
                set({
                    previousScreen: get().currentScreen,
                    currentScreen: screen,
                    transitionZone: shouldKeepZone ? get().transitionZone : null,
                });
            },

            startZoneTransition: (zoneId) =>
                set({
                    previousScreen: get().currentScreen,
                    currentScreen: 'zone-transition',
                    transitionZone: zoneId,
                }),

            toggleCRT: () => set({ showCRT: !get().showCRT }),
            setLoading: (loading) => set({ isLoading: loading }),
        }),
        {
            name: 'vq_settings',
            partialize: (state) => ({ showCRT: state.showCRT }),
        }
    )
);
