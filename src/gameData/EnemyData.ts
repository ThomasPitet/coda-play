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
}