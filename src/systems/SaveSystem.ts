// SaveSystem.ts — Persists and loads player state via localStorage

import { Player, PlayerSaveData } from '../entities/Player.js';
import { EventBus, Events } from '../core/EventBus.js';
import { ZoneId } from '../core/GameConfig.js';

const SAVE_KEY = 'dqv_save';

export interface GameSaveState {
  playerData:      PlayerSaveData;
  unlockedZones:   ZoneId[];
  savedAt:         number;
}

export class SaveSystem {
  save(player: Player, unlockedZones: ZoneId[]): void {
    const state: GameSaveState = {
      playerData:    player.getSaveData(),
      unlockedZones,
      savedAt:       Date.now(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      EventBus.emit(Events.GAME_SAVED);
    } catch {
      console.warn('[SaveSystem] Could not write to localStorage.');
    }
  }

  load(): GameSaveState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameSaveState;
    } catch {
      return null;
    }
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
