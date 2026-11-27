import { GameObjects, Plugins, Physics, Scene } from "phaser";
import Health from "../components/Health.ts";
import Bullet from "../entities/Bullet.ts";
import Enemy from "../entities/Enemy.ts";
import Player from "../entities/Player.ts";
import GroupUtils from "../utils/GroupUtils.ts";
import GameConstants from "../GameConstants.ts";
import RegistryConstants from "../RegistryConstants.ts";
import SinusoidalEnemy from "../entities/SinusoidalEnemy.ts";
import { EnemiesData } from "../gameData/EnemyData.ts";
import Obstacle from "../entities/Obstacle.ts";

export default class EntityManager extends Plugins.ScenePlugin {
    public static readonly PLUGIN_KEY: string = 'EntityManager';
    public static readonly MAPPING_NAME: string = 'entityManager';

    // noinspection JSUnusedGlobalSymbols
    private readonly bulletGroupConfig = {
        classType: Bullet,
        maxSize: 256,
        runChildUpdate: true,
        createCallback: (bullet: GameObjects.GameObject) => {
            (bullet as Bullet).init();
        }
    }

    private _player: Player;
    private _playerBullets: Physics.Arcade.Group;
    private _enemies: Physics.Arcade.Group;
    private _enemyBullets: Physics.Arcade.Group;
    private _sinusoidalEnemies: Physics.Arcade.Group;
    private _sinusoidalData: EnemiesData;
    private _obstacles: Physics.Arcade.StaticGroup;

    constructor(scene: Scene, pluginManager: Plugins.PluginManager) {
        super(scene, pluginManager, EntityManager.PLUGIN_KEY);

        console.log("[EntityManager] Initialized");
    }

    destroy() {
        super.destroy();

        console.log("[EntityManager] Destroyed");
    }

    public initAndSpawnPlayer(): Player {
        this._playerBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(64, this._playerBullets);

        this._player = new Player(this.scene!, this.scene!.cameras.main.centerX, this.scene!.cameras.main.height - 128);
        this._player.init(this._playerBullets);

        console.log("[EntityManager] Player spawned");

        this.game!.events.emit(GameConstants.Events.PLAYER_SPAWNED_EVENT, this._player);

        return this._player;
    }

    public initEnemies(): Physics.Arcade.Group {
        this._enemyBullets = this.scene!.physics.add.group(this.bulletGroupConfig);
        GroupUtils.populate(256, this._enemyBullets);

        this._enemies = this.scene!.physics.add.group({
            classType: Enemy,
            defaultKey: 'sprites',
            defaultFrame: 'ufoRed',
            createCallback: (enemy) => {
                (enemy as Enemy).init(this._enemyBullets);
            }
        });

        this.scene!.time.addEvent({
            delay: 1500,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this._sinusoidalData = this.scene!.cache.json.get('enemiesData') as EnemiesData;
        const sinuConfig = this._sinusoidalData?.sinusoidal;

        if (sinuConfig) {
            this._sinusoidalEnemies = this.scene!.physics.add.group({
                classType: SinusoidalEnemy,
                defaultKey: 'sprites',
                defaultFrame: sinuConfig.texture,
                createCallback: (enemy) => {
                    (enemy as SinusoidalEnemy).init(this._enemyBullets, sinuConfig);
                }
            });

            this.scene!.time.addEvent({
                delay: sinuConfig.spawnDelay,
                callback: this.spawnSinusoidalEnemy,
                callbackScope: this,
                loop: true
            });
        }

        console.log("[EntityManager] Enemies initialized");

        this.initObstacles();
        return this._enemies;
    }

    public initGroupCollisions() {
        this.scene!.physics.add.overlap(this._playerBullets, this._enemies, (bullet, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            (bullet as Bullet).disable();
            (enemy as Enemy).getComponent(Health)?.damage((bullet as Bullet).damage);
        });

        this.scene!.physics.add.overlap(this._player, this._enemyBullets, (player, bullet) => {
            (bullet as Bullet).disable();
            (player as Player).getComponent(Health)?.damage((bullet as Bullet).damage);

            this.scene?.cameras.main.shake(100, 0.01);
        });

        this.scene!.physics.add.overlap(this._player, this._enemies, (player, enemy) => {
            this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);

            const enemyHealth = (enemy as Enemy).getComponent(Health);
            enemyHealth?.damage(enemyHealth?.max);

            const playerHealth = (player as Player).getComponent(Health);
            playerHealth?.damage(1);

            this.scene?.cameras.main.shake(100, 0.03);
        });

        if (this._sinusoidalEnemies) {
            this.scene!.physics.add.overlap(this._playerBullets, this._sinusoidalEnemies, (bullet, enemy) => {
                this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);
                (bullet as Bullet).disable();
                (enemy as SinusoidalEnemy).getComponent(Health)?.damage((bullet as Bullet).damage);
            });

            this.scene!.physics.add.overlap(this._player, this._sinusoidalEnemies, (player, enemy) => {
                this.scene!.registry.inc(RegistryConstants.Keys.PLAYER_SCORE);
                const enemyHealth = (enemy as SinusoidalEnemy).getComponent(Health);
                enemyHealth?.damage(enemyHealth?.max);

                const playerHealth = (player as Player).getComponent(Health);
                playerHealth?.damage(1);
                this.scene?.cameras.main.shake(100, 0.03);
            });
        }

        if (this._obstacles) {
            this.scene!.physics.add.collider(this._player, this._obstacles, (player, obstacle) => {
                (obstacle as Obstacle).deflect(player as Player);
            });
        }

        console.log("[EntityManager] Group collisions initialized");
    }

    public initObstacles(): Physics.Arcade.StaticGroup {
        this._obstacles = this.scene!.physics.add.staticGroup();

        const cameraWidth = this.scene!.cameras.main.width;
        const cameraHeight = this.scene!.cameras.main.height;

        const obstacle1 = new Obstacle(this.scene!, cameraWidth * 0.25, cameraHeight * 0.65, 84, 84, 16);
        const obstacle2 = new Obstacle(this.scene!, cameraWidth * 0.50, cameraHeight * 0.52, 96, 96, 18);
        const obstacle3 = new Obstacle(this.scene!, cameraWidth * 0.75, cameraHeight * 0.65, 84, 84, 16);

        this._obstacles.add(obstacle1);
        this._obstacles.add(obstacle2);
        this._obstacles.add(obstacle3);

        console.log("[EntityManager] Obstacles initialized");
        return this._obstacles;
    }

    private spawnEnemy() {
        if (this._enemies.countActive(true) >= 5) {
            return;
        }

        const enemy = this._enemies.get() as Enemy;
        if (!enemy) {
            return;
        }

        enemy.enable(Phaser.Math.Between(64, this.scene!.cameras.main.width - 64), 0);

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);

        console.log("[EntityManager] Enemy spawned");
    }

    private spawnSinusoidalEnemy() {
        const config = this._sinusoidalData?.sinusoidal;
        if (!config || !this._sinusoidalEnemies || this._sinusoidalEnemies.countActive(true) >= config.maxCount) {
            return;
        }

        const enemy = this._sinusoidalEnemies.get() as SinusoidalEnemy;
        if (!enemy) {
            return;
        }

        const margin = config.movement.amplitude * (config.troll?.enabled ? config.troll.jukeMultiplier : 1) + 32;
        const spawnX = Phaser.Math.Between(margin, this.scene!.cameras.main.width - margin);
        enemy.enable(spawnX, 0);

        this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);

        console.log("[EntityManager] SinusoidalEnemy spawned");
    }
}