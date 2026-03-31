// CombatSystem.ts — Mediates combat interactions between Characters

import { Character } from '../entities/Character.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { DamageCalculator } from './DamageCalculator.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig } from '../core/GameConfig.js';
import { LootSystem } from '../systems/LootSystem.js';

export class CombatSystem {
  private scene: Phaser.Scene;
  private lootSystem: LootSystem;

  constructor(scene: Phaser.Scene, lootSystem: LootSystem) {
    this.scene      = scene;
    this.lootSystem = lootSystem;
  }

  // ── Player attacks enemy (called when player hitbox overlaps enemy) ─────────

  playerHitsEnemy(player: Player, enemy: Enemy): void {
    if (!player.isAlive || !enemy.isAlive) return;
    if (!player['isAttacking']) return; // only deal damage during attack frames

    const result = DamageCalculator.calculate(
      player.totalAttack,
      enemy.defense,
      player.luck
    );

    enemy.takeDamage(result.amount);
    enemy.applyKnockback(player.x, GameConfig.KNOCKBACK_FORCE);

    this.showDamageNumber(enemy.x, enemy.y, result.amount, result.isCritical);

    if (!enemy.isAlive) {
      this.handleEnemyDeath(player, enemy);
    }
  }

  // ── Enemy touches player (contact damage) ─────────────────────────────────

  enemyHitsPlayer(enemy: Enemy, player: Player): void {
    if (!player.isAlive || !enemy.isAlive || player['isHurt']) return;
    const result = DamageCalculator.calculate(
      enemy.attack,
      player.totalDefense,
      0
    );
    player.takeDamage(result.amount);
    player.applyKnockback(enemy.x, GameConfig.KNOCKBACK_FORCE);
    this.showDamageNumber(player.x, player.y, result.amount, false, '#ff4444');
  }

  // ── Post-death rewards ─────────────────────────────────────────────────────

  private handleEnemyDeath(player: Player, enemy: Enemy): void {
    player.gainXP(enemy.xpReward);
    player.collectGold(enemy.goldReward);
    this.lootSystem.dropLoot(enemy, this.scene);
  }

  // ── Floating damage numbers ────────────────────────────────────────────────

  private showDamageNumber(
    x: number,
    y: number,
    amount: number,
    isCrit: boolean,
    color: string = '#ffffff'
  ): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize:        isCrit ? '20px' : '14px',
      color:           isCrit ? '#ffcc00' : color,
      fontFamily:      'monospace',
      stroke:          '#000000',
      strokeThickness: 3,
    };
    const label = this.scene.add.text(x, y - 20, isCrit ? `CRIT! ${amount}` : `${amount}`, style)
      .setOrigin(0.5)
      .setDepth(100);

    this.scene.tweens.add({
      targets:  label,
      y:        y - 60,
      alpha:    0,
      duration: 700,
      ease:     'Power2',
      onComplete: () => label.destroy(),
    });
  }
}
