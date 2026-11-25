import { BulletData } from "./BulletData";

export type SinusoidalMovementData = {
    speedY: number;
    amplitude: number;
    frequency: number;
};

export type SpreadWeaponData = {
    fireRateMin: number;
    fireRateMax: number;
    bulletCount: number;
    spreadAngle: number;
    bullet: BulletData;
};

export type LevelDevilTrollData = {
    enabled: boolean;
    jukeInterval: number;
    jukeMultiplier: number;
    deathBurstCount: number;
    deathBurstSpread: number;
};

export type SinusoidalEnemyData = {
    texture: string;
    tint: number;
    spawnDelay: number;
    maxCount: number;
    movement: SinusoidalMovementData;
    weapon: SpreadWeaponData;
    troll: LevelDevilTrollData;
};

