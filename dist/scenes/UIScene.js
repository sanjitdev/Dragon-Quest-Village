// UIScene.ts — Professional dark-fantasy RPG HUD overlay
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig } from '../core/GameConfig.js';
// ── HUD constants ──────────────────────────────────────────────────────────
const HUD = {
    FONT: '"Press Start 2P", monospace',
    BG: 0x08051A, // panel background
    BORDER: 0x8B6800, // dark gold border
    BORDER_HI: 0xC8A020, // bright gold highlight
    HP_FULL: 0xCC2200, // red hp bar
    HP_LOW: 0xFF4400, // orange when low
    XP_COLOR: 0x1A44AA, // xp bar
    TEXT_MAIN: '#F0DFA8', // warm cream
    TEXT_DIM: '#888866', // muted
    TEXT_GOLD: '#FFD700', // gold
    TEXT_HP: '#FF9988', // hp label
    TEXT_XP: '#8899FF', // xp label
    TEXT_QUEST: '#88EE88', // quest green
};
const W = GameConfig.WIDTH;
const H = GameConfig.HEIGHT;
export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.showingInv = false;
        // ── State ────────────────────────────────────────────────────────────────
        this.playerRef = null;
    }
    create() {
        this.buildTopBar();
        this.buildQuestPanel();
        this.buildNotification();
        this.buildInventoryPanel();
        this.buildHintBar();
        this.connectEvents();
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-I', () => this.toggleInventory());
        }
    }
    // ── TOP BAR ───────────────────────────────────────────────────────────────
    buildTopBar() {
        const barH = 52;
        // Panel bg
        this.add.rectangle(0, 0, W, barH, HUD.BG, 0.88).setOrigin(0).setDepth(90);
        // Gold border line at bottom of bar
        this.add.rectangle(0, barH - 1, W, 2, HUD.BORDER).setOrigin(0).setDepth(91);
        this.add.rectangle(0, barH, W, 1, HUD.BORDER_HI, 0.4).setOrigin(0).setDepth(91);
        // ── Portrait box (left)
        this.add.rectangle(8, 4, 44, 44, 0x0A0820).setOrigin(0).setDepth(91);
        this.add.rectangle(8, 4, 44, 44, 0x000000, 0).setOrigin(0)
            .setStrokeStyle(1, HUD.BORDER).setDepth(92);
        // Knight silhouette in portrait
        const pg = this.add.graphics().setDepth(93);
        pg.fillStyle(0x1A4A9C, 1);
        pg.fillRect(16, 20, 20, 18);
        pg.fillStyle(0xB8C4D4, 1);
        pg.fillRect(17, 10, 18, 13);
        pg.fillStyle(HUD.BG, 1);
        pg.fillRect(17, 15, 18, 5); // visor
        pg.fillStyle(0x44AAFF, 0.7);
        pg.fillRect(18, 16, 6, 2);
        pg.fillRect(26, 16, 6, 2);
        pg.fillStyle(0xCC2200, 1);
        pg.fillRect(22, 7, 4, 5);
        // ── HP bar (left, after portrait)
        const barX = 58, hpY = 8;
        this.add.text(barX, hpY, 'HP', {
            fontFamily: HUD.FONT, fontSize: '6px', color: HUD.TEXT_HP,
        }).setDepth(93);
        // Bar track
        this.add.rectangle(barX, hpY + 9, 160, 13, 0x000000, 0.7).setOrigin(0).setDepth(91);
        this.add.rectangle(barX, hpY + 9, 160, 13, 0x000000, 0)
            .setOrigin(0).setStrokeStyle(1, HUD.BORDER, 0.6).setDepth(92);
        // Fill
        this.hpFill = this.add.rectangle(barX + 1, hpY + 10, 158, 11, HUD.HP_FULL).setOrigin(0).setDepth(93);
        // Shine strip
        this.hpShine = this.add.rectangle(barX + 1, hpY + 10, 158, 3, 0xFFFFFF, 0.15).setOrigin(0).setDepth(94);
        // Segmented notches
        for (let s = 1; s < 10; s++) {
            this.add.rectangle(barX + s * 16, hpY + 9, 1, 13, 0x000000, 0.35).setOrigin(0).setDepth(95);
        }
        this.hpText = this.add.text(barX + 82, hpY + 11, '---', {
            fontFamily: HUD.FONT, fontSize: '5px', color: HUD.TEXT_MAIN,
        }).setOrigin(0.5, 0).setDepth(96);
        // ── XP bar
        const xpY = 28;
        this.add.text(barX, xpY, 'XP', {
            fontFamily: HUD.FONT, fontSize: '6px', color: HUD.TEXT_XP,
        }).setDepth(93);
        this.add.rectangle(barX, xpY + 9, 160, 9, 0x000000, 0.7).setOrigin(0).setDepth(91);
        this.xpFill = this.add.rectangle(barX + 1, xpY + 10, 0, 7, HUD.XP_COLOR).setOrigin(0).setDepth(93);
        this.xpText = this.add.text(barX + 82, xpY + 10, 'XP: 0', {
            fontFamily: HUD.FONT, fontSize: '5px', color: HUD.TEXT_XP,
        }).setOrigin(0.5, 0).setDepth(96);
        // ── Level badge
        this.levelBadge = this.add.text(barX + 166, hpY, 'LV 1', {
            fontFamily: HUD.FONT, fontSize: '7px', color: HUD.TEXT_MAIN,
        }).setDepth(93);
        // ── Gold (right side)
        // Coin icon
        const cg = this.add.graphics().setDepth(93);
        cg.fillStyle(0xCC8800, 1);
        cg.fillCircle(W - 90, 16, 8);
        cg.fillStyle(0xFFCC00, 1);
        cg.fillCircle(W - 90, 15, 7);
        cg.fillStyle(0xFFEE44, 1);
        cg.fillCircle(W - 91, 14, 4);
        cg.fillStyle(0xAA6600, 1);
        cg.fillCircle(W - 90, 15, 2);
        this.goldText = this.add.text(W - 78, 9, '0', {
            fontFamily: HUD.FONT, fontSize: '8px', color: HUD.TEXT_GOLD,
            stroke: '#1A0000', strokeThickness: 3,
        }).setDepth(93);
        // ── Totem slot
        this.add.rectangle(W - 92, 26, 80, 20, 0x0A0820, 0.8).setOrigin(0).setDepth(91);
        this.add.rectangle(W - 92, 26, 80, 20, 0x0A0820, 0)
            .setOrigin(0).setStrokeStyle(1, HUD.BORDER, 0.4).setDepth(92);
        this.totemSlot = this.add.text(W - 90, 28, '— no totem —', {
            fontFamily: HUD.FONT, fontSize: '5px', color: '#AA88FF',
        }).setDepth(93);
    }
    // ── QUEST PANEL (right side) ──────────────────────────────────────────────
    buildQuestPanel() {
        const PW = 150, PH = 80, PX = W - PW - 4, PY = 58;
        const bg = this.add.rectangle(0, 0, PW, PH, HUD.BG, 0.85).setOrigin(0);
        bg.setStrokeStyle(1, HUD.BORDER, 0.6);
        const title = this.add.text(6, 4, 'QUEST', {
            fontFamily: HUD.FONT, fontSize: '6px', color: HUD.TEXT_DIM,
        });
        const divider = this.add.rectangle(0, 14, PW, 1, HUD.BORDER, 0.4).setOrigin(0);
        this.questBody = this.add.text(6, 18, '', {
            fontFamily: HUD.FONT, fontSize: '5px', color: HUD.TEXT_QUEST,
            wordWrap: { width: PW - 12 },
        });
        this.questPanel = this.add.container(PX, PY, [bg, title, divider, this.questBody])
            .setDepth(92)
            .setVisible(false);
    }
    // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
    buildNotification() {
        this.notifBg = this.add.rectangle(W / 2, 74, 0, 22, HUD.BG, 0.9)
            .setDepth(108).setVisible(false);
        this.notifBg.setStrokeStyle(1, HUD.BORDER_HI, 0.7);
        this.notifText = this.add.text(W / 2, 74, '', {
            fontFamily: HUD.FONT,
            fontSize: '7px',
            color: '#FFEE88',
            stroke: '#1A0800',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(109).setVisible(false);
    }
    // ── INVENTORY PANEL ───────────────────────────────────────────────────────
    buildInventoryPanel() {
        const PW = 380, PH = 280;
        const PX = W / 2 - PW / 2, PY = H / 2 - PH / 2;
        const bg = this.add.rectangle(0, 0, PW, PH, HUD.BG, 0.96).setOrigin(0);
        bg.setStrokeStyle(2, HUD.BORDER_HI, 0.8);
        // Top ornament bar
        const topBar = this.add.rectangle(0, 0, PW, 24, 0x0F0B25, 1).setOrigin(0);
        const title = this.add.text(PW / 2, 12, '— INVENTORY —', {
            fontFamily: HUD.FONT, fontSize: '8px', color: HUD.TEXT_MAIN,
        }).setOrigin(0.5);
        // Divider
        const div = this.add.rectangle(2, 24, PW - 4, 1, HUD.BORDER).setOrigin(0);
        this.invPanel = this.add.container(PX, PY, [bg, topBar, title, div])
            .setDepth(200).setVisible(false);
    }
    renderInventory(player) {
        // Remove dynamic children (keep first 4 static children)
        while (this.invPanel.length > 4) {
            const child = this.invPanel.getAt(4);
            child.destroy();
            this.invPanel.removeAt(4);
        }
        const PW = 380;
        const items = player.inventory.items;
        if (items.length === 0) {
            this.invPanel.add(this.add.text(190, 140, 'No items', {
                fontFamily: HUD.FONT, fontSize: '8px', color: HUD.TEXT_DIM,
            }).setOrigin(0.5));
            return;
        }
        // Item grid: 6 per row
        items.forEach((item, i) => {
            const col = i % 6, row = Math.floor(i / 6);
            const ix = 14 + col * 58, iy = 30 + row * 58;
            const slot = this.add.rectangle(ix, iy, 48, 48, 0x0A0820, 1).setOrigin(0);
            slot.setStrokeStyle(1, 0x3A3A5A);
            const label = this.add.text(ix + 24, iy + 52, item.name.substring(0, 8), {
                fontFamily: HUD.FONT, fontSize: '4px', color: HUD.TEXT_DIM,
            }).setOrigin(0.5, 0);
            this.invPanel.add([slot, label]);
        });
        // Equipped info at bottom
        const wName = player.equippedWeapon?.name ?? 'None';
        const wAtk = player.equippedWeapon?.attackBonus ?? 0;
        const tName = player.equippedTotem?.name ?? 'None';
        const eqText = this.add.text(10, 248, `Weapon: ${wName}  ATK +${wAtk}    Totem: ${tName}`, {
            fontFamily: HUD.FONT, fontSize: '5px', color: '#8899CC',
        });
        this.invPanel.add(eqText);
        // Close hint
        this.invPanel.add(this.add.text(PW - 10, 8, '[I] CLOSE', {
            fontFamily: HUD.FONT, fontSize: '5px', color: HUD.TEXT_DIM,
        }).setOrigin(1, 0));
    }
    toggleInventory() {
        this.showingInv = !this.showingInv;
        this.invPanel.setVisible(this.showingInv);
        if (this.showingInv && this.playerRef)
            this.renderInventory(this.playerRef);
    }
    // ── HINT BAR (very bottom) ────────────────────────────────────────────────
    buildHintBar() {
        this.add.rectangle(0, H - 16, W, 16, 0x000000, 0.55).setOrigin(0).setDepth(89);
        this.add.text(W / 2, H - 8, '[←→] Move  [↑/X] Jump  [Z] Attack  [E] Interact  [I] Inventory  [M] Map', {
            fontFamily: HUD.FONT, fontSize: '5px', color: HUD.TEXT_DIM,
        }).setOrigin(0.5).setDepth(90);
    }
    // ── EVENTS ────────────────────────────────────────────────────────────────
    connectEvents() {
        EventBus.on(Events.UI_REFRESH, () => {
            if (this.playerRef)
                this.refresh(this.playerRef);
        });
        EventBus.on(Events.PLAYER_LEVELED_UP, (lvl) => {
            this.showNotification(`✦ Level Up!  Now Lv.${lvl} ✦`);
        });
        EventBus.on(Events.QUEST_COMPLETED, (q) => {
            const quest = q;
            this.showNotification(`Quest Done: ${quest.title}`);
        });
        EventBus.on(Events.ITEM_PICKED_UP, (item) => {
            const i = item;
            this.showNotification(`+ ${i.name}`);
        });
        EventBus.on(Events.GAME_SAVED, () => {
            this.showNotification('Game Saved');
        });
    }
    // ── PUBLIC API ────────────────────────────────────────────────────────────
    setPlayer(player) {
        this.playerRef = player;
        this.refresh(player);
    }
    refresh(player) {
        const hpPct = Math.max(0, player.health / player.maxHealth);
        const maxXP = player.level * 100;
        const xpPct = Math.min(1, player.experience / maxXP);
        // HP bar
        this.hpFill.width = Math.max(0, 158 * hpPct);
        this.hpShine.width = Math.max(0, 158 * hpPct);
        this.hpFill.setFillStyle(hpPct < 0.3 ? HUD.HP_LOW : HUD.HP_FULL);
        this.hpText.setText(`${player.health}/${player.maxHealth}`);
        // XP bar
        this.xpFill.width = Math.max(0, 158 * xpPct);
        this.xpText.setText(`${player.experience}/${maxXP}`);
        // Level
        this.levelBadge.setText(`LV ${player.level}`);
        // Gold
        this.goldText.setText(`${player.gold}`);
        // Totem
        this.totemSlot.setText(player.equippedTotem ? `[${player.equippedTotem.name}]` : '— no totem —');
        if (this.showingInv)
            this.renderInventory(player);
    }
    setQuestText(text) {
        if (!text) {
            this.questPanel.setVisible(false);
            return;
        }
        this.questBody.setText(text);
        this.questPanel.setVisible(true);
    }
    showNotification(msg) {
        const textW = msg.length * 7 + 20;
        this.notifBg.width = textW;
        this.notifBg.setVisible(true).setAlpha(1);
        this.notifText.setText(msg).setVisible(true).setAlpha(1);
        this.tweens.killTweensOf([this.notifText, this.notifBg]);
        this.tweens.add({
            targets: [this.notifText, this.notifBg],
            alpha: 0,
            y: '-=14',
            delay: 1800,
            duration: 600,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.notifText.setVisible(false).setY(74);
                this.notifBg.setVisible(false).setY(74);
            },
        });
    }
    update() { }
}
//# sourceMappingURL=UIScene.js.map