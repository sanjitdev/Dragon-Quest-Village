// NPC.ts — Non-player character with dialogue and optional shop
import { Entity } from './Entity.js';
export class NPC extends Entity {
    constructor(scene, x, y, textureKey, name, dialogue) {
        super(scene, x, y, 9999); // NPCs don't die
        this.dialogueIndex = 0;
        this.name = name;
        this.dialogueLines = dialogue;
        this.sprite = scene.physics.add.sprite(x, y, textureKey);
        this.sprite.setImmovable(true);
        this.sprite.body.setAllowGravity(false);
        // Floating name
        this.nameLabel = scene.add.text(x, y - 40, name, {
            fontSize: '10px',
            color: '#ffe033',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);
        // Idle bob animation
        scene.tweens.add({
            targets: this.nameLabel,
            y: y - 46,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: 'Sine.InOut',
        });
    }
    // ── Dialogue ───────────────────────────────────────────────────────────────
    nextDialogue() {
        if (this.dialogueIndex >= this.dialogueLines.length) {
            this.dialogueIndex = 0;
            return null;
        }
        return this.dialogueLines[this.dialogueIndex++];
    }
    resetDialogue() {
        this.dialogueIndex = 0;
    }
    // ── Entity contract ───────────────────────────────────────────────────────
    update(_time, _delta) {
        // NPCs are static; no update logic needed
    }
    destroy() {
        this.nameLabel?.destroy();
        super.destroy();
    }
}
//# sourceMappingURL=NPC.js.map