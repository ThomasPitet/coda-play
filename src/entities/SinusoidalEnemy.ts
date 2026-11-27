import Entity from "./Entity";
import Health from "../components/Health";
import SinusoidalMovement from "../components/SinusoidalMovement";
import Weapon from "../components/Weapon";
import { SinusoidalEnemyData } from "../gameData/EnemyData";

export default class SinusoidalEnemy extends Entity {
    private _data: SinusoidalEnemyData;
    private _shootTimerConfig: Phaser.Types.Time.TimerEventConfig;
    private _shootTimer: Phaser.Time.TimerEvent;

    public init(bulletsGroup: Phaser.Physics.Arcade.Group, data: SinusoidalEnemyData) {
        this._data = data;

        this.addComponent(new Health(1, this));
        this.addComponent(new SinusoidalMovement(data.movement, data.troll));
        this.addComponent(new Weapon(bulletsGroup, data.weapon.bullet, {
            bulletCount: data.weapon.bulletCount,
            spreadAngle: data.weapon.spreadAngle
        }));

        this.setTint(data.tint);
        this.angle = 90;

        const health = this.getComponent(Health);
        health?.on(Health.CHANGE_EVENT, () => {
            this.setTintFill(0xffffff);

            if (health?.current === 0) {
                this.disableBody();

                if (this._data.troll?.enabled && this._data.troll.deathBurstCount > 0) {
                    this.getComponent(Weapon)?.shoot(this, {
                        bulletCount: this._data.troll.deathBurstCount,
                        spreadAngle: this._data.troll.deathBurstSpread
                    });
                    this.scene.sound.play('sfx_laser1');
                }
            }

            this.scene.time.delayedCall(50, () => {
                if (health?.current === 0) {
                    this.disable();
                } else {
                    this.setTint(this._data.tint);
                }
            });
        });

        // Create animation when enemy is about to shoot in the global animation manager
        if (!this.scene.anims.exists('ufoShoot')) {
            this.scene.anims.create({
                key: 'ufoShoot',
                frames: [
                    {key: 'sprites', frame: 'ufoRed'},
                    {key: 'sprites', frame: 'ufoRed-shoot0'},
                    {key: 'sprites', frame: 'ufoRed-shoot1'}
                ],
                frameRate: 4,
            });
        }

        this._shootTimerConfig = {
            delay: Phaser.Math.Between(data.weapon.fireRateMin, data.weapon.fireRateMax),
            callback: this.shoot,
            callbackScope: this,
            loop: true
        };
        this._shootTimer = this.scene.time.addEvent(this._shootTimerConfig);
        this.arcadeBody.setCircle(this.displayWidth / 2);
    }

    public enable(x: number, y: number) {
        this.enableBody(true, x, y - this.displayHeight, true, true);
        this.setTint(this._data.tint);
        this.getComponent(SinusoidalMovement)?.reset(x);
        this._shootTimer.reset(this._shootTimerConfig);

        const health = this.getComponent(Health);
        health?.heal(health!.max, false);
    }

    public disable() {
        this.stop();
        this.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
        this.disableBody(true, true);
        this._shootTimer.paused = true;
    }

    private shoot() {
        this.play('ufoShoot');
        this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.setTexture('sprites', this._data.texture);
            this.setTint(this._data.tint);
            this.getComponent(Weapon)?.shoot(this);
            this.scene.sound.play('sfx_laser2');
        });
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime);

        if (this.y > this.scene.cameras.main.height + this.displayHeight) {
            this.disable();
            return;
        }

        const slowdown = this.isTinted ? 0.5 : 1.0;
        this.getComponent(SinusoidalMovement)?.updateMovement(this, deltaTime * slowdown);
    }
}