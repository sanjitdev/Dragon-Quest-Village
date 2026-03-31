// BossDragon.ts — Multi-phase cinematic boss fight
import { Enemy } from './Enemy.js';
import { EventBus, Events } from '../core/EventBus.js';
export class BossDragon extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss_dragon', { maxHealth: 500, attack: 30, defense: 15, speed: 90, luck: 5 }, [], 300, 50);
        this.phase = 1 /* DragonPhase.ONE */;
        this.fireBreathCooldown = 0;
        this.flyAttackCooldown = 0;
        this.summonCooldown = 0;
        this.minionCount = 0;
        this.maxMinions = 3;
        this.introComplete = false;
        this.detectionRange = 9999; // Always aggro
        this.attackRange = 120;
        this.patrolDistance = 200;
        this.sprite.body.setSize(80, 80);
        this.sprite.setScale(2);
    }
    // ── Cinematic intro ────────────────────────────────────────────────────────
    playIntro(onComplete) {
        this.sprite.setAlpha(0);
        this.sprite.setScale(0.5);
        EventBus.emit(Events.CAMERA_SHAKE);
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 1,
            scaleX: 2,
            scaleY: 2,
            duration: 1200,
            ease: 'Back.Out',
            onComplete: () => {
                this.introComplete = true;
                onComplete();
            },
        });
    }
    // ── Phase transitions ──────────────────────────────────────────────────────
    checkPhase() {
        const pct = this._health / this._maxHealth;
        let newPhase;
        if (pct <= 0.33)
            newPhase = 3 /* DragonPhase.THREE */;
        else if (pct <= 0.66)
            newPhase = 2 /* DragonPhase.TWO */;
        else
            newPhase = 1 /* DragonPhase.ONE */;
        if (newPhase !== this.phase) {
            this.phase = newPhase;
            EventBus.emit(Events.BOSS_PHASE_CHANGE, this.phase);
            EventBus.emit(Events.CAMERA_SHAKE);
            // Speed up with each phase
            this.stats.speed = 90 + (newPhase - 1) * 40;
        }
    }
    // ── Attacks ────────────────────────────────────────────────────────────────
    fireBreath(target) {
        if (!this._alive)
            return;
        this.isAttacking = true;
        this.attackTimer = 600;
        this.fireBreathCooldown = 3500;
        // Visual: spawn a fire projectile tween toward player
        const fire = this.scene.add.rectangle(this.sprite.x, this.sprite.y, 40, 20, 0xff4400, 0.9);
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
    flyAttack(target) {
        if (!this._alive)
            return;
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
    summonMinions() {
        if (this.minionCount >= this.maxMinions || !this.onSpawnMinion)
            return;
        this.summonCooldown = 8000;
        this.minionCount++;
        const spawnX = this.sprite.x + Phaser.Math.Between(-100, 100);
        this.onSpawnMinion(spawnX, this.sprite.y);
    }
    // ── Override AI ───────────────────────────────────────────────────────────
    updateAI(delta) {
        if (!this._alive || !this.introComplete)
            return;
        this.checkPhase();
        if (this.fireBreathCooldown > 0)
            this.fireBreathCooldown -= delta;
        if (this.flyAttackCooldown > 0)
            this.flyAttackCooldown -= delta;
        if (this.summonCooldown > 0)
            this.summonCooldown -= delta;
        if (!this.aggroTarget || !this.aggroTarget.isAlive)
            return;
        const dist = this.distanceTo(this.aggroTarget);
        // Phase 2+: fire breath
        if (this.phase >= 2 /* DragonPhase.TWO */ && this.fireBreathCooldown <= 0 && dist < 300) {
            this.fireBreath(this.aggroTarget);
            return;
        }
        // Phase 3: fly attack
        if (this.phase === 3 /* DragonPhase.THREE */ && this.flyAttackCooldown <= 0) {
            this.flyAttack(this.aggroTarget);
            return;
        }
        // Phase 2+: summon minions
        if (this.phase >= 2 /* DragonPhase.TWO */ && this.summonCooldown <= 0 && this.minionCount < this.maxMinions) {
            this.summonMinions();
        }
        // Standard chase/melee
        if (dist <= this.attackRange) {
            this.stopHorizontal();
            if (this.attackCooldown <= 0)
                this.doAttack(this.aggroTarget);
        }
        else {
            this.chaseTarget(this.aggroTarget);
        }
    }
    die() {
        super.die();
        EventBus.emit(Events.BOSS_DEFEATED, this);
    }
    onMinionDefeated() {
        if (this.minionCount > 0)
            this.minionCount--;
    }
}
//# sourceMappingURL=BossDragon.js.map