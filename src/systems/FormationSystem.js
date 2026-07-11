export class FormationSystem {
  constructor({ columns = 5, rows = 3, spacing = 2.45, playerZ = 3.7, enemyZ = -3.7 }) {
    this.columns = columns; this.rows = rows; this.spacing = spacing;
    this.slots = ["player", "enemy"].flatMap((team) => Array.from({ length: rows * columns }, (_, index) => {
      const row = Math.floor(index / columns); const column = index % columns;
      return { id: `${team}_r${row + 1}_c${column + 1}`, team, row, column, occupiedBy: null, position: this.toVector(row, column, team, playerZ, enemyZ) };
    }));
  }
  toVector(row, column, team, playerZ, enemyZ) { return { x: (column - (this.columns - 1) / 2) * this.spacing, y: 0, z: team === "player" ? playerZ + row * 1.1 : enemyZ - row * 1.1 }; }
  slotsFor(team) { return this.slots.filter((slot) => slot.team === team); }
  get(id) { return this.slots.find((slot) => slot.id === id) ?? null; }
  place(slotId, unitId) { const slot = this.get(slotId); if (!slot || slot.occupiedBy) return false; slot.occupiedBy = unitId; return true; }
  clear(slotId) { const slot = this.get(slotId); if (slot) slot.occupiedBy = null; }
}
