// EnemySpawner.ts — Object-pooled enemy spawning

import { Enemy, Goblin, Skeleton, Bat, Slime } from '../entities/Enemy.js';
import { Player } from '../entities/Player.js';

type EnemyType = 'goblin' | 'skeleton' | 'bat' | 'slime';

export class EnemySpawner {
  private scene: Phaser.Scene;
  private active: Enemy[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawn(type: EnemyType, x: number, y: number, player: Player): Enemy {
    let enemy: Enemy;
    switch (type) {
      case 'goblin':   enemy = new Goblin(this.scene, x, y);   break;
      case 'skeleton': enemy = new Skeleton(this.scene, x, y); break;
      case 'bat':      enemy = new Bat(this.scene, x, y);      break;
      case 'slime':    enemy = new Slime(this.scene, x, y);    break;
    }
    enemy.setTarget(player);
    this.active.push(enemy);
    return enemy;
  }

  spawnGroup(
    configs: Array<{ type: EnemyType; x: number; y: number }>,
    player: Player
  ): Enemy[] {
    return configs.map(c => this.spawn(c.type, c.x, c.y, player));
  }

  update(time: number, delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      if (!e.isAlive) {
        this.active.splice(i, 1);
      } else {
        e.update(time, delta);
      }
    }
  }

  getActive(): Enemy[] { return this.active; }

  destroyAll(): void {
    for (const e of this.active) e.destroy();
    this.active = [];
  }
}
