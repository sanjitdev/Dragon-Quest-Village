// Player.ts — The hero. Extends Character with inventory, leveling, skills, and input.

import { Character, CharacterStats } from './Character.js';
import { Inventory } from '../inventory/Inventory.js';
import { Weapon } from '../inventory/Weapon.js';
import { Totem } from '../inventory/Totem.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig } from '../core/GameConfig.js';

export interface PlayerSaveData {
  level: number;
  experience: number;
  gold: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
  inventoryIds: string[];
  activeWeaponId: string | null;
  activeTotemId: string | null;
  completedQuests: string[];
  currentZone: string;
}

export class Player extends Character {
  // Progression
  level: number = 1;
  experience: number = 0;

  // Economy
  gold: number = 0;

  // Inventory & Equipment
  readonly inventory: Inventory;
  equippedWeapon: Weapon | null = null;
  equippedTotem: Totem | null = null;

  // Quest tracking
  completedQuests: Set<string> = new Set();

  // Skills / ability flags
  canDoubleJump: boolean = false;
  private hasDoubleJumped: boolean = false;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      maxHealth: GameConfig.PLAYER_START_HEALTH,
      attack:    GameConfig.PLAYER_START_ATTACK,
      defense:   GameConfig.PLAYER_START_DEFENSE,
      speed:     GameConfig.PLAYER_START_SPEED,
      luck:      GameConfig.PLAYER_START_LUCK,
    });

    this.animPrefix = 'player';
    this.inventory   = new Inventory();

    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setGravityY(GameConfig.GRAVITY - 600);

    this.setupInput(scene);
    this.registerAnims(scene);
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  private setupInput(scene: Phaser.Scene): void {
    if (!scene.input.keyboard) return;
    this.cursors    = scene.input.keyboard.createCursorKeys();
    this.attackKey  = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.jumpKey    = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  private registerAnims(scene: Phaser.Scene): void {
    const anims = scene.anims;
    const defs = [
      { key: 'player_idle',   frames: [0],         frameRate: 4,  repeat: -1 },
      { key: 'player_run',    frames: [1, 2, 3, 4], frameRate: 10, repeat: -1 },
      { key: 'player_jump',   frames: [5],          frameRate: 1,  repeat: 0  },
      { key: 'player_attack', frames: [6, 7],       frameRate: 12, repeat: 0  },
      { key: 'player_hurt',   frames: [8],          frameRate: 4,  repeat: 0  },
      { key: 'player_death',  frames: [9],          frameRate: 4,  repeat: 0  },
    ];

    for (const def of defs) {
      if (!anims.exists(def.key)) {
        anims.create({
          key: def.key,
          frames: anims.generateFrameNumbers('player', { frames: def.frames }),
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }
  }

  // ── Equipment ──────────────────────────────────────────────────────────────

  equipWeapon(weapon: Weapon): void {
    this.equippedWeapon = weapon;
    EventBus.emit(Events.ITEM_EQUIPPED, weapon);
    EventBus.emit(Events.UI_REFRESH);
  }

  equipTotem(totem: Totem): void {
    if (this.equippedTotem) this.equippedTotem.deactivate(this);
    this.equippedTotem = totem;
    totem.activate(this);
    EventBus.emit(Events.ITEM_EQUIPPED, totem);
    EventBus.emit(Events.UI_REFRESH);
  }

  // ── Computed stats (equipment bonuses applied) ─────────────────────────────

  get totalAttack(): number {
    return this.stats.attack + (this.equippedWeapon?.attackBonus ?? 0);
  }

  get totalDefense(): number {
    return this.stats.defense;
  }

  // ── Leveling ───────────────────────────────────────────────────────────────

  gainXP(amount: number): void {
    this.experience += amount;
    EventBus.emit(Events.PLAYER_GAINED_XP, amount);

    const xpNeeded = this.xpToNextLevel();
    if (this.experience >= xpNeeded) {
      this.experience -= xpNeeded;
      this.levelUp();
    }
  }

  private xpToNextLevel(): number {
    return Math.floor(GameConfig.XP_PER_LEVEL_BASE * Math.pow(GameConfig.XP_LEVEL_MULTIPLIER, this.level - 1));
  }

  private levelUp(): void {
    this.level += 1;
    this.stats.maxHealth += 15;
    this._maxHealth = this.stats.maxHealth;
    this._health = this._maxHealth;
    this.stats.attack  += 3;
    this.stats.defense += 2;
    this.stats.speed   += 5;
    this.stats.luck    += 1;
    EventBus.emit(Events.PLAYER_LEVELED_UP, this.level);
    EventBus.emit(Events.UI_REFRESH);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  performAttack(): void {
    if (this.attackCooldown > 0 || !this._alive) return;
    this.isAttacking  = true;
    this.attackTimer  = 300;
    this.attackCooldown = GameConfig.ATTACK_COOLDOWN_MS;
    this.playAnim('attack', false);
  }

  collectGold(amount: number): void {
    this.gold += amount;
    EventBus.emit(Events.GOLD_COLLECTED, this.gold);
    EventBus.emit(Events.UI_REFRESH);
  }

  // ── Save / Load ────────────────────────────────────────────────────────────

  getSaveData(): PlayerSaveData {
    return {
      level:           this.level,
      experience:      this.experience,
      gold:            this.gold,
      maxHealth:       this.stats.maxHealth,
      attack:          this.stats.attack,
      defense:         this.stats.defense,
      speed:           this.stats.speed,
      luck:            this.stats.luck,
      inventoryIds:    this.inventory.items.map(i => i.id),
      activeWeaponId:  this.equippedWeapon?.id ?? null,
      activeTotemId:   this.equippedTotem?.id  ?? null,
      completedQuests: [...this.completedQuests],
      currentZone:     'village',
    };
  }

  applyStats(data: PlayerSaveData): void {
    this.level       = data.level;
    this.experience  = data.experience;
    this.gold        = data.gold;
    this.stats.maxHealth = data.maxHealth;
    this._maxHealth  = data.maxHealth;
    this._health     = data.maxHealth;
    this.stats.attack  = data.attack;
    this.stats.defense = data.defense;
    this.stats.speed   = data.speed;
    this.stats.luck    = data.luck;
    this.completedQuests = new Set(data.completedQuests);
  }

  // ── Override die ──────────────────────────────────────────────────────────

  protected override die(): void {
    super.die();
    EventBus.emit(Events.PLAYER_DIED);
  }

  // ── Override takeDamage ───────────────────────────────────────────────────

  override takeDamage(amount: number): void {
    super.takeDamage(amount);
    EventBus.emit(Events.PLAYER_DAMAGED, this._health, this._maxHealth);
    EventBus.emit(Events.CAMERA_SHAKE);
    EventBus.emit(Events.UI_REFRESH);
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  override update(time: number, delta: number): void {
    if (!this._alive) return;
    super.update(time, delta);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // Horizontal movement
    if (this.cursors.left.isDown)  { this.moveLeft();  }
    else if (this.cursors.right.isDown) { this.moveRight(); }
    else { this.stopHorizontal(); }

    // Jump (cursor up, X key)
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
                     || Phaser.Input.Keyboard.JustDown(this.jumpKey);

    if (jumpPressed) {
      if (onGround) {
        this.hasDoubleJumped = false;
        this.jump(GameConfig.PLAYER_JUMP_VELOCITY);
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.hasDoubleJumped = true;
        body.setVelocityY(GameConfig.PLAYER_JUMP_VELOCITY);
      }
    }

    // Attack (Z key)
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.performAttack();
    }
  }
}
