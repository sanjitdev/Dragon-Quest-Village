// BootScene.ts — Splash screen + procedural pixel-art texture generation
import { GameConfig } from '../core/GameConfig.js';
// ── Color palettes ─────────────────────────────────────────────────────────
const P = {
    // Knight (player)
    KH: 0xB8C4D4, KH2: 0x8898AC, // helmet silver
    KV: 0x081828, // visor dark
    KE: 0x44AAFF, // eye glow
    KB: 0x1A4A9C, KB2: 0x0A2A6C, KB3: 0x3A6ACC, // armor blue
    KG: 0xC8941C, // gold belt/trim
    KP: 0x223344, KP2: 0x111E2C, // pants
    KS: 0x2A1408, KS2: 0x180A04, // boots
    KW: 0xD0D8E0, KW2: 0xA0A8B0, // weapon silver
    KL: 0xE8F0FF, // highlight
    // Goblin
    GS: 0x2C8B3A, GS2: 0x1A5C24, GS3: 0x50C860, // skin
    GE: 0xFF2200, // eyes
    GC: 0x6B1E8B, GC2: 0x3D0F55, // clothing purple
    GT: 0x8B6018, // tusks
    // Skeleton
    SB: 0xD8CCA8, SB2: 0xA89878, SB3: 0xF0E8C8, // bone
    SE: 0x0A0A1A, // eye sockets
    SR: 0x882222, // eye glow red
    // Bat
    BW: 0x1A0830, BW2: 0x0A0420, // wing dark
    BB: 0x2E1050, BB2: 0x1E0838, // body
    BE: 0xFF4400, // eye
    // Slime
    SLS: 0x00B8A8, SLS2: 0x007870, SLS3: 0x60EEE0, // slime body
    SLE: 0x003830, // slime eyes
    // Boss Dragon
    DR: 0x8B0000, DR2: 0x5A0000, DR3: 0xCC2200, // scales
    DB: 0xAA4400, DB2: 0x883300, // belly
    DW: 0x440000, // wing
    DE: 0xFFEE00, // eyes
    DH: 0xFF2200, // horns
    // Tiles
    TG1: 0x5A8A32, TG2: 0x3D6420, TG3: 0x2A4A14, // grass
    TD1: 0x8B6340, TD2: 0x6B4828, TD3: 0x4A3018, // dirt/ground
    TW1: 0x5A5A6A, TW2: 0x3A3A4A, TW3: 0x8A8A9A, // wall stone
    TC1: 0x1A1A2A, TC2: 0x2A2A3A, TC3: 0x3A3A5A, // cave stone
    // NPC colors
    NE: 0xD4967A,
    NS: 0x5A4030,
    NM: 0x2A7A2A,
    SKIN: 0xFFCCAA,
};
export class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }
    preload() {
        this.createSplashScreen();
        this.generateTextures();
    }
    create() {
        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('VillageScene');
        });
    }
    // ── Splash screen ──────────────────────────────────────────────────────────
    createSplashScreen() {
        const { WIDTH, HEIGHT } = GameConfig;
        const cx = WIDTH / 2;
        this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x050310).setOrigin(0);
        for (let i = 0; i < 80; i++) {
            const sx = Phaser.Math.Between(0, WIDTH);
            const sy = Phaser.Math.Between(0, HEIGHT * 0.7);
            const size = Math.random() < 0.15 ? 2 : 1;
            const alpha = 0.3 + Math.random() * 0.7;
            this.add.rectangle(sx, sy, size, size, 0xFFFFFF, alpha);
        }
        const dg = this.add.graphics();
        this.drawDragonSilhouette(dg, cx, HEIGHT * 0.42);
        this.add.rectangle(cx, HEIGHT * 0.3, 500, 120, 0x440010, 0.5);
        this.add.text(cx, HEIGHT * 0.26, 'DRAGON QUEST', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '22px',
            color: '#FFD700',
            stroke: '#3A0000',
            strokeThickness: 6,
            shadow: { offsetX: 3, offsetY: 3, color: '#FF2200', blur: 12, fill: true },
        }).setOrigin(0.5);
        this.add.text(cx, HEIGHT * 0.36, 'VILLAGE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '30px',
            color: '#FF4422',
            stroke: '#1A0000',
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#FF8800', blur: 16, fill: true },
        }).setOrigin(0.5);
        this.add.rectangle(cx, HEIGHT * 0.82, 404, 24, 0x1A0830).setOrigin(0.5);
        this.add.rectangle(cx, HEIGHT * 0.82, 400, 20, 0x0A0820).setOrigin(0.5);
        const bar = this.add.rectangle(cx - 199, HEIGHT * 0.82, 0, 16, 0xCC4400).setOrigin(0, 0.5);
        this.add.text(cx, HEIGHT * 0.91, 'LOADING...', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '8px', color: '#554444',
        }).setOrigin(0.5);
        this.add.text(cx, HEIGHT * 0.72, '— Press Enter to Begin —', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px', color: '#887766',
        }).setOrigin(0.5);
        this.load.on('progress', (v) => { bar.width = 398 * v; });
    }
    drawDragonSilhouette(g, cx, cy) {
        g.fillStyle(0x220010, 0.6);
        g.fillEllipse(cx, cy, 200, 80);
        g.fillEllipse(cx + 90, cy - 20, 70, 50);
        g.fillTriangle(cx + 140, cy - 20, cx + 160, cy - 10, cx + 130, cy);
        g.fillTriangle(cx + 80, cy - 44, cx + 72, cy - 80, cx + 92, cy - 44);
        g.fillTriangle(cx + 100, cy - 44, cx + 96, cy - 72, cx + 112, cy - 44);
        g.fillStyle(0x180008, 0.5);
        g.fillTriangle(cx - 30, cy - 10, cx - 160, cy - 100, cx + 20, cy + 10);
        g.fillTriangle(cx - 50, cy, cx - 130, cy + 60, cx - 10, cy + 30);
        g.fillStyle(0x220010, 0.5);
        g.fillTriangle(cx - 100, cy + 20, cx - 200, cy + 50, cx - 90, cy + 40);
        g.fillStyle(0xFF4400, 0.9);
        g.fillCircle(cx + 120, cy - 22, 5);
        g.fillStyle(0xFFAA00, 1);
        g.fillCircle(cx + 120, cy - 22, 2);
    }
    // ── Texture generation ─────────────────────────────────────────────────────
    generateTextures() {
        this.makePlayerSheet();
        this.makeGoblinSheet();
        this.makeSkeletonSheet();
        this.makeBatSheet();
        this.makeSlimeSheet();
        this.makeDragonSheet();
        this.makeGroundTile();
        this.makeWallTile();
        this.makeCaveTile();
        this.makeItemSheet();
        this.makeNPCSheets();
        this.makeParticle();
    }
    // ── PLAYER ─────────────────────────────────────────────────────────────────
    makePlayerSheet() {
        if (this.textures.exists('player'))
            return;
        const W = 32, H = 48, FRAMES = 10;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const legOff = this.getRunLegOffset(f);
            g.fillStyle(0x000000, 0.25);
            g.fillEllipse(ox + 16, H - 2, 18, 5);
            // Left leg
            g.fillStyle(P.KP2, 1);
            g.fillRect(ox + 9, 32 + legOff, 7, 10);
            g.fillStyle(P.KP, 1);
            g.fillRect(ox + 9, 30 + legOff, 7, 8);
            // Right leg
            g.fillStyle(P.KP2, 1);
            g.fillRect(ox + 16, 32 - legOff, 7, 10);
            g.fillStyle(P.KP, 1);
            g.fillRect(ox + 16, 30 - legOff, 7, 8);
            // Boots
            g.fillStyle(P.KS2, 1);
            g.fillRect(ox + 8, 40 + legOff, 8, 5);
            g.fillStyle(P.KS2, 1);
            g.fillRect(ox + 16, 40 - legOff, 8, 5);
            g.fillStyle(P.KS, 1);
            g.fillRect(ox + 8, 38 + legOff, 8, 4);
            g.fillStyle(P.KS, 1);
            g.fillRect(ox + 16, 38 - legOff, 8, 4);
            // Body armor
            g.fillStyle(P.KB2, 1);
            g.fillRect(ox + 8, 16, 16, 16);
            g.fillStyle(P.KB, 1);
            g.fillRect(ox + 9, 15, 14, 14);
            g.fillStyle(P.KB3, 1);
            g.fillRect(ox + 10, 15, 5, 6);
            // Shoulder plates
            g.fillStyle(P.KH2, 1);
            g.fillRect(ox + 6, 16, 4, 6);
            g.fillRect(ox + 22, 16, 4, 6);
            g.fillStyle(P.KH, 1);
            g.fillRect(ox + 6, 15, 4, 5);
            g.fillRect(ox + 22, 15, 4, 5);
            // Belt
            g.fillStyle(P.KG, 1);
            g.fillRect(ox + 8, 29, 16, 3);
            g.fillStyle(0xFFFFAA, 1);
            g.fillRect(ox + 14, 29, 4, 3);
            // Arms
            if (f === 6 || f === 7) {
                g.fillStyle(P.KH2, 1);
                g.fillRect(ox + 22, 18, 5, 10);
                g.fillStyle(P.KW2, 1);
                g.fillRect(ox + 26, 10, 4, 22);
                g.fillStyle(P.KW, 1);
                g.fillRect(ox + 27, 8, 2, 20);
                g.fillStyle(P.KG, 1);
                g.fillRect(ox + 24, 18, 8, 3);
            }
            else {
                g.fillStyle(P.KH2, 1);
                g.fillRect(ox + 5, 18, 5, 9);
                g.fillRect(ox + 22, 18, 5, 9);
                g.fillStyle(P.KW2, 1);
                g.fillRect(ox + 5, 28, 3, 12);
                g.fillStyle(P.KW, 1);
                g.fillRect(ox + 6, 27, 2, 10);
                g.fillStyle(P.KG, 1);
                g.fillRect(ox + 3, 28, 6, 2);
            }
            // Helmet
            g.fillStyle(P.KH2, 1);
            g.fillRect(ox + 7, 4, 18, 15);
            g.fillStyle(P.KH, 1);
            g.fillRect(ox + 8, 3, 16, 13);
            g.fillStyle(P.KL, 1);
            g.fillRect(ox + 9, 3, 6, 4);
            // Plume
            g.fillStyle(0xCC2200, 1);
            g.fillRect(ox + 14, 0, 4, 5);
            g.fillStyle(0xFF4400, 1);
            g.fillRect(ox + 15, 0, 2, 4);
            // Visor
            g.fillStyle(P.KV, 1);
            g.fillRect(ox + 8, 9, 16, 4);
            if (f !== 9) {
                g.fillStyle(P.KE, 1);
                g.fillRect(ox + 9, 10, 5, 2);
                g.fillRect(ox + 18, 10, 5, 2);
            }
            g.fillStyle(P.KH2, 1);
            g.fillRect(ox + 8, 14, 16, 3);
            if (f === 8) {
                g.fillStyle(0xFF4444, 0.35);
                g.fillRect(ox, 0, W, H);
            }
        }
        g.generateTexture('player', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('player');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    getRunLegOffset(frame) {
        return [0, 0, 6, 0, -6, 4, 0, 0, -3, 0][frame] ?? 0;
    }
    // ── GOBLIN ─────────────────────────────────────────────────────────────────
    makeGoblinSheet() {
        if (this.textures.exists('goblin'))
            return;
        const W = 28, H = 36, FRAMES = 8;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const legOff = (f >= 1 && f <= 3) ? [6, 0, -6][f - 1] ?? 0 : 0;
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(ox + 14, H - 1, 16, 4);
            g.fillStyle(P.GC2, 1);
            g.fillRect(ox + 7, 22 + legOff, 6, 10);
            g.fillStyle(P.GC2, 1);
            g.fillRect(ox + 15, 22 - legOff, 6, 10);
            g.fillStyle(0x1A0E04, 1);
            g.fillRect(ox + 6, 30 + legOff, 7, 4);
            g.fillRect(ox + 14, 30 - legOff, 7, 4);
            g.fillStyle(P.GC2, 1);
            g.fillRect(ox + 6, 13, 16, 12);
            g.fillStyle(P.GC, 1);
            g.fillRect(ox + 7, 12, 14, 11);
            g.fillStyle(P.GC2, 1);
            g.fillRect(ox + 6, 22, 3, 3);
            g.fillRect(ox + 12, 22, 3, 3);
            g.fillRect(ox + 18, 22, 4, 3);
            if (f === 5 || f === 6) {
                g.fillStyle(P.GS2, 1);
                g.fillRect(ox + 2, 14, 6, 10);
                g.fillStyle(P.GS, 1);
                g.fillRect(ox + 2, 14, 5, 8);
                g.fillStyle(P.GS3, 1);
                g.fillRect(ox + 1, 22, 3, 5);
            }
            else {
                g.fillStyle(P.GS2, 1);
                g.fillRect(ox + 2, 14, 5, 8);
                g.fillRect(ox + 21, 14, 5, 8);
                g.fillStyle(P.GS, 1);
                g.fillRect(ox + 3, 14, 4, 7);
                g.fillRect(ox + 21, 14, 4, 7);
            }
            // Head
            g.fillStyle(P.GS2, 1);
            g.fillRect(ox + 4, 1, 20, 15);
            g.fillStyle(P.GS, 1);
            g.fillRect(ox + 5, 0, 18, 14);
            g.fillStyle(P.GS3, 1);
            g.fillRect(ox + 6, 0, 6, 5);
            g.fillStyle(P.GS2, 1);
            g.fillTriangle(ox + 4, 4, ox + 0, 0, ox + 8, 4);
            g.fillTriangle(ox + 24, 4, ox + 22, 0, ox + 28, 4);
            // Nose
            g.fillStyle(P.GS2, 1);
            g.fillRect(ox + 10, 7, 6, 4);
            g.fillStyle(0x000000, 1);
            g.fillCircle(ox + 11, 9, 1.5);
            g.fillCircle(ox + 15, 9, 1.5);
            // Eyes
            g.fillStyle(0x000000, 1);
            g.fillRect(ox + 7, 4, 5, 4);
            g.fillRect(ox + 16, 4, 5, 4);
            g.fillStyle(P.GE, 1);
            g.fillRect(ox + 8, 5, 3, 2);
            g.fillRect(ox + 17, 5, 3, 2);
            g.fillStyle(0xFFFFFF, 0.8);
            g.fillRect(ox + 9, 5, 1, 1);
            g.fillRect(ox + 18, 5, 1, 1);
            // Tusks
            g.fillStyle(P.GT, 1);
            g.fillRect(ox + 8, 12, 3, 5);
            g.fillRect(ox + 17, 12, 3, 5);
            if (f === 7) {
                g.fillStyle(0x220000, 0.45);
                g.fillRect(ox, 0, W, H);
            }
        }
        g.generateTexture('goblin', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('goblin');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    // ── SKELETON ───────────────────────────────────────────────────────────────
    makeSkeletonSheet() {
        if (this.textures.exists('skeleton'))
            return;
        const W = 32, H = 44, FRAMES = 8;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const legOff = (f >= 1 && f <= 3) ? [5, 0, -5][f - 1] ?? 0 : 0;
            g.fillStyle(0x000000, 0.15);
            g.fillEllipse(ox + 16, H - 1, 18, 4);
            // Legs
            g.fillStyle(P.SB2, 1);
            g.fillRect(ox + 9, 28 + legOff, 5, 12);
            g.fillRect(ox + 18, 28 - legOff, 5, 12);
            g.fillStyle(P.SB, 1);
            g.fillRect(ox + 10, 27 + legOff, 3, 11);
            g.fillRect(ox + 19, 27 - legOff, 3, 11);
            g.fillStyle(P.SB3, 1);
            g.fillCircle(ox + 11, 33 + legOff, 3);
            g.fillCircle(ox + 20, 33 - legOff, 3);
            g.fillStyle(P.SB2, 1);
            g.fillRect(ox + 8, 38 + legOff, 8, 4);
            g.fillRect(ox + 17, 38 - legOff, 8, 4);
            // Ribcage
            g.fillStyle(P.SB2, 1);
            g.fillRect(ox + 11, 14, 10, 16);
            g.fillStyle(P.SB3, 1);
            for (let r = 0; r < 4; r++) {
                g.fillRect(ox + 9, 15 + r * 3, 4, 2);
                g.fillRect(ox + 19, 15 + r * 3, 4, 2);
            }
            g.fillStyle(P.SB, 1);
            g.fillRect(ox + 13, 14, 6, 14);
            // Arms
            if (f === 5 || f === 6) {
                g.fillStyle(P.SB2, 1);
                g.fillRect(ox + 22, 12, 4, 14);
                g.fillStyle(P.SB, 1);
                g.fillRect(ox + 23, 12, 3, 13);
                g.fillStyle(0xB0A880, 1);
                g.fillRect(ox + 24, 4, 3, 18);
                g.fillStyle(0xE0D8B0, 1);
                g.fillRect(ox + 25, 4, 2, 16);
                g.fillStyle(P.SB2, 1);
                g.fillRect(ox + 6, 14, 4, 10);
                g.fillStyle(P.SB, 1);
                g.fillRect(ox + 7, 14, 3, 9);
            }
            else {
                g.fillStyle(P.SB2, 1);
                g.fillRect(ox + 6, 14, 4, 12);
                g.fillRect(ox + 22, 14, 4, 12);
                g.fillStyle(P.SB, 1);
                g.fillRect(ox + 7, 14, 3, 11);
                g.fillRect(ox + 23, 14, 3, 11);
                g.fillStyle(P.SB3, 1);
                g.fillCircle(ox + 8, 20, 3);
                g.fillCircle(ox + 24, 20, 3);
            }
            g.fillStyle(P.SB3, 1);
            g.fillCircle(ox + 9, 14, 4);
            g.fillCircle(ox + 23, 14, 4);
            // Skull
            g.fillStyle(P.SB2, 1);
            g.fillRect(ox + 7, 2, 18, 16);
            g.fillStyle(P.SB, 1);
            g.fillRect(ox + 8, 1, 16, 14);
            g.fillStyle(P.SB3, 1);
            g.fillRect(ox + 9, 1, 6, 5);
            g.fillStyle(P.SE, 1);
            g.fillRect(ox + 9, 5, 5, 5);
            g.fillRect(ox + 18, 5, 5, 5);
            if (f !== 7) {
                g.fillStyle(P.SR, 1);
                g.fillRect(ox + 10, 6, 3, 3);
                g.fillRect(ox + 19, 6, 3, 3);
            }
            g.fillStyle(P.SE, 1);
            g.fillRect(ox + 13, 9, 4, 3);
            g.fillStyle(P.SB2, 1);
            g.fillRect(ox + 9, 14, 2, 4);
            g.fillRect(ox + 12, 14, 2, 3);
            g.fillRect(ox + 15, 14, 2, 4);
            g.fillRect(ox + 18, 14, 2, 3);
            g.fillRect(ox + 21, 14, 2, 4);
        }
        g.generateTexture('skeleton', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('skeleton');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    // ── BAT ────────────────────────────────────────────────────────────────────
    makeBatSheet() {
        if (this.textures.exists('bat'))
            return;
        const W = 36, H = 24, FRAMES = 8;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const wingY = f % 2 === 0 ? -8 : 8;
            g.fillStyle(P.BW2, 1);
            g.fillTriangle(ox + 14, 12, ox + 2, 12 + wingY, ox + 0, 20);
            g.fillTriangle(ox + 14, 12, ox + 6, 4 + wingY, ox + 2, 12 + wingY);
            g.fillTriangle(ox + 22, 12, ox + 34, 12 + wingY, ox + 36, 20);
            g.fillTriangle(ox + 22, 12, ox + 30, 4 + wingY, ox + 34, 12 + wingY);
            g.fillStyle(P.BW, 1);
            g.fillTriangle(ox + 14, 12, ox + 4, 10 + wingY, ox + 2, 18);
            g.fillTriangle(ox + 22, 12, ox + 32, 10 + wingY, ox + 34, 18);
            g.fillStyle(P.BB2, 1);
            g.fillEllipse(ox + 18, 14, 14, 12);
            g.fillStyle(P.BB, 1);
            g.fillEllipse(ox + 18, 13, 12, 10);
            g.fillStyle(P.BB2, 1);
            g.fillTriangle(ox + 12, 8, ox + 9, 2, ox + 15, 8);
            g.fillTriangle(ox + 24, 8, ox + 21, 2, ox + 27, 8);
            g.fillStyle(P.BB, 1);
            g.fillTriangle(ox + 12, 8, ox + 10, 3, ox + 14, 8);
            g.fillTriangle(ox + 24, 8, ox + 22, 3, ox + 26, 8);
            g.fillStyle(P.BE, 1);
            g.fillCircle(ox + 15, 12, 3);
            g.fillCircle(ox + 21, 12, 3);
            g.fillStyle(0x000000, 1);
            g.fillCircle(ox + 15, 12, 1.5);
            g.fillCircle(ox + 21, 12, 1.5);
            g.fillStyle(0xFFFFFF, 0.8);
            g.fillCircle(ox + 16, 11, 1);
            g.fillCircle(ox + 22, 11, 1);
            g.fillStyle(0xEEDDCC, 1);
            g.fillRect(ox + 16, 17, 2, 4);
            g.fillRect(ox + 19, 17, 2, 4);
        }
        g.generateTexture('bat', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('bat');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    // ── SLIME ──────────────────────────────────────────────────────────────────
    makeSlimeSheet() {
        if (this.textures.exists('slime'))
            return;
        const W = 28, H = 24, FRAMES = 8;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const squish = f % 4 === 0 ? 1 : f % 4 === 2 ? -2 : 0;
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(ox + 14, H - 1, 18, 5);
            g.fillStyle(P.SLS2, 1);
            g.fillEllipse(ox + 14, 14 + squish, 22, 18 - squish);
            g.fillStyle(P.SLS, 1);
            g.fillEllipse(ox + 14, 13 + squish, 20, 16 - squish);
            g.fillStyle(P.SLS, 1);
            g.fillCircle(ox + 8, 9 - squish, 5);
            g.fillCircle(ox + 14, 7 - squish, 6);
            g.fillCircle(ox + 20, 9 - squish, 5);
            g.fillStyle(P.SLS3, 1);
            g.fillEllipse(ox + 11, 9 + squish, 6, 4);
            g.fillStyle(0xFFFFFF, 0.5);
            g.fillCircle(ox + 10, 8 + squish, 2);
            g.fillStyle(0x000000, 1);
            g.fillCircle(ox + 11, 13, 3);
            g.fillCircle(ox + 17, 13, 3);
            g.fillStyle(P.SLE, 1);
            g.fillCircle(ox + 11, 13, 2);
            g.fillCircle(ox + 17, 13, 2);
            g.fillStyle(0xFFFFFF, 0.9);
            g.fillCircle(ox + 12, 12, 1);
            g.fillCircle(ox + 18, 12, 1);
            g.fillStyle(P.SLE, 1);
            if (f === 5 || f === 6) {
                g.fillRect(ox + 9, 17, 10, 2);
                g.fillRect(ox + 9, 17, 2, 3);
                g.fillRect(ox + 17, 17, 2, 3);
            }
            else {
                for (let mx = 0; mx < 5; mx++) {
                    g.fillRect(ox + 10 + mx * 2, 17 + (mx === 0 || mx === 4 ? 0 : mx === 1 || mx === 3 ? 1 : 2), 2, 1);
                }
            }
        }
        g.generateTexture('slime', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('slime');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    // ── BOSS DRAGON ────────────────────────────────────────────────────────────
    makeDragonSheet() {
        if (this.textures.exists('boss_dragon'))
            return;
        const W = 80, H = 80, FRAMES = 8;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let f = 0; f < FRAMES; f++) {
            const ox = f * W;
            const wingFlap = f % 2 === 0 ? -10 : 10;
            g.fillStyle(0x000000, 0.3);
            g.fillEllipse(ox + 40, H - 2, 55, 12);
            // Tail
            g.fillStyle(P.DR2, 1);
            g.fillTriangle(ox + 8, 55, ox + 0, 70, ox + 20, 60);
            g.fillStyle(P.DR, 1);
            g.fillTriangle(ox + 12, 52, ox + 2, 66, ox + 22, 58);
            // Wings
            g.fillStyle(P.DW, 1);
            g.fillTriangle(ox + 25, 30, ox + 2, 10 + wingFlap, ox + 10, 50);
            g.fillTriangle(ox + 55, 30, ox + 78, 10 + wingFlap, ox + 70, 50);
            g.fillStyle(P.DR2, 1);
            g.fillTriangle(ox + 25, 30, ox + 5, 15 + wingFlap, ox + 12, 46);
            g.fillTriangle(ox + 55, 30, ox + 75, 15 + wingFlap, ox + 68, 46);
            // Body
            g.fillStyle(P.DR2, 1);
            g.fillEllipse(ox + 40, 48, 48, 36);
            g.fillStyle(P.DR, 1);
            g.fillEllipse(ox + 40, 46, 44, 32);
            g.fillStyle(P.DR2, 1);
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 4; col++) {
                    g.fillRect(ox + 22 + col * 10 + (row % 2 === 0 ? 0 : 5), 34 + row * 8, 8, 5);
                }
            }
            // Belly
            g.fillStyle(P.DB2, 1);
            g.fillEllipse(ox + 40, 52, 30, 22);
            g.fillStyle(P.DB, 1);
            g.fillEllipse(ox + 40, 51, 26, 18);
            g.fillStyle(P.DB2, 1);
            for (let seg = 0; seg < 4; seg++) {
                g.fillRect(ox + 29, 44 + seg * 4, 22, 2);
            }
            // Neck
            g.fillStyle(P.DR2, 1);
            g.fillRect(ox + 30, 20, 20, 28);
            g.fillStyle(P.DR, 1);
            g.fillRect(ox + 32, 19, 16, 26);
            g.fillStyle(P.DR3, 1);
            for (let sp = 0; sp < 4; sp++) {
                g.fillTriangle(ox + 38, 16 + sp * 6, ox + 36, 22 + sp * 6, ox + 42, 22 + sp * 6);
            }
            // Head
            g.fillStyle(P.DR2, 1);
            g.fillRect(ox + 28, 6, 32, 22);
            g.fillStyle(P.DR, 1);
            g.fillRect(ox + 30, 5, 28, 20);
            g.fillStyle(P.DR, 1);
            g.fillRect(ox + 48, 12, 20, 12);
            g.fillStyle(P.DR2, 1);
            g.fillRect(ox + 50, 14, 18, 10);
            // Fire breath
            if (f === 6 || f === 7) {
                g.fillStyle(0xFF6600, 1);
                g.fillCircle(ox + 64, 16, 3);
                g.fillStyle(0xFF4400, 0.6);
                g.fillCircle(ox + 68, 22, 6);
                g.fillStyle(0xFF8800, 0.4);
                g.fillCircle(ox + 74, 20, 8);
            }
            // Horns
            g.fillStyle(P.DH, 1);
            g.fillTriangle(ox + 30, 8, ox + 26, -2, ox + 34, 8);
            g.fillTriangle(ox + 38, 5, ox + 35, -4, ox + 42, 5);
            g.fillStyle(P.DR3, 1);
            g.fillTriangle(ox + 30, 9, ox + 27, 0, ox + 33, 9);
            g.fillTriangle(ox + 38, 6, ox + 36, -2, ox + 41, 6);
            // Eye
            g.fillStyle(0x000000, 1);
            g.fillRect(ox + 36, 8, 8, 8);
            g.fillStyle(P.DE, 1);
            g.fillRect(ox + 37, 9, 6, 6);
            g.fillStyle(0x000000, 1);
            g.fillRect(ox + 39, 10, 3, 4);
            g.fillStyle(0xFFFFAA, 0.9);
            g.fillCircle(ox + 38, 10, 1.5);
            // Legs
            g.fillStyle(P.DR2, 1);
            g.fillRect(ox + 20, 58, 12, 14);
            g.fillRect(ox + 48, 58, 12, 14);
            g.fillStyle(P.DR, 1);
            g.fillRect(ox + 21, 57, 10, 12);
            g.fillRect(ox + 49, 57, 10, 12);
            g.fillStyle(P.DR2, 1);
            for (let c = 0; c < 3; c++) {
                g.fillTriangle(ox + 20 + c * 4, 72, ox + 18 + c * 4, 78, ox + 23 + c * 4, 72);
                g.fillTriangle(ox + 48 + c * 4, 72, ox + 46 + c * 4, 78, ox + 51 + c * 4, 72);
            }
        }
        g.generateTexture('boss_dragon', W * FRAMES, H);
        g.destroy();
        const tex = this.textures.get('boss_dragon');
        for (let f = 0; f < FRAMES; f++)
            tex.add(f, 0, f * W, 0, W, H);
    }
    // ── TILES ──────────────────────────────────────────────────────────────────
    makeGroundTile() {
        if (this.textures.exists('tile_ground'))
            return;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        g.fillStyle(P.TD2, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(P.TG2, 1);
        g.fillRect(0, 0, 32, 8);
        g.fillStyle(P.TG1, 1);
        g.fillRect(0, 0, 32, 6);
        g.fillStyle(P.TG2, 1);
        for (let bx = 2; bx < 32; bx += 6) {
            g.fillRect(bx, -2, 2, 5);
            g.fillRect(bx + 3, -1, 2, 4);
        }
        g.fillStyle(P.TD3, 0.5);
        g.fillRect(4, 12, 6, 3);
        g.fillRect(18, 16, 8, 3);
        g.fillRect(8, 22, 4, 2);
        g.fillRect(22, 26, 6, 2);
        g.fillStyle(P.TD1, 0.6);
        g.fillRect(2, 10, 3, 2);
        g.fillRect(14, 18, 5, 2);
        g.fillStyle(0x000000, 0.25);
        g.fillRect(0, 30, 32, 2);
        g.generateTexture('tile_ground', 32, 32);
        g.destroy();
    }
    makeWallTile() {
        if (this.textures.exists('tile_wall'))
            return;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        g.fillStyle(P.TW2, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(P.TW1, 1);
        g.fillRect(1, 1, 14, 14);
        g.fillRect(17, 1, 14, 14);
        g.fillRect(1, 17, 14, 14);
        g.fillRect(17, 17, 14, 14);
        g.fillStyle(P.TW3, 1);
        g.fillRect(1, 1, 14, 2);
        g.fillRect(17, 1, 14, 2);
        g.fillRect(1, 1, 2, 14);
        g.fillRect(17, 1, 2, 14);
        g.fillStyle(P.TW2, 1);
        g.fillRect(0, 15, 32, 2);
        g.fillRect(15, 0, 2, 32);
        g.generateTexture('tile_wall', 32, 32);
        g.destroy();
    }
    makeCaveTile() {
        if (this.textures.exists('tile_cave'))
            return;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        g.fillStyle(P.TC1, 1);
        g.fillRect(0, 0, 32, 32);
        g.fillStyle(P.TC3, 0.5);
        g.fillRect(2, 2, 10, 8);
        g.fillRect(20, 6, 10, 6);
        g.fillRect(6, 18, 8, 10);
        g.fillRect(18, 20, 12, 8);
        g.fillStyle(0x4455AA, 0.4);
        g.fillRect(14, 4, 4, 10);
        g.fillStyle(0x6677CC, 0.3);
        g.fillRect(15, 3, 2, 8);
        g.generateTexture('tile_cave', 32, 32);
        g.destroy();
    }
    // ── ITEMS ──────────────────────────────────────────────────────────────────
    makeItemSheet() {
        if (this.textures.exists('items'))
            return;
        const COLS = 8, FW = 24, FH = 24, TOTAL = 40;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        const shapes = ['sword', 'sword', 'sword', 'sword', 'gem', 'gem', 'gem', 'gem',
            'gem', 'gem', 'potion', 'potion', 'potion', 'gem', 'gem', 'gem',
            'gem', 'gem', 'gem', 'gem', 'totem', 'totem', 'totem', 'totem',
            'gem', 'gem', 'gem', 'gem', 'gem', 'gem', 'rune', 'rune', 'rune',
            'gem', 'gem', 'gem', 'gem', 'gem', 'gem', 'gem'];
        const colors = [0xB8B8C8, 0xC8D0E0, 0xFF8833, 0xFFDD44, 0x888888, 0x888888, 0x888888, 0x888888,
            0x888888, 0x888888, 0xFF4488, 0xAA44FF, 0xFF8844, 0x888888, 0x888888, 0x888888,
            0x888888, 0x888888, 0x888888, 0x888888, 0xAAEEFF, 0xFF6622, 0x88BBFF, 0x44FF88,
            0x888888, 0x888888, 0x888888, 0x888888, 0x888888, 0x888888, 0xFFEE44, 0x44FFAA,
            0x8866FF, 0x888888, 0x888888, 0x888888, 0x888888, 0x888888, 0x888888, 0x888888];
        for (let i = 0; i < TOTAL; i++) {
            const cx = (i % COLS) * FW;
            const cy = Math.floor(i / COLS) * FH;
            const color = colors[i] ?? 0x888888;
            const shape = shapes[i] ?? 'gem';
            const mx = cx + 12, my = cy + 12;
            g.fillStyle(0x0A0A18, 1);
            g.fillRect(cx + 2, cy + 2, 20, 20);
            g.lineStyle(1, color, 0.5);
            g.strokeRect(cx + 2, cy + 2, 20, 20);
            if (shape === 'sword') {
                g.fillStyle(color, 1);
                g.fillRect(mx - 1, my - 8, 3, 16);
                g.fillRect(mx - 5, my - 2, 11, 3);
                g.fillStyle(0xAA8833, 1);
                g.fillRect(mx - 1, my + 4, 3, 5);
            }
            else if (shape === 'potion') {
                g.fillStyle(color, 0.8);
                g.fillEllipse(mx, my + 3, 12, 14);
                g.fillStyle(0x888888, 1);
                g.fillRect(mx - 2, my - 6, 5, 6);
                g.fillStyle(0x555555, 1);
                g.fillRect(mx - 1, my - 9, 3, 4);
                g.fillStyle(0xFFFFFF, 0.35);
                g.fillEllipse(mx - 2, my - 1, 4, 7);
            }
            else if (shape === 'totem') {
                g.fillStyle(0x8B6322, 1);
                g.fillRect(mx - 2, my - 8, 5, 16);
                g.fillStyle(color, 1);
                g.fillRect(mx - 5, my - 9, 11, 8);
                g.fillStyle(0x000000, 1);
                g.fillRect(mx - 3, my - 7, 3, 3);
                g.fillRect(mx + 1, my - 7, 3, 3);
                g.fillStyle(color, 0.5);
                g.fillRect(mx - 5, my - 1, 11, 3);
            }
            else if (shape === 'rune') {
                g.fillStyle(0x3A3A4A, 1);
                g.fillEllipse(mx, my, 16, 16);
                g.fillStyle(color, 1);
                g.fillRect(mx - 1, my - 7, 3, 14);
                g.fillRect(mx - 5, my - 1, 11, 3);
                g.fillStyle(color, 0.5);
                g.fillCircle(mx, my, 3);
            }
            else {
                g.fillStyle(color, 1);
                g.fillRect(mx - 5, my - 5, 10, 10);
                g.fillStyle(0xFFFFFF, 0.3);
                g.fillRect(mx - 4, my - 4, 5, 5);
            }
        }
        g.generateTexture('items', FW * COLS, FH * Math.ceil(TOTAL / COLS));
        g.destroy();
        const tex = this.textures.get('items');
        for (let i = 0; i < TOTAL; i++)
            tex.add(i, 0, (i % COLS) * FW, Math.floor(i / COLS) * FH, FW, FH);
    }
    // ── NPCs ───────────────────────────────────────────────────────────────────
    makeNPCSheets() {
        const npcs = [
            { key: 'npc_elder', robe: P.NE, hat: 0x886622 },
            { key: 'npc_smith', robe: P.NS, hat: 0x443322 },
            { key: 'npc_merchant', robe: P.NM, hat: 0x224422 },
        ];
        for (const npc of npcs) {
            if (this.textures.exists(npc.key))
                continue;
            const g = this.make.graphics({ x: 0, y: 0 });
            g.setVisible(false);
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(16, 44, 20, 6);
            // Robe
            g.fillStyle(npc.robe, 1);
            g.fillRect(6, 18, 20, 24);
            g.fillStyle(npc.hat, 0.4);
            g.fillRect(6, 18, 20, 3);
            // Arms
            g.fillStyle(npc.robe, 1);
            g.fillRect(2, 18, 6, 14);
            g.fillRect(24, 18, 6, 14);
            g.fillStyle(P.SKIN, 1);
            g.fillCircle(5, 33, 4);
            g.fillCircle(27, 33, 4);
            // Head
            g.fillStyle(P.SKIN, 1);
            g.fillRect(8, 4, 16, 16);
            g.fillStyle(0xFFDDCC, 1);
            g.fillRect(9, 3, 14, 14);
            // Eyes
            g.fillStyle(0x000000, 1);
            g.fillRect(11, 7, 3, 3);
            g.fillRect(18, 7, 3, 3);
            g.fillStyle(0x4488CC, 1);
            g.fillRect(12, 8, 2, 2);
            g.fillRect(19, 8, 2, 2);
            g.fillStyle(0xCC9988, 1);
            g.fillRect(15, 11, 2, 2);
            g.fillStyle(0x884444, 1);
            g.fillRect(13, 14, 6, 2);
            // Hat
            g.fillStyle(npc.hat, 1);
            g.fillRect(6, 1, 20, 5);
            g.fillRect(10, -6, 12, 7);
            g.fillStyle(0xFFFFFF, 0.1);
            g.fillRect(11, -5, 5, 3);
            g.generateTexture(npc.key, 32, 44);
            g.destroy();
        }
    }
    // ── PARTICLES ──────────────────────────────────────────────────────────────
    makeParticle() {
        if (this.textures.exists('particle'))
            return;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.setVisible(false);
        for (let r = 8; r >= 1; r--) {
            g.fillStyle(0xFFFFFF, r / 10);
            g.fillCircle(8, 8, r);
        }
        g.generateTexture('particle', 16, 16);
        g.destroy();
    }
}
//# sourceMappingURL=BootScene.js.map