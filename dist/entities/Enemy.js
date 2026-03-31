// Enemy.ts — Base enemy class with AI states, patrol, and drop tables
import { Character } from './Character.js';
import { EventBus, Events } from '../core/EventBus.js';
export var EnemyState;
(function (EnemyState) {
    EnemyState["IDLE"] = "idle";
    EnemyState["PATROL"] = "patrol";
    EnemyState["CHASE"] = "chase";
    EnemyState["ATTACK"] = "attack";
    EnemyState["HURT"] = "hurt";
    EnemyState["DEAD"] = "dead";
})(EnemyState || (EnemyState = {}));
export class Enemy extends Character {
    constructor(scene, x, y, textureKey, stats, dropTable = [], xpReward = 20, goldReward = 5) {
        super(scene, x, y, stats);
        this.aiState = EnemyState.PATROL;
        this.detectionRange = 200;
        this.attackRange = 50;
        this.patrolDistance = 120;
        this.patrolDir = 1;
        this.aggroTarget = null;
        this.startX = x;
        this.dropTable = dropTable;
        this.xpReward = xpReward;
        this.goldReward = goldReward;
        this.animPrefix = textureKey;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(0);
        this.registerAnims(scene, textureKey);
        this.playAnim('idle');
    }
    // ── Animations ─────────────────────────────────────────────────────────────
    registerAnims(scene, prefix) {
        const anims = scene.anims;
        const defs = [
            { suffix: 'idle', frames: [0], frameRate: 4, repeat: -1 },
            { suffix: 'run', frames: [1, 2, 3], frameRate: 8, repeat: -1 },
            { suffix: 'attack', frames: [4, 5], frameRate: 10, repeat: 0 },
            { suffix: 'hurt', frames: [6], frameRate: 4, repeat: 0 },
            { suffix: 'death', frames: [7], frameRate: 4, repeat: 0 },
        ];
        for (const d of defs) {
            const key = `${prefix}_${d.suffix}`;
            if (!anims.exists(key)) {
                anims.create({
                    key,
                    frames: anims.generateFrameNumbers(prefix, { frames: d.frames }),
                    frameRate: d.frameRate,
                    repeat: d.repeat,
                });
            }
        }
    }
    // ── AI ─────────────────────────────────────────────────────────────────────
    setTarget(player) {
        this.aggroTarget = player;
    }
    updateAI(delta) {
        if (!this._alive)
            return;
        switch (this.aiState) {
            case EnemyState.IDLE:
                this.stopHorizontal();
                this.aiState = EnemyState.PATROL;
                break;
            case EnemyState.PATROL:
                this.doPatrol();
                if (this.aggroTarget && this.distanceTo(this.aggroTarget) < this.detectionRange) {
                    this.aiState = EnemyState.CHASE;
                }
                break;
            case EnemyState.CHASE:
                if (!this.aggroTarget || !this.aggroTarget.isAlive) {
                    this.aiState = EnemyState.PATROL;
                    return;
                }
                if (this.distanceTo(this.aggroTarget) <= this.attackRange) {
                    this.aiState = EnemyState.ATTACK;
                }
                else {
                    this.chaseTarget(this.aggroTarget);
                }
                break;
            case EnemyState.ATTACK:
                this.stopHorizontal();
                if (!this.aggroTarget || !this.aggroTarget.isAlive) {
                    this.aiState = EnemyState.PATROL;
                    return;
                }
                if (this.distanceTo(this.aggroTarget) > this.attackRange * 1.5) {
                    this.aiState = EnemyState.CHASE;
                    return;
                }
                if (this.attackCooldown <= 0) {
                    this.doAttack(this.aggroTarget);
                }
                break;
            case EnemyState.DEAD:
                break;
        }
    }
    doPatrol() {
        const body = this.sprite.body;
        body.setVelocityX(this.stats.speed * 0.4 * this.patrolDir);
        this.sprite.setFlipX(this.patrolDir < 0);
        const distFromStart = this.sprite.x - this.startX;
        if (Math.abs(distFromStart) >= this.patrolDistance) {
            this.patrolDir *= -1;
        }
    }
    chaseTarget(target) {
        const dir = target.x > this.sprite.x ? 1 : -1;
        const body = this.sprite.body;
        body.setVelocityX(this.stats.speed * 0.7 * dir);
        this.sprite.setFlipX(dir < 0);
    }
    doAttack(target) {
        this.isAttacking = true;
        this.attackTimer = 400;
        this.attackCooldown = 1200;
        target.takeDamage(this.stats.attack);
        target.applyKnockback(this.sprite.x, 160);
    }
    distanceTo(other) {
        return Math.abs(this.sprite.x - other.x);
    }
    // ── Override die ──────────────────────────────────────────────────────────
    die() {
        super.die();
        this.aiState = EnemyState.DEAD;
        EventBus.emit(Events.ENEMY_DIED, this);
        // Destroy sprite after death animation
        this.scene.time.delayedCall(600, () => this.destroy());
    }
    takeDamage(amount) {
        super.takeDamage(amount);
        EventBus.emit(Events.ENEMY_DAMAGED, this, amount);
        if (this._alive)
            this.aiState = EnemyState.CHASE;
    }
    // ── Update ─────────────────────────────────────────────────────────────────
    update(time, delta) {
        if (!this._alive)
            return;
        super.update(time, delta);
        this.updateAI(delta);
    }
}
// ── Concrete enemy subtypes ────────────────────────────────────────────────
export class Goblin extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'goblin', { maxHealth: 30, attack: 8, defense: 2, speed: 100, luck: 5 }, [{ itemId: 'potion_small', chance: 0.2 }, { itemId: 'short_sword', chance: 0.05 }], 15, 3);
        this.detectionRange = 180;
        this.attackRange = 45;
    }
}
export class Skeleton extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'skeleton', { maxHealth: 45, attack: 12, defense: 4, speed: 80, luck: 3 }, [{ itemId: 'potion_small', chance: 0.3 }, { itemId: 'bone_shield', chance: 0.08 }], 25, 5);
        this.patrolDistance = 160;
    }
}
export class Bat extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'bat', { maxHealth: 18, attack: 6, defense: 1, speed: 140, luck: 8 }, [{ itemId: 'gold_coin', chance: 0.6 }], 10, 2);
        this.detectionRange = 250;
        this.attackRange = 40;
        // Bats hover — no gravity
        this.sprite.body.setAllowGravity(false);
    }
    doPatrol() {
        // Bats float in a sine wave
        const body = this.sprite.body;
        body.setVelocityX(60 * this.patrolDir);
        this.sprite.y = this.startX + Math.sin(Date.now() / 500) * 30; // repurpose startX as startY for bats
        const distFromStart = this.sprite.x - this.startX;
        if (Math.abs(distFromStart) >= this.patrolDistance)
            this.patrolDir *= -1;
    }
}
export class Slime extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'slime', { maxHealth: 22, attack: 5, defense: 3, speed: 60, luck: 10 }, [{ itemId: 'potion_small', chance: 0.4 }, { itemId: 'gold_coin', chance: 0.5 }], 12, 3);
    }
}
//# sourceMappingURL=Enemy.js.map