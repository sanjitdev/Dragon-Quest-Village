// Character.ts — Adds movement, animation, and combat stats to Entity
import { Entity } from './Entity.js';
export class Character extends Entity {
    constructor(scene, x, y, stats) {
        super(scene, x, y, stats.maxHealth);
        this.isOnGround = false;
        this.facingRight = true;
        this.attackCooldown = 0;
        this.isHurt = false;
        this.hurtTimer = 0;
        this.isAttacking = false;
        this.attackTimer = 0;
        // Animation key prefix — subclasses set this, e.g. 'player' or 'goblin'
        this.animPrefix = 'entity';
        this.stats = { ...stats };
        this._maxHealth = stats.maxHealth;
        this._health = stats.maxHealth;
    }
    // ── Accessors ──────────────────────────────────────────────────────────────
    get attack() { return this.stats.attack; }
    get defense() { return this.stats.defense; }
    get speed() { return this.stats.speed; }
    get luck() { return this.stats.luck; }
    // ── Movement ───────────────────────────────────────────────────────────────
    moveLeft() {
        if (!this._alive || this.isHurt)
            return;
        const body = this.sprite.body;
        body.setVelocityX(-this.stats.speed);
        this.facingRight = false;
        this.sprite.setFlipX(true);
    }
    moveRight() {
        if (!this._alive || this.isHurt)
            return;
        const body = this.sprite.body;
        body.setVelocityX(this.stats.speed);
        this.facingRight = true;
        this.sprite.setFlipX(false);
    }
    stopHorizontal() {
        const body = this.sprite.body;
        body.setVelocityX(0);
    }
    jump(velocityY) {
        if (!this._alive)
            return;
        const body = this.sprite.body;
        if (body.blocked.down) {
            body.setVelocityY(velocityY);
            this.isOnGround = false;
        }
    }
    // ── Damage & Death ─────────────────────────────────────────────────────────
    takeDamage(amount) {
        if (!this._alive || this.isHurt)
            return;
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
            onComplete: () => { if (this.sprite)
                this.sprite.setAlpha(1); },
        });
        if (this._health <= 0) {
            this.die();
        }
    }
    die() {
        super.die();
        this.sprite.setVelocity(0, 0);
        this.playAnim('death');
    }
    // ── Knockback ──────────────────────────────────────────────────────────────
    applyKnockback(fromX, force) {
        if (!this._alive)
            return;
        const dir = this.sprite.x > fromX ? 1 : -1;
        const body = this.sprite.body;
        body.setVelocityX(dir * force);
        body.setVelocityY(-100);
    }
    // ── Animations ─────────────────────────────────────────────────────────────
    playAnim(action, ignoreIfPlaying = true) {
        const key = `${this.animPrefix}_${action}`;
        if (this.scene.anims.exists(key)) {
            this.sprite.play(key, ignoreIfPlaying);
        }
    }
    updateAnimState() {
        if (!this._alive)
            return;
        const body = this.sprite.body;
        const vx = body.velocity.x;
        const vy = body.velocity.y;
        if (this.isHurt) {
            this.playAnim('hurt');
            return;
        }
        if (this.isAttacking) {
            this.playAnim('attack');
            return;
        }
        if (!body.blocked.down) {
            this.playAnim('jump', false);
        }
        else if (Math.abs(vx) > 10) {
            this.playAnim('run');
        }
        else {
            this.playAnim('idle');
        }
    }
    // ── Update ─────────────────────────────────────────────────────────────────
    update(time, delta) {
        if (!this._alive)
            return;
        if (this.attackCooldown > 0)
            this.attackCooldown -= delta;
        if (this.isHurt) {
            this.hurtTimer -= delta;
            if (this.hurtTimer <= 0)
                this.isHurt = false;
        }
        if (this.isAttacking) {
            this.attackTimer -= delta;
            if (this.attackTimer <= 0)
                this.isAttacking = false;
        }
        this.updateAnimState();
    }
}
//# sourceMappingURL=Character.js.map