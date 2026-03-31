// SceneManager.ts — Handles scene transitions with fade effects

import { EventBus, Events } from './EventBus.js';

export class SceneManager {
  private game: Phaser.Game;

  constructor(game: Phaser.Game) {
    this.game = game;
  }

  /** Transition to a new scene with a brief fade, stopping all current gameplay scenes */
  transitionTo(
    currentScene: Phaser.Scene,
    targetKey: string,
    data?: Record<string, unknown>
  ): void {
    currentScene.cameras.main.fadeOut(300, 0, 0, 0);

    currentScene.cameras.main.once('camerafadeoutcomplete', () => {
      // Stop parallel UI scene so it re-launches fresh with new scene
      if (currentScene.scene.isActive('UIScene')) {
        currentScene.scene.stop('UIScene');
      }
      currentScene.scene.start(targetKey, data);
      EventBus.emit(Events.SCENE_CHANGE, targetKey);
    });
  }

  /** Launch the UI overlay scene in parallel (idempotent) */
  launchUI(scene: Phaser.Scene): void {
    if (!scene.scene.isActive('UIScene')) {
      scene.scene.launch('UIScene');
    }
  }

  /** Gracefully stop a scene */
  stopScene(scene: Phaser.Scene, key: string): void {
    if (scene.scene.isActive(key)) {
      scene.scene.stop(key);
    }
  }
}
