export class Projectile {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.target = config.target;
    this.antibioticId = config.antibioticId;
    this.baseDamage = config.baseDamage;
    this.speed = config.speed;
    this.isActive = true;

    this.body = scene.add.circle(config.x, config.y, 7, config.color, 1)
      .setStrokeStyle(2, 0xffffff, 0.85);
    this.trail = scene.add.circle(config.x, config.y, 13, config.color, 0.22);
  }

  update(deltaSeconds) {
    if (!this.isActive || !this.target?.isAlive) {
      this.destroy();
      return "expired";
    }

    const dx = this.target.body.x - this.body.x;
    const dy = this.target.body.y - this.body.y;
    const distance = Math.hypot(dx, dy);
    const step = this.speed * deltaSeconds;

    if (distance <= step || distance < 9) {
      return "hit";
    }

    this.body.x += (dx / distance) * step;
    this.body.y += (dy / distance) * step;
    this.trail.setPosition(this.body.x, this.body.y);
    return "moving";
  }

  destroy() {
    this.isActive = false;
    if (this.body?.active) this.body.destroy();
    if (this.trail?.active) this.trail.destroy();
  }
}
