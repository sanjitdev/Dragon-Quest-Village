// Entity.ts — Abstract base class for all game objects in the world
export class Entity {
    constructor(scene, x, y, health) {
        this._alive = true;
        this.id = `entity_${Math.random().toString(36).slice(2, 9)}`;
        this.scene = scene;
        this._health = health;
        this._maxHealth = health;
    }
    // ── Accessors ──────────────────────────────────────────────────────────────
    get health() { return this._health; }
    get maxHealth() { return this._maxHealth; }
    get isAlive() { return this._alive; }
    get x() { return this.sprite?.x ?? 0; }
    get y() { return this.sprite?.y ?? 0; }
    // ── Health helpers ─────────────────────────────────────────────────────────
    heal(amount) {
        if (!this._alive)
            return;
        this._health = Math.min(this._health + amount, this._maxHealth);
    }
    setHealth(value) {
        this._health = Phaser.Math.Clamp(value, 0, this._maxHealth);
        if (this._health <= 0)
            this.die();
    }
    die() {
        this._alive = false;
        this._health = 0;
    }
    destroy() {
        this._alive = false;
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
//# sourceMappingURL=Entity.js.map