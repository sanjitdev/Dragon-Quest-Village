// Entity.ts — Abstract base class for all game objects in the world

export interface Updatable {
  update(time: number, delta: number): void;
}

export abstract class Entity implements Updatable {
  readonly id: string;
  protected scene: Phaser.Scene;
  sprite!: Phaser.Physics.Arcade.Sprite;

  protected _health: number;
  protected _maxHealth: number;
  protected _alive: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, health: number) {
    this.id = `entity_${Math.random().toString(36).slice(2, 9)}`;
    this.scene = scene;
    this._health = health;
    this._maxHealth = health;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get health(): number { return this._health; }
  get maxHealth(): number { return this._maxHealth; }
  get isAlive(): boolean { return this._alive; }

  get x(): number { return this.sprite?.x ?? 0; }
  get y(): number { return this.sprite?.y ?? 0; }

  // ── Health helpers ─────────────────────────────────────────────────────────

  heal(amount: number): void {
    if (!this._alive) return;
    this._health = Math.min(this._health + amount, this._maxHealth);
  }

  setHealth(value: number): void {
    this._health = Phaser.Math.Clamp(value, 0, this._maxHealth);
    if (this._health <= 0) this.die();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  abstract update(time: number, delta: number): void;

  protected die(): void {
    this._alive = false;
    this._health = 0;
  }

  destroy(): void {
    this._alive = false;
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
