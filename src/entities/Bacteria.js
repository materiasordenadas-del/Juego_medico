export class Bacteria {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.path = config.path;
    this.pathIndex = 0;
    this.speed = config.speed;
    this.maxHealth = config.health;
    this.health = config.health;
    this.patientDamage = config.patientDamage;
    this.rewardCredits = config.rewardCredits;
    this.isAlive = true;
    this.reachedPatient = false;

    const start = this.path[0];
    this.body = scene.add.container(start.x, start.y);
    this.shadow = scene.add.ellipse(0, 15, 34, 12, 0x244026, 0.28);
    this.core = scene.add.ellipse(0, 0, 34, 28, config.color, 1);
    this.ring = scene.add.ellipse(0, 0, 40, 32).setStrokeStyle(3, 0x2b2230, 0.55);
    this.label = scene.add.text(0, -35, config.shortName, {
      fontFamily: "Georgia, serif",
      fontSize: "13px",
      color: "#fff8d8",
      stroke: "#26311f",
      strokeThickness: 3
    }).setOrigin(0.5);
    this.healthBack = scene.add.rectangle(0, 26, 42, 5, 0x2b2b2b, 0.75);
    this.healthBar = scene.add.rectangle(-21, 26, 42, 5, 0xc93f35, 1).setOrigin(0, 0.5);
    this.body.add([this.shadow, this.core, this.ring, this.label, this.healthBack, this.healthBar]);
  }

  update(deltaSeconds) {
    if (!this.isAlive || this.reachedPatient) return;

    const target = this.path[this.pathIndex + 1];
    if (!target) {
      this.reachedPatient = true;
      this.destroy();
      return;
    }

    const dx = target.x - this.body.x;
    const dy = target.y - this.body.y;
    const distance = Math.hypot(dx, dy);
    const step = this.speed * deltaSeconds;

    if (distance <= step) {
      this.body.setPosition(target.x, target.y);
      this.pathIndex += 1;
      return;
    }

    this.body.x += (dx / distance) * step;
    this.body.y += (dy / distance) * step;
  }

  takeDamage(amount) {
    if (!this.isAlive || amount <= 0) return false;

    this.health = Math.max(0, this.health - amount);
    this.healthBar.width = 42 * (this.health / this.maxHealth);
    this.scene.tweens.add({
      targets: this.core,
      scaleX: 1.12,
      scaleY: 1.12,
      yoyo: true,
      duration: 70
    });

    if (this.health === 0) {
      this.isAlive = false;
      this.destroy();
      return true;
    }

    return false;
  }

  destroy() {
    if (this.body?.active) {
      this.body.destroy();
    }
  }
}
