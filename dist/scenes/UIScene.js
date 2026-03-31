// UIScene.ts — Persistent HUD overlay (always on top)
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig } from '../core/GameConfig.js';
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.showingInventory = false;
        this.notificationBus = [];
        // We receive a reference to the active player via events / direct pass
        this.playerRef = null;
    }
    create() {
        this.setupHUD();
        this.setupInventoryPanel();
        this.setupInput();
        this.connectEvents();
    }
    // ── HUD elements ───────────────────────────────────────────────────────────
    setupHUD() {
        const W = GameConfig.WIDTH;
        // Health bar background
        this.add.rectangle(14, 14, 204, 18, 0x000000, 0.6).setOrigin(0).setDepth(100);
        this.healthBarFill = this.add.rectangle(16, 16, 200, 14, 0xee3322).setOrigin(0).setDepth(101);
        this.healthText = this.add.text(16, 32, 'HP: ---', {
            fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
        }).setDepth(102);
        // XP bar
        this.add.rectangle(14, 50, 204, 8, 0x000000, 0.5).setOrigin(0).setDepth(100);
        this.xpBarFill = this.add.rectangle(16, 51, 0, 6, 0x6666ff).setOrigin(0).setDepth(101);
        this.levelText = this.add.text(16, 60, 'LVL 1', {
            fontSize: '10px', color: '#aaaaff', fontFamily: 'monospace',
        }).setDepth(102);
        // Gold
        this.goldText = this.add.text(W - 10, 14, 'Gold: 0', {
            fontSize: '12px', color: '#ffee22',
            fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0).setDepth(102);
        // Totem
        this.totemText = this.add.text(W - 10, 30, '', {
            fontSize: '10px', color: '#ff88ff', fontFamily: 'monospace',
        }).setOrigin(1, 0).setDepth(102);
        // Quest tracker
        this.questText = this.add.text(14, GameConfig.HEIGHT - 14, '', {
            fontSize: '10px', color: '#88ff88',
            fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0, 1).setDepth(102);
        // Controls hint
        this.add.text(GameConfig.WIDTH / 2, GameConfig.HEIGHT - 12, '[←→] Move  [↑/X] Jump  [Z] Attack  [E] Interact  [I] Inventory  [M] Map', {
            fontSize: '9px', color: '#888888', fontFamily: 'monospace',
        }).setOrigin(0.5, 1).setDepth(102);
        // Notification text
        this.notifText = this.add.text(GameConfig.WIDTH / 2, 90, '', {
            fontSize: '13px', color: '#ffe033',
            fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(110).setVisible(false);
    }
    // ── Inventory panel ────────────────────────────────────────────────────────
    setupInventoryPanel() {
        const panelW = 360;
        const panelH = 260;
        const panelX = GameConfig.WIDTH / 2 - panelW / 2;
        const panelY = GameConfig.HEIGHT / 2 - panelH / 2;
        const bg = this.add.rectangle(panelW / 2, panelH / 2, panelW, panelH, 0x111122, 0.92)
            .setStrokeStyle(2, 0x9988ff);
        const title = this.add.text(panelW / 2, 14, '— INVENTORY —', {
            fontSize: '13px', color: '#aaccff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0);
        this.inventoryPanel = this.add.container(panelX, panelY, [bg, title])
            .setDepth(200)
            .setVisible(false);
    }
    renderInventory(player) {
        // Remove old item entries (keep bg=index 0, title=index 1)
        while (this.inventoryPanel.length > 2) {
            const child = this.inventoryPanel.getAt(2);
            child.destroy();
            this.inventoryPanel.removeAt(2);
        }
        const items = player.inventory.items;
        if (items.length === 0) {
            const empty = this.add.text(180, 130, 'Empty', {
                fontSize: '12px', color: '#666666', fontFamily: 'monospace',
            }).setOrigin(0.5);
            this.inventoryPanel.add(empty);
            return;
        }
        items.forEach((item, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const ix = 20 + col * 85;
            const iy = 36 + row * 50;
            const icon = this.add.rectangle(ix + 12, iy + 12, 24, 24, 0x334455)
                .setStrokeStyle(1, 0x6688bb);
            const name = this.add.text(ix, iy + 28, item.name, {
                fontSize: '8px', color: '#cccccc', fontFamily: 'monospace',
            });
            this.inventoryPanel.add([icon, name]);
        });
        // Equipped weapon / totem display
        const wLine = `Weapon: ${player.equippedWeapon?.name ?? 'None'}  ATK +${player.equippedWeapon?.attackBonus ?? 0}`;
        const tLine = `Totem:  ${player.equippedTotem?.name ?? 'None'}`;
        const eqText = this.add.text(10, 230, `${wLine}\n${tLine}`, {
            fontSize: '9px', color: '#88aaff', fontFamily: 'monospace',
        });
        this.inventoryPanel.add(eqText);
    }
    // ── Input ──────────────────────────────────────────────────────────────────
    setupInput() {
        if (!this.input.keyboard)
            return;
        this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        this.input.keyboard.on('keydown-I', () => {
            this.showingInventory = !this.showingInventory;
            this.inventoryPanel.setVisible(this.showingInventory);
            if (this.showingInventory && this.playerRef)
                this.renderInventory(this.playerRef);
        });
    }
    // ── Events ─────────────────────────────────────────────────────────────────
    connectEvents() {
        EventBus.on(Events.UI_REFRESH, () => {
            if (this.playerRef)
                this.refresh(this.playerRef);
        });
        EventBus.on(Events.PLAYER_LEVELED_UP, (lvl) => {
            this.showNotification(`Level Up! Now Lv. ${lvl}`);
        });
        EventBus.on(Events.QUEST_COMPLETED, (q) => {
            const quest = q;
            this.showNotification(`Quest Complete: ${quest.title}!`);
        });
        EventBus.on(Events.ITEM_PICKED_UP, (item) => {
            const i = item;
            this.showNotification(`Picked up: ${i.name}`);
        });
        EventBus.on(Events.GAME_SAVED, () => {
            this.showNotification('Game Saved.');
        });
    }
    /** Called by gameplay scenes to bind a player reference */
    setPlayer(player) {
        this.playerRef = player;
        this.refresh(player);
    }
    refresh(player) {
        const hpPct = player.health / player.maxHealth;
        const xpPct = 0; // simplified — full XP tracking in Player
        this.healthBarFill.width = Math.max(0, 200 * hpPct);
        this.healthText.setText(`HP: ${player.health} / ${player.maxHealth}`);
        this.xpBarFill.width = 200 * xpPct;
        this.levelText.setText(`LVL ${player.level}  XP: ${player.experience}`);
        this.goldText.setText(`Gold: ${player.gold}`);
        this.totemText.setText(player.equippedTotem ? `[${player.equippedTotem.name}]` : '');
        // Re-render inventory if open
        if (this.showingInventory)
            this.renderInventory(player);
    }
    setQuestText(text) {
        this.questText.setText(text);
    }
    showNotification(msg) {
        this.notifText.setText(msg).setVisible(true).setAlpha(1);
        this.tweens.killTweensOf(this.notifText);
        this.tweens.add({
            targets: this.notifText,
            alpha: 0,
            delay: 2000,
            duration: 700,
            onComplete: () => this.notifText.setVisible(false),
        });
    }
    update(_time, _delta) {
        // Periodically sync player if available (scenes replace each other)
        // The player reference must be passed in by gameplay scenes
    }
}
//# sourceMappingURL=UIScene.js.map