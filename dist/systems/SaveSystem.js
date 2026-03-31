// SaveSystem.ts — Persists and loads player state via localStorage
import { EventBus, Events } from '../core/EventBus.js';
const SAVE_KEY = 'dqv_save';
export class SaveSystem {
    save(player, unlockedZones) {
        const state = {
            playerData: player.getSaveData(),
            unlockedZones,
            savedAt: Date.now(),
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            EventBus.emit(Events.GAME_SAVED);
        }
        catch {
            console.warn('[SaveSystem] Could not write to localStorage.');
        }
    }
    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw)
                return null;
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }
    deleteSave() {
        localStorage.removeItem(SAVE_KEY);
    }
}
//# sourceMappingURL=SaveSystem.js.map