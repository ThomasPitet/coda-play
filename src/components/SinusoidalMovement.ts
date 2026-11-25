import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";
import { SinusoidalMovementData, LevelDevilTrollData } from "../gameData/EnemyData";

export default class SinusoidalMovement implements IComponent {
    public enabled: boolean; boolean = true;

    private _config: SinusoidalMovementData;
    private _trollConfig?: LevelDevilTrollData;
    private _baseX: number = 0;
    private _elapsedTime: number = 0;
    private _jukeTimer: number = 0;

    constructor(config: SinusoidalMovementData, trollConfig?: LevelDevilTrollData) {
        this._config = config;
        this._trollConfig = trollConfig;
    }

    public reset(initialX: number) {
        this._baseX = initialX;
        this._elapsedTime = 0;
        this._jukeTimer = 0;
    }

    public updateMovement(entity: Entity, deltaTime: number) {
        if (!this.enabled) return;

        this._elapsedTime += deltaTime;
        this._jukeTimer += deltaTime;

        entity.y += this._config.speedY * deltaTime;

        let currentAmplitude = this._config.amplitude;
        if (this._trollConfig?.enabled && this._jukeTimer >= this._trollConfig.jukeInterval) {
            currentAmplitude *= this._trollConfig.jukeMultiplier;
            if (this._jukeTimer >= this._trollConfig.jukeInterval + 250) {
                this._jukeTimer = 0;
            }
        }
        entity.x = this._baseX + currentAmplitude * Math.sin(this._elapsedTime * this._config.frequency);
    }
}