// Character.ts — Adds movement, animation, and combat stats to Entity

import { Entity } from './Entity.js';

export interface CharacterStats {
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

export abstract class Character extends Entity {
  protected stats: CharacterStats;
  protected isOnGround: boolean = false;
  protected facingRight: boolean = true;
  protected attackCooldown: number = 0;
  protected isHurt: boolean = false;
  protected hurtTimer: number = 0;
  protected isAttacking: boolean = false;
  protected attackTimer: number = 0;

  // Animation key prefix — subclasses set this, e.g. 'player' or 'goblin'
  protected animPrefix: string = 'entity';

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: CharacterStats
  ) {
    super(scene, x, y, stats.maxHealth);
    this.stats = { ...stats };
    this._maxHealth = stats.maxHealth;
    this._health = stats.maxHealth;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get attack(): number { return this.stats.attack; }
  get defense(): number { return this.stats.defense; }
  get speed(): number { return this.stats.speed; }
  get luck(): number { return this.stats.luck; }

  // ── Movement ───────────────────────────────────────────────────────────────

  protected moveLeft(): void {
    if (!this._alive || this.isHurt) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-this.stats.speed);
    this.facingRight = false;
    this.sprite.setFlipX(true);
  }

  protected moveRight(): void {
    if (!this._alive || this.isHurt) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.stats.speed);
    this.facingRight = true;
    this.sprite.setFlipX(false);
  }

  protected stopHorizontal(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
  }

  protected jump(velocityY: number): void {
    if (!this._alive) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      body.setVelocityY(velocityY);
      this.isOnGround = false;
    }
  }

  // ── Damage & Death ─────────────────────────────────────────────────────────

  takeDamage(amount: number): void {
    if (!this._alive || this.isHurt) return;
    this._health = Math.max(0, this._health - amount);
    this.isHurt = true;
    this.hurtTimer = 300; // ms of invincibility flash

    // Visual flash
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.2,
      yoyo: true,
      repeat: 2,
      duration: 60,
      onComplete: () => { if (this.sprite) this.sprite.setAlpha(1); },
    });

    if (this._health <= 0) {
      this.die();
    }
  }

  protected override die(): void {
    super.die();
    this.sprite.setVelocity(0, 0);
    this.playAnim('death');
  }

  // ── Knockback ──────────────────────────────────────────────────────────────

  applyKnockback(fromX: number, force: number): void {
    if (!this._alive) return;
    const dir = this.sprite.x > fromX ? 1 : -1;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(dir * force);
    body.setVelocityY(-100);
  }

  // ── Animations ─────────────────────────────────────────────────────────────

  protected playAnim(action: string, ignoreIfPlaying = true): void {
    const key = `${this.animPrefix}_${action}`;
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, ignoreIfPlaying);
    }
  }

  protected updateAnimState(): void {
    if (!this._alive) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;

    if (this.isHurt)      { this.playAnim('hurt'); return; }
    if (this.isAttacking) { this.playAnim('attack'); return; }

    if (!body.blocked.down) {
      this.playAnim('jump', false);
    } else if (Math.abs(vx) > 10) {
      this.playAnim('run');
    } else {
      this.playAnim('idle');
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  override update(time: number, delta: number): void {
    if (!this._alive) return;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) this.isHurt = false;
    }

    if (this.isAttacking) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) this.isAttacking = false;
    }

    this.updateAnimState();
  }
}
