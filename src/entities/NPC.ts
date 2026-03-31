// NPC.ts — Non-player character with dialogue and optional shop

import { Entity } from './Entity.js';

export interface DialogueLine {
  speaker: string;
  text: string;
}

export class NPC extends Entity {
  readonly name: string;
  private dialogueLines: DialogueLine[];
  private dialogueIndex: number = 0;
  private nameLabel!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    name: string,
    dialogue: DialogueLine[]
  ) {
    super(scene, x, y, 9999); // NPCs don't die
    this.name          = name;
    this.dialogueLines = dialogue;

    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setImmovable(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

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

  nextDialogue(): DialogueLine | null {
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueIndex = 0;
      return null;
    }
    return this.dialogueLines[this.dialogueIndex++];
  }

  resetDialogue(): void {
    this.dialogueIndex = 0;
  }

  // ── Entity contract ───────────────────────────────────────────────────────

  override update(_time: number, _delta: number): void {
    // NPCs are static; no update logic needed
  }

  override destroy(): void {
    this.nameLabel?.destroy();
    super.destroy();
  }
}
