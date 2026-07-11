import { getAntibioticById } from "../data/antibiotics.js";
import { getBacteriumById } from "../data/bacteria.js";
import { Bacteria } from "../entities/Bacteria.js";
import { Projectile } from "../entities/Projectile.js";
import { Tower } from "../entities/Tower.js";
import { CombatSystem } from "../systems/CombatSystem.js";

const Phaser = window.Phaser;

const PATH = [
  { x: 40, y: 430 },
  { x: 200, y: 355 },
  { x: 335, y: 405 },
  { x: 505, y: 275 },
  { x: 650, y: 325 },
  { x: 900, y: 165 }
];

const ENEMY_COLOR_BY_ID = {
  strep_pyogenes: 0xcf4b42,
  mssa: 0xd2a43a,
  mrsa: 0x7b4bbb,
  ecoli: 0x3e9f65,
  mixed_anaerobes: 0x6d6a78
};

const TOWER_COLOR_BY_ID = {
  cefazolin: 0x56a3d9,
  vancomycin: 0x8f68d8,
  metronidazole: 0x7e6fc8
};

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("LevelScene");
  }

  create() {
    this.health = 30;
    this.credits = 120;
    this.wave = 1;
    this.totalEnemies = 6;
    this.spawned = 0;
    this.defeated = 0;
    this.escaped = 0;
    this.status = "Defiende";
    this.lastResolution = null;
    this.enemies = [];
    this.projectiles = [];

    this.antibiotic = getAntibioticById("cefazolin");
    this.bacterium = getBacteriumById("mssa");
    this.hudPanel = window.atbHudPanel;
    this.combatSystem = new CombatSystem({
      level: 1,
      activeTherapy: {
        antibioticIds: [this.antibiotic.id],
        durationSeconds: 0
      },
      infectionState: {
        severity: "moderate",
        bacteriaIds: [this.bacterium.id],
        polymicrobial: false,
        sourceControlRequired: false,
        sourceControlCompleted: false,
        bacterialLoad: "moderate"
      }
    });

    this.drawBattlefield();
    this.createTower();
    this.createWaveTimer();
    this.renderHud();
  }

  update(_, delta) {
    if (this.isFinished()) return;

    const deltaSeconds = delta / 1000;
    this.tower.update(deltaSeconds);
    this.updateEnemies(deltaSeconds);
    this.updateTowerFire();
    this.updateProjectiles(deltaSeconds);
    this.checkEndState();
    this.renderHud();
  }

  drawBattlefield() {
    this.add.rectangle(480, 270, 960, 540, 0x6faa58);

    for (let i = 0; i < 120; i += 1) {
      this.add.circle(
        Phaser.Math.Between(10, 950),
        Phaser.Math.Between(40, 520),
        Phaser.Math.Between(1, 3),
        0xd4d28e,
        0.28
      );
    }

    this.add.rectangle(480, 22, 960, 44, 0x45654f, 1);
    this.add.rectangle(480, 518, 960, 44, 0x6b4d32, 1);
    this.add.rectangle(480, 520, 900, 24, 0x8b6b45, 1).setStrokeStyle(3, 0x3f2b1a);

    const pathLine = this.add.graphics();
    pathLine.lineStyle(54, 0xd8bd77, 0.45);
    pathLine.beginPath();
    pathLine.moveTo(PATH[0].x, PATH[0].y);
    for (const point of PATH.slice(1)) {
      pathLine.lineTo(point.x, point.y);
    }
    pathLine.strokePath();

    pathLine.lineStyle(34, 0xefe2a4, 0.75);
    pathLine.beginPath();
    pathLine.moveTo(PATH[0].x, PATH[0].y);
    for (const point of PATH.slice(1)) {
      pathLine.lineTo(point.x, point.y);
    }
    pathLine.strokePath();

    this.add.text(480, 26, "Ruta de infeccion", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#fff6d6",
      stroke: "#223420",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(835, 112, "Paciente", {
      fontFamily: "Georgia, serif",
      fontSize: "20px",
      color: "#fff6d6",
      stroke: "#562b28",
      strokeThickness: 5
    }).setOrigin(0.5);
    this.add.circle(900, 165, 32, 0xc64d47, 0.92).setStrokeStyle(4, 0xf9dfb2, 1);
  }

  createTower() {
    const balance = this.antibiotic.gameBalance;
    this.tower = new Tower(this, {
      id: this.antibiotic.id,
      name: this.antibiotic.name,
      x: 445,
      y: 214,
      range: balance.range,
      fireRate: balance.fireRate,
      power: balance.power,
      projectileSpeed: balance.projectileSpeed,
      color: TOWER_COLOR_BY_ID[this.antibiotic.id] ?? 0x56a3d9
    });
  }

  createWaveTimer() {
    this.spawnEnemy();
    this.time.addEvent({
      delay: 1050,
      repeat: this.totalEnemies - 2,
      callback: () => this.spawnEnemy()
    });
  }

  spawnEnemy() {
    if (this.spawned >= this.totalEnemies) return;

    const balance = this.bacterium.gameBalance;
    const enemy = new Bacteria(this, {
      id: this.bacterium.id,
      name: this.bacterium.displayName,
      shortName: this.bacterium.shortName,
      path: PATH,
      health: balance.baseHealth,
      speed: balance.speed,
      patientDamage: balance.patientDamage,
      rewardCredits: balance.rewardCredits,
      color: ENEMY_COLOR_BY_ID[this.bacterium.id] ?? 0xd2a43a
    });
    enemy.body.y += Phaser.Math.Between(-10, 10);
    this.enemies.push(enemy);
    this.spawned += 1;
  }

  updateEnemies(deltaSeconds) {
    for (const enemy of this.enemies) {
      enemy.update(deltaSeconds);
      if (enemy.reachedPatient) {
        this.health = Math.max(0, this.health - enemy.patientDamage);
        this.escaped += 1;
      }
    }

    this.enemies = this.enemies.filter((enemy) => enemy.isAlive && !enemy.reachedPatient);
  }

  updateTowerFire() {
    if (!this.tower.canFire()) return;

    const target = this.enemies.find((enemy) => this.tower.distanceTo(enemy) <= this.tower.range);
    if (!target) return;

    this.tower.markFired();
    this.projectiles.push(new Projectile(this, {
      x: this.tower.x,
      y: this.tower.y - 16,
      target,
      antibioticId: this.tower.id,
      baseDamage: this.tower.power * 32,
      speed: this.tower.projectileSpeed,
      color: TOWER_COLOR_BY_ID[this.tower.id] ?? 0x56a3d9
    }));
  }

  updateProjectiles(deltaSeconds) {
    for (const projectile of this.projectiles) {
      const state = projectile.update(deltaSeconds);
      if (state === "hit") {
        this.resolveImpact(projectile);
      }
    }

    this.projectiles = this.projectiles.filter((projectile) => projectile.isActive);
  }

  resolveImpact(projectile) {
    const target = projectile.target;
    const impact = this.combatSystem.resolveProjectileImpact({
      antibioticId: projectile.antibioticId,
      bacteriaId: target.id,
      baseDamage: projectile.baseDamage
    });

    this.lastResolution = impact;
    this.showImpactText(target, impact);

    if (target.takeDamage(impact.appliedDamage)) {
      this.defeated += 1;
      this.credits += target.rewardCredits;
    }

    projectile.destroy();
  }

  showImpactText(target, impact) {
    const text = impact.damageMultiplier > 0
      ? `${Math.round(impact.appliedDamage)}`
      : "0";

    const label = this.add.text(target.body.x, target.body.y - 55, text, {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: impact.damageMultiplier > 0 ? "#fff2a6" : "#dbe1e8",
      stroke: "#1d2b22",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: label,
      y: label.y - 30,
      alpha: 0,
      duration: 700,
      onComplete: () => label.destroy()
    });
  }

  checkEndState() {
    if (this.health <= 0) {
      this.status = "Derrota";
      this.showEndBanner("Derrota", 0xb94b46);
      return;
    }

    const waveFinished = this.spawned === this.totalEnemies && this.enemies.length === 0;
    if (waveFinished) {
      this.status = "Victoria";
      this.showEndBanner("Victoria", 0x4f8e5b);
    }
  }

  showEndBanner(label, color) {
    if (this.endBanner) return;

    this.endBanner = this.add.rectangle(480, 270, 360, 92, 0x152018, 0.88)
      .setStrokeStyle(4, color, 1);
    this.add.text(480, 270, label, {
      fontFamily: "Georgia, serif",
      fontSize: "42px",
      color: "#fff6d6",
      stroke: "#1a2418",
      strokeThickness: 6
    }).setOrigin(0.5);
  }

  isFinished() {
    return this.status === "Victoria" || this.status === "Derrota";
  }

  renderHud() {
    if (!this.hudPanel) return;

    this.hudPanel.render({
      health: this.health,
      credits: this.credits,
      wave: this.wave,
      remaining: this.enemies.length,
      status: this.status,
      effectiveness: this.lastResolution?.effectiveness,
      feedbackCode: this.lastResolution?.feedbackCodes?.[0],
      towerName: this.antibiotic.name,
      towerRange: this.tower.range,
      towerRate: this.tower.fireRate,
      bacteriaName: this.bacterium.shortName,
      spawned: this.spawned,
      total: this.totalEnemies
    });
  }
}
