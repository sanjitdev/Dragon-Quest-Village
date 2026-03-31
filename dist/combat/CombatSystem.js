// CombatSystem.ts — Mediates combat interactions between Characters
import { DamageCalculator } from './DamageCalculator.js';
import { GameConfig } from '../core/GameConfig.js';
export class CombatSystem {
    constructor(scene, lootSystem) {
        this.scene = scene;
        this.lootSystem = lootSystem;
    }
    // ── Player attacks enemy (called when player hitbox overlaps enemy) ─────────
    playerHitsEnemy(player, enemy) {
        if (!player.isAlive || !enemy.isAlive)
            return;
        if (!player['isAttacking'])
            return; // only deal damage during attack frames
        const result = DamageCalculator.calculate(player.totalAttack, enemy.defense, player.luck);
        enemy.takeDamage(result.amount);
        enemy.applyKnockback(player.x, GameConfig.KNOCKBACK_FORCE);
        this.showDamageNumber(enemy.x, enemy.y, result.amount, result.isCritical);
        if (!enemy.isAlive) {
            this.handleEnemyDeath(player, enemy);
        }
    }
    // ── Enemy touches player (contact damage) ─────────────────────────────────
    enemyHitsPlayer(enemy, player) {
        if (!player.isAlive || !enemy.isAlive || player['isHurt'])
            return;
        const result = DamageCalculator.calculate(enemy.attack, player.totalDefense, 0);
        player.takeDamage(result.amount);
        player.applyKnockback(enemy.x, GameConfig.KNOCKBACK_FORCE);
        this.showDamageNumber(player.x, player.y, result.amount, false, '#ff4444');
    }
    // ── Post-death rewards ─────────────────────────────────────────────────────
    handleEnemyDeath(player, enemy) {
        player.gainXP(enemy.xpReward);
        player.collectGold(enemy.goldReward);
        this.lootSystem.dropLoot(enemy, this.scene);
    }
    // ── Floating damage numbers ────────────────────────────────────────────────
    showDamageNumber(x, y, amount, isCrit, color = '#ffffff') {
        const style = {
            fontSize: isCrit ? '20px' : '14px',
            color: isCrit ? '#ffcc00' : color,
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 3,
        };
        const label = this.scene.add.text(x, y - 20, isCrit ? `CRIT! ${amount}` : `${amount}`, style)
            .setOrigin(0.5)
            .setDepth(100);
        this.scene.tweens.add({
            targets: label,
            y: y - 60,
            alpha: 0,
            duration: 700,
            ease: 'Power2',
            onComplete: () => label.destroy(),
        });
    }
}
//# sourceMappingURL=CombatSystem.js.map