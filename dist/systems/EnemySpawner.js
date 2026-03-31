// EnemySpawner.ts — Object-pooled enemy spawning
import { Goblin, Skeleton, Bat, Slime } from '../entities/Enemy.js';
export class EnemySpawner {
    constructor(scene) {
        this.active = [];
        this.scene = scene;
    }
    spawn(type, x, y, player) {
        let enemy;
        switch (type) {
            case 'goblin':
                enemy = new Goblin(this.scene, x, y);
                break;
            case 'skeleton':
                enemy = new Skeleton(this.scene, x, y);
                break;
            case 'bat':
                enemy = new Bat(this.scene, x, y);
                break;
            case 'slime':
                enemy = new Slime(this.scene, x, y);
                break;
        }
        enemy.setTarget(player);
        this.active.push(enemy);
        return enemy;
    }
    spawnGroup(configs, player) {
        return configs.map(c => this.spawn(c.type, c.x, c.y, player));
    }
    update(time, delta) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const e = this.active[i];
            if (!e.isAlive) {
                this.active.splice(i, 1);
            }
            else {
                e.update(time, delta);
            }
        }
    }
    getActive() { return this.active; }
    destroyAll() {
        for (const e of this.active)
            e.destroy();
        this.active = [];
    }
}
//# sourceMappingURL=EnemySpawner.js.map