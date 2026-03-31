// SceneManager.ts — Handles scene transitions with fade effects
import { EventBus, Events } from './EventBus.js';
export class SceneManager {
    constructor(game) {
        this.game = game;
    }
    /** Transition to a new scene with a brief fade, stopping all current gameplay scenes */
    transitionTo(currentScene, targetKey, data) {
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
    launchUI(scene) {
        if (!scene.scene.isActive('UIScene')) {
            scene.scene.launch('UIScene');
        }
    }
    /** Gracefully stop a scene */
    stopScene(scene, key) {
        if (scene.scene.isActive(key)) {
            scene.scene.stop(key);
        }
    }
}
//# sourceMappingURL=SceneManager.js.map