export class Tower {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.x = config.x;
    this.y = config.y;
    this.range = config.range;
    this.fireRate = config.fireRate;
    this.power = config.power;
    this.projectileSpeed = config.projectileSpeed;
    this.cooldown = 0;

    this.base = scene.add.circle(this.x, this.y + 10, 31, 0x6d4b2d, 1)
      .setStrokeStyle(4, 0x3d2818, 1);
    this.body = scene.add.polygon(
      this.x,
      this.y,
      [-24, 14, 0, -34, 24, 14],
      config.color,
      1
    ).setStrokeStyle(3, 0xf6e0a8, 0.9);
    this.cap = scene.add.circle(this.x, this.y - 6, 12, 0xf7f4dc, 1)
      .setStrokeStyle(2, 0x2e526d, 1);
    this.rangeView = scene.add.circle(this.x, this.y, this.range, 0xffffff, 0.05)
      .setStrokeStyle(1, 0xf8f0c8, 0.18);
  }

  update(deltaSeconds) {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);
  }

  canFire() {
    return this.cooldown === 0;
  }

  markFired() {
    this.cooldown = 1 / this.fireRate;
    this.scene.tweens.add({
      targets: [this.body, this.cap],
      scaleX: 1.07,
      scaleY: 1.07,
      yoyo: true,
      duration: 80
    });
  }

  distanceTo(target) {
    return Math.hypot(target.body.x - this.x, target.body.y - this.y);
  }
}
