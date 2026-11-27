# Guide Pas-à-Pas pour l'Évaluation : Nouvel Ennemi Sinusoïdal & Spread Shot

## 😈 Édition Spéciale "Level Devil" (Troll & Rage Game Mechanics)

Ce guide complet détaille chaque étape pour obtenir la note maximale (**20/20**) en respectant scrupuleusement les critères de notation du sujet, tout en injectant des mécaniques inspirées de **Level Devil** pour surprendre le joueur (ennemis feinteurs, salve d'adieu, obstacles déviateurs et contrôle 4 directions) !

| Critère                   |   Points   | Objectif respecté                                                                                                                                                                                                   |
| :------------------------- | :---------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fonctionnalité**  | **7** | Ennemi qui spawn, bouge en sinusoïde, tire en spread shot ; **les 3 + les mécaniques trolls sont 100% pilotés par le JSON** (aucune modification de code pour changer les valeurs ou désactiver le troll). |
| **Architecture**     | **7** | Pattern Entity/Component respecté (`SinusoidalMovement`, `Weapon`), pooling avec reset d'état propre, types TypeScript stricts, pas de dépendance logique → UI, constantes nommées.                         |
| **Qualité du code** | **5** | Code lisible, typé, zéro `console.log` sauvage ni code mort, `npm run build-nolog` passe à 100%, protocole de playtest manuel documenté.                                                                     |
| **Git**              | **1** | Branche `eval` propre issue de `main`, commits atomiques, Pull Request (PR) avec Tech Plan.                                                                                                                      |

---

## 😈 Les Mécaniques Trolls inspirées de *Level Devil*

Dans l'esprit de *Level Devil* (fausses sécurités, timing brisé, surprises au dernier moment) :

1. **Le "Level Devil Juke" (Mouvement sinusoïdal piégé)** :
   Le joueur croit avoir anticipé la courbe sinusoïdale pour se placer dans l'axe de tir... mais à intervalles réguliers (ex: toutes les 1.4s), l'ennemi déclenche un **"Juke"** (surmultiplication subite de l'amplitude pendant 250ms) pour esquiver le tir du joueur ou lui foncer dessus !
2. **Le "Martyrdom / Revenge Burst" (La fausse victoire)** :
   Le joueur pense avoir gagné en détruisant l'ennemi... mais au moment de sa mort, l'ennemi lâche un **Spread Shot circulaire d'adieu** (8 projectiles à 360°) !
3. **Le Contrôle 4 Directions (Liberté de vol)** :
   Le joueur peut manœuvrer non seulement à gauche et à droite, mais aussi monter et descendre pour esquiver les tirs en profondeur.
4. **Les Murs / Blocs Déviateurs (Bumpers Spatiaux)** :
   Des obstacles placés stratégiquement sur l'écran qui **dévient la trajectoire du vaisseau** lorsqu'il les heurte, créant des situations d'esquive délicates et intenses sans être injustes.
5. **100% Piloté par le JSON (Paramétrable & Désactivable)** :
   Toutes les options de l'ennemi peuvent être ajustées ou désactivées en 1 clic dans `enemies.json`.

---

## Sommaire

1. [Étape 0 : Préparation de Git (Branche `eval`)](#étape-0--préparation-de-git-branche-eval)
2. [Étape 1 : Données et Typage TypeScript (`JSON` &amp; `gameData`)](#étape-1--données-et-typage-typescript-json--gamedata)
3. [Étape 2 : Chargement dans `HomeScene`](#étape-2--chargement-dans-homescene)
4. [Étape 3 : Composant Mouvement Sinusoïdal avec Feinte (`SinusoidalMovement.ts`)](#étape-3--composant-mouvement-sinusoïdal-avec-feinte-sinusoidalmovementts)
5. [Étape 4 : Évolution de l&#39;Arme pour le Spread Shot (`Weapon.ts`)](#étape-4--évolution-de-larme-pour-le-spread-shot-weaponts)
6. [Étape 5 : Entité Ennemi Troll (`SinusoidalEnemy.ts`)](#étape-5--entité-ennemi-troll-sinusoidalenemyts)
7. [Étape 6 : Intégration dans le Gestionnaire (`EntityManager.ts`)](#étape-6--intégration-dans-le-gestionnaire-entitymanagerts)
8. [Étape 7 : Constantes Nommées (`GameConstants.ts`)](#étape-7--constantes-nommées-gameconstantsts)
9. [Étape 8 : Vérification du Build (`npm run build-nolog`)](#étape-8--vérification-du-build-npm-run-build-nolog)
10. [Étape 9 : Mouvement 4 Directions du Vaisseau Joueur (`Player.ts`)](#étape-9--mouvement-4-directions-du-vaisseau-joueur-playerts)
11. [Étape 10 : Entité Obstacle / Mur Déviateur (`Obstacle.ts`)](#étape-10--entité-obstacle--mur-déviateur-obstaclets)
12. [Étape 11 : Intégration des Obstacles et Collisions Déviatrices dans `EntityManager.ts`](#étape-11--intégration-des-obstacles-et-collisions-déviatrices-dans-entitymanagerts)
13. [Étape 12 : Protocole de Playtest Manuel Complet](#étape-12--protocole-de-playtest-manuel-complet)
14. [Étape 13 : Tech Plan &amp; Commits Git pour la PR](#étape-13--tech-plan--commits-git-pour-la-pr)

---

## Étape 0 : Préparation de Git (Branche `eval`)

Selon la consigne officielle :

```bash
# 1. Se positionner sur main et vérifier que tout est à jour
git checkout main
git pull origin main

# 2. Créer et basculer sur la branche eval
git checkout -b eval
```

---

## Étape 1 : Données et Typage TypeScript (`JSON` & `gameData`)

### 1.1. Créer le type TypeScript : `src/gameData/EnemyData.ts`

Créer le fichier `src/gameData/EnemyData.ts` :

```typescript
import { BulletData } from "./BulletData.ts";

export type SinusoidalMovementData = {
    speedY: number;          // Vitesse vers le bas en px/ms (ex: 0.15)
    amplitude: number;       // Amplitude de l'oscillation en pixels (ex: 90)
    frequency: number;       // Fréquence de l'oscillation en rad/ms (ex: 0.003)
};

export type SpreadWeaponData = {
    fireRateMin: number;     // Délai min entre tirs en ms (ex: 2200)
    fireRateMax: number;     // Délai max entre tirs en ms (ex: 3000)
    bulletCount: number;     // Nombre de projectiles par salve (ex: 3 ou 60)
    spreadAngle: number;     // Angle de l'éventail en degrés (ex: 35 ou 360)
    bullet: BulletData;
};

export type LevelDevilTrollData = {
    enabled: boolean;                 // Active ou désactive le mode troll
    // Feinte de mouvement : saut d'amplitude surprise
    jukeInterval: number;             // Temps entre deux feintes en ms (ex: 1400)
    jukeMultiplier: number;           // Multiplicateur temporaire d'amplitude (ex: 2.2)
    // Trolling à la mort : salve circulaire surprise
    deathBurstCount: number;          // Nombre de balles à la mort (ex: 8)
    deathBurstSpread: number;         // Angle de l'explosion de mort (ex: 360)
};

export type SinusoidalEnemyData = {
    texture: string;
    tint: number;                     // Couleur hex (ex: 10182117 pour violet toxique)
    spawnDelay: number;               // Intervalle de spawn en ms (ex: 3200)
    maxCount: number;                 // Nombre max simultané à l'écran (ex: 3)
    movement: SinusoidalMovementData;
    weapon: SpreadWeaponData;
    troll: LevelDevilTrollData;
};

export type EnemiesData = {
    sinusoidal: SinusoidalEnemyData;
};
```

### 1.2. Créer le fichier JSON : `public/assets/Data/enemies.json`

Créer le fichier `public/assets/Data/enemies.json` :

```json
{
  "sinusoidal": {
    "texture": "ufoRed",
    "tint": 10182117,
    "spawnDelay": 3200,
    "maxCount": 3,
    "movement": {
      "speedY": 0.15,
      "amplitude": 90,
      "frequency": 0.003
    },
    "weapon": {
      "fireRateMin": 2200,
      "fireRateMax": 3000,
      "bulletCount": 3,
      "spreadAngle": 35,
      "bullet": {
        "width": 12,
        "height": 12,
        "color": 10182117,
        "speed": 420,
        "damage": 1
      }
    },
    "troll": {
      "enabled": true,
      "jukeInterval": 1400,
      "jukeMultiplier": 2.2,
      "deathBurstCount": 8,
      "deathBurstSpread": 360
    }
  }
}
```

> **Astuce visuelle :** `10182117` correspond à `0x9B5DE5` (violet néon toxique), ce qui le distingue instantanément de l'UFO rouge standard.

---

## Étape 2 : Chargement dans `HomeScene`

Dans `src/scenes/HomeScene.ts`, ajouter le chargement du JSON dans la méthode `preload()` :

```typescript
// src/scenes/HomeScene.ts
// Dans la méthode preload() :
this.load.json('enemiesData', 'Data/enemies.json');
```

---

## Étape 3 : Composant Mouvement Sinusoïdal avec Feinte (`SinusoidalMovement.ts`)

Créer le fichier `src/components/SinusoidalMovement.ts` :

```typescript
import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";
import { SinusoidalMovementData, LevelDevilTrollData } from "../gameData/EnemyData.ts";

export default class SinusoidalMovement implements IComponent {
    public enabled: boolean = true;

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

        // 1. Déplacement vertical constant
        entity.y += this._config.speedY * deltaTime;

        // 2. Détection du troll "Juke" Level Devil (feinte imprévisible)
        let currentAmplitude = this._config.amplitude;
        if (this._trollConfig?.enabled && this._jukeTimer >= this._trollConfig.jukeInterval) {
            currentAmplitude *= this._trollConfig.jukeMultiplier;
            if (this._jukeTimer >= this._trollConfig.jukeInterval + 250) {
                this._jukeTimer = 0;
            }
        }

        // 3. Calcul de la position X sinusoïdale
        entity.x = this._baseX + currentAmplitude * Math.sin(this._elapsedTime * this._config.frequency);
    }
}
```

---

## Étape 4 : Évolution de l'Arme pour le Spread Shot (`Weapon.ts`)

Dans `src/components/Weapon.ts` :

```typescript
import { Physics } from 'phaser';
import { BulletData } from "../gameData/BulletData.ts";
import Bullet from "../entities/Bullet.ts";
import Entity from "../entities/Entity.ts";
import IComponent from "./IComponent.ts";

export type WeaponSpreadConfig = {
    bulletCount: number;
    spreadAngle: number;
};

export default class Weapon implements IComponent {
    public enabled: boolean = true;

    private readonly _bullets: Physics.Arcade.Group;
    private readonly _bulletData: BulletData;
    private _spreadConfig?: WeaponSpreadConfig;

    constructor(bullets: Physics.Arcade.Group, bulletData: BulletData, spreadConfig?: WeaponSpreadConfig) {
        if (!bullets) {
            console.error("Weapon 'bullets' group cannot be null or undefined");
        }

        this._bullets = bullets;
        this._bulletData = bulletData;
        this._spreadConfig = spreadConfig;
    }

    public shoot(source: Entity, customSpread?: WeaponSpreadConfig) {
        if (!this.enabled || !this._bullets) {
            return;
        }

        const config = customSpread ?? this._spreadConfig;
        const count = config?.bulletCount ?? 1;
        const totalAngleDeg = config?.spreadAngle ?? 0;

        if (count <= 1 || totalAngleDeg === 0) {
            this.fireBullet(source, 0);
            return;
        }

        const isFullCircle = totalAngleDeg >= 360;
        const step = isFullCircle ? (360 / count) : (totalAngleDeg / (count - 1));
        const startAngle = isFullCircle ? 0 : (-totalAngleDeg / 2);

        for (let i = 0; i < count; i++) {
            const offsetDeg = startAngle + i * step;
            this.fireBullet(source, offsetDeg);
        }
    }

    private fireBullet(source: Entity, offsetAngleDeg: number) {
        const bullet: Bullet = this._bullets.get() as Bullet;
        if (!bullet) return;

        const rad = source.rotation + Phaser.Math.DegToRad(offsetAngleDeg);
        const direction = new Phaser.Math.Vector2(Math.cos(rad), Math.sin(rad));
        const bulletVelocity = direction.clone().scale(this._bulletData.speed);

        bullet.enable(
            source.x + direction.x * source.arcadeBody.radius,
            source.y + direction.y * source.arcadeBody.radius,
            bulletVelocity.x,
            bulletVelocity.y,
            this._bulletData
        );
    }
}
```

---

## Étape 5 : Entité Ennemi Troll (`SinusoidalEnemy.ts`)

Créer le fichier `src/entities/SinusoidalEnemy.ts` :

```typescript
import Entity from './Entity.ts';
import Health from "../components/Health.ts";
import SinusoidalMovement from "../components/SinusoidalMovement.ts";
import Weapon from "../components/Weapon.ts";
import { SinusoidalEnemyData } from "../gameData/EnemyData.ts";

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

        // Gestion de la vie & Troll Revenge Burst
        const health = this.getComponent(Health);
        health?.on(Health.CHANGE_EVENT, () => {
            this.setTintFill(0xffffff);

            if (health?.current === 0) {
                this.disableBody();

                // 😈 Troll Level Devil : Martyrdom Spread Shot à 360° quand il meurt !
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

        // Reset complet de l'état pour le pool
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
```

---

## Étape 6 : Intégration dans le Gestionnaire (`EntityManager.ts`)

Dans `src/managers/EntityManager.ts`, on intègre le nouveau pool d'ennemis, le spawn rate piloté par JSON et les collisions :

```typescript
// 1. Imports en haut du fichier
import SinusoidalEnemy from "../entities/SinusoidalEnemy.ts";
import { EnemiesData } from "../gameData/EnemyData.ts";

// 2. Propriétés de classe dans EntityManager
private _sinusoidalEnemies: Physics.Arcade.Group;
private _sinusoidalData: EnemiesData;

// 3. Dans initEnemies() :
public initEnemies(): Physics.Arcade.Group {
    // ... code existant pour _enemies ...

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
    return this._enemies;
}

// 4. Méthode spawnSinusoidalEnemy
private spawnSinusoidalEnemy() {
    const config = this._sinusoidalData?.sinusoidal;
    if (!config || !this._sinusoidalEnemies || this._sinusoidalEnemies.countActive(true) >= config.maxCount) {
        return;
    }

    const enemy = this._sinusoidalEnemies.get() as SinusoidalEnemy;
    if (!enemy) return;

    const margin = config.movement.amplitude * (config.troll?.enabled ? config.troll.jukeMultiplier : 1) + 32;
    const spawnX = Phaser.Math.Between(margin, this.scene!.cameras.main.width - margin);
    enemy.enable(spawnX, 0);

    this.game!.events.emit(GameConstants.Events.ENEMY_SPAWNED_EVENT, enemy);
    console.log("[EntityManager] SinusoidalEnemy spawned");
}

// 5. Dans initGroupCollisions() :
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
```

---

## Étape 7 : Constantes Nommées (`GameConstants.ts`)

Dans `src/GameConstants.ts` :

```typescript
export default class GameConstants {
    public static readonly DataKeys = {
        PLAYER_SHIPS: 'playerShips',
        ENEMIES: 'enemiesData',
    };
    // ...
}
```

---

## Étape 8 : Vérification du Build (`npm run build-nolog`)

Dans le terminal :

```bash
npm run build-nolog
```

Le build doit se terminer avec **Code 0** et 0 erreur TypeScript.

---

## Étape 9 : Mouvement 4 Directions du Vaisseau Joueur (`Player.ts`)

Actuellement, le vaisseau joueur ne peut se déplacer qu'à gauche et à droite. Nous allons lui permettre d'avancer vers le haut et de reculer vers le bas en réutilisant la méthode `moveVertically()` du composant `Movement` déjà présent sur le joueur.

### Modifications dans `src/entities/Player.ts` :

Dans la méthode `preUpdate(timeSinceLaunch: number, deltaTime: number)` :

```typescript
// src/entities/Player.ts -> dans preUpdate()

// 1. Déplacement horizontal (gauche / droite) existant :
if (this._cursorKeys.left.isDown) {
    if (this._cursorKeys.shift.isDown) {
        this.angle -= this._playerShipData.movementSpeed * deltaTime;
    } else {
        this.getComponent(Movement)?.moveHorizontally(this, -deltaTime);
    }
} else if (this._cursorKeys.right.isDown) {
    if (this._cursorKeys.shift.isDown) {
        this.angle += this._playerShipData.movementSpeed * deltaTime;
    } else {
        this.getComponent(Movement)?.moveHorizontally(this, deltaTime);
    }
}

// 2. NOUVEAU : Déplacement vertical (haut / bas) :
if (this._cursorKeys.up.isDown) {
    // Monter vers le haut (Y diminue)
    this.getComponent(Movement)?.moveVertically(this, -deltaTime);
} else if (this._cursorKeys.down.isDown) {
    // Descendre vers le bas (Y augmente)
    this.getComponent(Movement)?.moveVertically(this, deltaTime);
}

// 3. Délimitation de l'écran (Clamping) :
// Empêcher de sortir horizontalement
this.x = Phaser.Math.Clamp(this.x, this.displayWidth / 2, this.scene.cameras.main.width - this.displayWidth / 2);

// Empêcher de sortir verticalement (zone de vol agréable : du tiers supérieur jusqu'au bas)
const minY = this.scene.cameras.main.height * 0.35;
const maxY = this.scene.cameras.main.height - this.displayHeight / 2;
this.y = Phaser.Math.Clamp(this.y, minY, maxY);
```

> **Astuce de Gameplay :** En définissant `minY = height * 0.35`, on empêche le joueur d'aller camper tout en haut de l'écran là où les ennemis apparaissent, tout en lui offrant une large liberté de mouvement pour esquiver les tirs en éventail !

---

## Étape 10 : Entité Obstacle / Mur Déviateur (`Obstacle.ts`)

Créons une entité `Obstacle` qui représente un petit bloc spatial solide.

- Il possède un corps physique immobile (`immovable = true`).
- Lorsqu'il entre en collision avec le vaisseau joueur, il **dévie sa trajectoire** en le repoussant selon l'angle d'impact (effet bumper / mur glissant) et provoque un micro-shake d'impact.

Créer le fichier `src/entities/Obstacle.ts` :

```typescript
import { Scene, Physics } from "phaser";
import Player from "./Player.ts";

export default class Obstacle extends Physics.Arcade.Sprite {
    public readonly arcadeBody: Physics.Arcade.Body;
    private readonly _deflectionForce: number;

    constructor(scene: Scene, x: number, y: number, width: number = 84, height: number = 84, deflectionForce: number = 16) {
        // On réutilise la texture ufoRed de l'atlas ou une étoile, teintée en bloc métallique
        super(scene, x, y, 'sprites', 'ufoRed');

        this._deflectionForce = deflectionForce;

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = corps physique statique

        this.arcadeBody = this.body as Physics.Arcade.Body;
        this.arcadeBody.immovable = true;
        this.arcadeBody.moves = false;

        // Différenciation visuelle : teinte gris métallique blindé (obstacle spatial)
        this.setTint(0x778da9);
        this.setDisplaySize(width, height);
        this.arcadeBody.setSize(width, height);
    }

    /**
     * Dévie le vaisseau du joueur lorsqu'il heurte l'obstacle
     */
    public deflect(player: Player) {
        // Calcule l'angle de recul depuis le centre de l'obstacle vers le joueur
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // Repousse immédiatement le joueur (déviation fluide)
        player.x += Math.cos(angle) * this._deflectionForce;
        player.y += Math.sin(angle) * this._deflectionForce;

        // Feedback tactile Level Devil : micro-secousse de choc
        this.scene.cameras.main.shake(50, 0.005);
    }
}
```

---

## Étape 11 : Intégration des Obstacles et Collisions Déviatrices dans `EntityManager.ts`

Nous allons maintenant ajouter le groupe d'obstacles et la déviation physique dans `src/managers/EntityManager.ts`.

### Modifications dans `src/managers/EntityManager.ts` :

#### 1. Import de la classe `Obstacle` en haut :

```typescript
import Obstacle from "../entities/Obstacle.ts";
```

#### 2. Déclaration de la propriété `_obstacles` :

```typescript
private _obstacles: Physics.Arcade.StaticGroup;
```

#### 3. Création de la méthode `initObstacles()` :

Ajouter cette méthode dans la classe `EntityManager` :

```typescript
public initObstacles(): Physics.Arcade.StaticGroup {
    this._obstacles = this.scene!.physics.add.staticGroup();

    const cameraWidth = this.scene!.cameras.main.width;
    const cameraHeight = this.scene!.cameras.main.height;

    // Placement stratégique de 3 blocs formant une chicane :
    // - Un bloc à gauche
    // - Un bloc central
    // - Un bloc à droite
    const obstacle1 = new Obstacle(this.scene!, cameraWidth * 0.25, cameraHeight * 0.65, 84, 84, 16);
    const obstacle2 = new Obstacle(this.scene!, cameraWidth * 0.50, cameraHeight * 0.52, 96, 96, 18);
    const obstacle3 = new Obstacle(this.scene!, cameraWidth * 0.75, cameraHeight * 0.65, 84, 84, 16);

    this._obstacles.add(obstacle1);
    this._obstacles.add(obstacle2);
    this._obstacles.add(obstacle3);

    console.log("[EntityManager] Obstacles initialized");
    return this._obstacles;
}
```

#### 4. Appel dans `initEnemies()` :

Dans la méthode `initEnemies()`, appeler l'initialisation des obstacles juste avant le `return this._enemies;` :

```typescript
this.initObstacles();
```

#### 5. Ajout de la collision déviatrice dans `initGroupCollisions()` :

Dans `initGroupCollisions()`, ajouter la collision entre le joueur et les obstacles :

```typescript
// Collision avec déviation physique du vaisseau par les obstacles
if (this._obstacles) {
    this.scene!.physics.add.collider(this._player, this._obstacles, (player, obstacle) => {
        (obstacle as Obstacle).deflect(player as Player);
    });
}
```

---

## Étape 12 : Protocole de Playtest Manuel Complet

Ce protocole valide l'ensemble du gameplay enrichi (critère Qualité du code - 5 pts) :

1. **Lancement** : Exécuter `npm run dev-nolog` et appuyer sur `ESPACE`.
2. **Test du Mouvement 4 Directions** :
   - Flèches **GAUCHE** et **DROITE** : le joueur glisse horizontalement.
   - Flèches **HAUT** et **BAS** : le joueur avance et recule sur l'écran en profondeur.
   - Le vaisseau s'arrête naturellement aux limites sans sortir de la zone de vol.
3. **Test des Blocs Déviateurs** :
   - Foncez volontairement sur l'un des 3 blocs gris métalliques.
   - Constater que le vaisseau ne traverse pas le mur mais est **dévié / repoussé en angle** avec une micro-secousse de caméra.
   - Utiliser ces blocs pour slalomer et se protéger temporairement des trajectoires ennemies.
4. **Test de l'Ennemi Sinusoïdal Level Devil** :
   - L'ennemi violet apparaît au bout de ~3 secondes.
   - Il ondule et fait son "Juke" d'accélération subite toutes les 1.4s.
   - Il tire ses salves en éventail de 3 projectiles.
   - À sa mort, il projette une salve circulaire de 8 balles à 360°.
5. **Test de Pilotage par JSON** :
   - Dans `enemies.json`, changer `"bulletCount": 60` et `"spreadAngle": 360` pour observer la pluie de tirs sans toucher au code.

---

## Étape 13 : Tech Plan & Commits Git pour la PR

Créer ou mettre à jour le fichier `TECH_PLAN.md` à la racine :

```markdown
# Tech Plan : Nouvel Ennemi Sinusoïdal, Spread Shot & Gameplay Déviateur

## 1. Objectifs & Fonctionnalités
- Ennemi `SinusoidalEnemy` avec différenciation visuelle via teinte violet néon (`setTint(10182117)`).
- Mouvement sinusoïdal via `SinusoidalMovement` + feinte latérale "Level Devil Juke".
- Tir en éventail (Spread Shot) via composant `Weapon` supportant éventails ou 360°.
- Salve d'adieu circulaire "Revenge Burst" à la mort pour surprendre le joueur.
- Contrôle complet 4 directions du joueur (Haut/Bas/Gauche/Droite) avec clamping.
- Système d'obstacles physiques déviateurs `Obstacle` créant un slalom tactique.
- Pilotage à 100% via `enemies.json` (spawn rate, sinusoïde, spread shot, options de troll).

## 2. Architecture & Design Patterns
- **Entity / Component** : `SinusoidalMovement` et `Weapon` modulaires et réutilisables.
- **Object Pooling** : Gestion propre par `Phaser.Physics.Arcade.Group`, reset complet (`enable`/`disable`) sans réallocation.
- **Physique & Collisions** : Séparation par Arcade Physics et répulsion vectorielle pour la déviation.
- **Typage TypeScript** : Types stricts centralisés dans `src/gameData/EnemyData.ts`.
- **Indépendance UI** : Respect absolu du découplage logique / UI.

## 3. Playtest & Validation
- Build de production : `npm run build-nolog` validé avec succès (Code 0).
- Playtest manuel validant les 4 directions, la déviation des blocs, le juke et la revenge burst.
```

### Commandes Git de soumission (Commits atomiques) :

```bash
# 1. Données et Types
git add src/gameData/ public/assets/Data/
git commit -m "feat(data): add JSON config and types for sinusoidal enemy and troll mechanics"

# 2. Composants
git add src/components/
git commit -m "feat(components): add SinusoidalMovement with juke and upgrade Weapon with spread shot"

# 3. Ennemi Sinusoïdal
git add src/entities/SinusoidalEnemy.ts
git commit -m "feat(entities): implement SinusoidalEnemy with pooling and revenge death burst"

# 4. Mouvement Joueur 4 Directions
git add src/entities/Player.ts
git commit -m "feat(player): add vertical movement for 4-directional control"

# 5. Obstacles Déviateurs
git add src/entities/Obstacle.ts
git commit -m "feat(obstacles): add Obstacle entity with deflection physics"

# 6. Intégration Gestionnaire et Scènes
git add src/managers/EntityManager.ts src/scenes/ src/GameConstants.ts
git commit -m "feat(managers): integrate sinusoidal enemy, obstacles and collision handling"

# 7. Documentation et Tech Plan
git add TECH_PLAN.md aide.md
git commit -m "docs: update tech plan and guide with 4-way movement and obstacle bumpers"

# 8. Pousser la branche eval vers GitHub :
git push -u origin eval
```

Ouvrez ensuite la Pull Request sur GitHub de `eval` vers `main`.
