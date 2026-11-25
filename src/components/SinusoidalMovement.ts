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
}