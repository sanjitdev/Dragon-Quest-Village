// DamageCalculator.ts — Pure functions for damage math

import { Character } from '../entities/Character.js';

export interface DamageResult {
  amount:     number;
  isCritical: boolean;
}

export class DamageCalculator {
  /**
   * Standard melee damage formula with randomised variance and critical hits.
   * critical = roll < luck/100, capped at 25%.
   */
  static calculate(
    rawAttack: number,
    defense: number,
    luck: number
  ): DamageResult {
    const critChance = Math.min(0.25, luck / 100);
    const isCritical = Math.random() < critChance;

    // Variance ±20 %
    const variance = 0.8 + Math.random() * 0.4;
    const base     = Math.max(1, rawAttack - defense);
    let amount     = Math.round(base * variance);

    if (isCritical) amount = Math.round(amount * 2.0);

    return { amount, isCritical };
  }

  /** Projectile / elemental damage bypasses part of defense */
  static calculateMagical(
    rawPower: number,
    defense: number,
    luck: number
  ): DamageResult {
    // Magic penetrates 60% of defense
    return DamageCalculator.calculate(rawPower, defense * 0.4 | 0, luck);
  }
}
