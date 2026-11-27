import { Scene, Physics } from "phaser";
import Player from "./Player";

export default class Obstacle extends Physics.Arcade.Sprite {
    public readonly arcadeBody: Physics.Arcade.Body;
    private readonly _deflectionForce: number;

    constructor(scene: Scene, x: number, y: number, width: number = 84, height: number = 84, deflectionForce: number = 16) {
        super(scene, x, y, 'sprites', 'ufoRed');
        this._deflectionForce = deflectionForce;

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        this.arcadeBody = this.body as Physics.Arcade.Body;
        this.arcadeBody.immovable = true;
        this.arcadeBody.moves = false;

        this.setTint(0x778da9);
        this.setDisplaySize(width, height);
        this.arcadeBody.setSize(width, height);
    }

    public deflect(player: Player) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        player.x += Math.cos(angle) * this._deflectionForce;
        player.y += Math.sin(angle) * this._deflectionForce;

        this.scene.cameras.main.shake(50, 0.005);
    }
}