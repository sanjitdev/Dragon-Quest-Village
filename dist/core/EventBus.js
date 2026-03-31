// EventBus.ts — Lightweight global event emitter for decoupled system communication
class EventBusClass {
    constructor() {
        this.listeners = new Map();
    }
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    off(event, callback) {
        const cbs = this.listeners.get(event);
        if (!cbs)
            return;
        const idx = cbs.indexOf(callback);
        if (idx !== -1)
            cbs.splice(idx, 1);
    }
    emit(event, ...args) {
        const cbs = this.listeners.get(event);
        if (!cbs)
            return;
        // Iterate over a copy so handlers can safely call off()
        [...cbs].forEach(cb => cb(...args));
    }
    once(event, callback) {
        const wrapper = (...args) => {
            callback(...args);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
}
// Singleton export
export const EventBus = new EventBusClass();
// Typed event name constants to prevent magic strings
export const Events = {
    PLAYER_DAMAGED: 'player:damaged',
    PLAYER_DIED: 'player:died',
    PLAYER_LEVELED_UP: 'player:leveledUp',
    PLAYER_GAINED_XP: 'player:gainedXP',
    ENEMY_DAMAGED: 'enemy:damaged',
    ENEMY_DIED: 'enemy:died',
    BOSS_PHASE_CHANGE: 'boss:phaseChange',
    BOSS_DEFEATED: 'boss:defeated',
    ITEM_PICKED_UP: 'item:pickedUp',
    ITEM_EQUIPPED: 'item:equipped',
    GOLD_COLLECTED: 'gold:collected',
    QUEST_STARTED: 'quest:started',
    QUEST_UPDATED: 'quest:updated',
    QUEST_COMPLETED: 'quest:completed',
    SCENE_CHANGE: 'scene:change',
    GAME_OVER: 'game:over',
    GAME_SAVED: 'game:saved',
    UI_REFRESH: 'ui:refresh',
    CAMERA_SHAKE: 'camera:shake',
    LOOT_SPAWNED: 'loot:spawned',
};
//# sourceMappingURL=EventBus.js.map