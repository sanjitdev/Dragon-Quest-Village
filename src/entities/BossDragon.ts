// BossDragon.ts — Multi-phase cinematic boss fight

import { Character } from './Character.js';
import { Enemy, EnemyState } from './Enemy.js';
import { Player } from './Player.js';
import { EventBus, Events } from '../core/EventBus.js';

const enum DragonPhase { ONE = 1, TWO = 2, THREE = 3 }

export class BossDragon extends Enemy {
  phase: DragonPhase = DragonPhase.ONE;
  private fireBreathCooldown: number = 0;
  private flyAttackCooldown:  number = 0;
  private summonCooldown:     number = 0;
  private minionCount:        number = 0;
  private readonly maxMinions: number = 3;
  private introComplete:       boolean = false;

  /** Reference to onSpawnMinion callback — set by BossScene */
  onSpawnMinion?: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss_dragon',
      { maxHealth: 500, attack: 30, defense: 15, speed: 90, luck: 5 },
      [],
      300, 50
    );
    this.detectionRange = 9999; // Always aggro
    this.attackRange    = 120;
    this.patrolDistance = 200;
    (this.sprite.body as Phaser.Physics.Arcade.Body).setSize(80, 80);
    this.sprite.setScale(2);
  }

  // ── Cinematic intro ────────────────────────────────────────────────────────

  playIntro(onComplete: () => void): void {
    this.sprite.setAlpha(0);
    this.sprite.setScale(0.5);
    EventBus.emit(Events.CAMERA_SHAKE);

    this.scene.tweens.add({
      targets: this.sprite,
      alpha:   1,
      scaleX:  2,
      scaleY:  2,
      duration: 1200,
      ease: 'Back.Out',
      onComplete: () => {
        this.introComplete = true;
        onComplete();
      },
    });
  }

  // ── Phase transitions ──────────────────────────────────────────────────────

  private checkPhase(): void {
    const pct = this._health / this._maxHealth;
    let newPhase: DragonPhase;

    if (pct <= 0.33) newPhase = DragonPhase.THREE;
    else if (pct <= 0.66) newPhase = DragonPhase.TWO;
    else newPhase = DragonPhase.ONE;

    if (newPhase !== this.phase) {
      this.phase = newPhase;
      EventBus.emit(Events.BOSS_PHASE_CHANGE, this.phase);
      EventBus.emit(Events.CAMERA_SHAKE);
      // Speed up with each phase
      this.stats.speed = 90 + (newPhase - 1) * 40;
    }
  }

  // ── Attacks ────────────────────────────────────────────────────────────────

  fireBreath(target: Player): void {
    if (!this._alive) return;
    this.isAttacking   = true;
    this.attackTimer   = 600;
    this.fireBreathCooldown = 3500;

    // Visual: spawn a fire projectile tween toward player
    const fire = this.scene.add.rectangle(
      this.sprite.x,
      this.sprite.y,
      40, 20,
      0xff4400, 0.9
    );
    this.scene.tweens.add({
      targets: fire,
      x: target.x,
      y: target.y,
      duration: 400,
      onComplete: () => {
        fire.destroy();
        if (this.distanceTo(target) < 200) {
          target.takeDamage(this.stats.attack * 1.4 | 0);
          target.applyKnockback(this.sprite.x, 250);
        }
      },
    });
  }

  flyAttack(target: Player): void {
    if (!this._alive) return;
    this.flyAttackCooldown = 5000;
    const origY = this.sprite.y;

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 160,
      duration: 400,
      yoyo: false,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          x: target.x,
          y: target.y - 20,
          duration: 350,
          onComplete: () => {
            target.takeDamage(this.stats.attack * 1.6 | 0);
            target.applyKnockback(this.sprite.x, 300);
            EventBus.emit(Events.CAMERA_SHAKE);
            this.scene.tweens.add({
              targets: this.sprite,
              y: origY,
              duration: 300,
            });
          },
        });
      },
    });
  }

  summonMinions(): void {
    if (this.minionCount >= this.maxMinions || !this.onSpawnMinion) return;
    this.summonCooldown = 8000;
    this.minionCount++;
    const spawnX = this.sprite.x + Phaser.Math.Between(-100, 100);
    this.onSpawnMinion(spawnX, this.sprite.y);
  }

  // ── Override AI ───────────────────────────────────────────────────────────

  protected override updateAI(delta: number): void {
    if (!this._alive || !this.introComplete) return;
    this.checkPhase();

    if (this.fireBreathCooldown > 0) this.fireBreathCooldown -= delta;
    if (this.flyAttackCooldown  > 0) this.flyAttackCooldown  -= delta;
    if (this.summonCooldown     > 0) this.summonCooldown     -= delta;

    if (!this.aggroTarget || !this.aggroTarget.isAlive) return;

    const dist = this.distanceTo(this.aggroTarget);

    // Phase 2+: fire breath
    if (this.phase >= DragonPhase.TWO && this.fireBreathCooldown <= 0 && dist < 300) {
      this.fireBreath(this.aggroTarget);
      return;
    }

    // Phase 3: fly attack
    if (this.phase === DragonPhase.THREE && this.flyAttackCooldown <= 0) {
      this.flyAttack(this.aggroTarget);
      return;
    }

    // Phase 2+: summon minions
    if (this.phase >= DragonPhase.TWO && this.summonCooldown <= 0 && this.minionCount < this.maxMinions) {
      this.summonMinions();
    }

    // Standard chase/melee
    if (dist <= this.attackRange) {
      this.stopHorizontal();
      if (this.attackCooldown <= 0) this.doAttack(this.aggroTarget);
    } else {
      this.chaseTarget(this.aggroTarget);
    }
  }

  protected override die(): void {
    super.die();
    EventBus.emit(Events.BOSS_DEFEATED, this);
  }

  onMinionDefeated(): void {
    if (this.minionCount > 0) this.minionCount--;
  }
}
