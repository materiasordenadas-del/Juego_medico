export class FormationSystem {
  constructor({ columns = 5, rows = 3, columnSpacing = 2.4, rowSpacing = 3.1, playerX = -16, enemyX = 16 } = {}) {
    this.columns = columns; this.rows = rows; this.columnSpacing = columnSpacing; this.rowSpacing = rowSpacing;
    this.slots = ["player", "enemy"].flatMap((team) => Array.from({ length: rows * columns }, (_, index) => {
      const row = Math.floor(index / columns); const column = index % columns;
      return { id: `${team}_r${row + 1}_c${column + 1}`, team, row, column, line: this.lineFor(column), occupiedBy: null, position: this.toVector(row, column, team, playerX, enemyX) };
    }));
  }
  toVector(row, column, team, playerX, enemyX) {
    const z = (row - (this.rows - 1) / 2) * this.rowSpacing;
    const x = team === "player" ? playerX + column * this.columnSpacing : enemyX - column * this.columnSpacing;
    return { x, y: 0, z };
  }
  slotsFor(team) { return this.slots.filter((slot) => slot.team === team); }
  lineFor(column) { return column === this.columns - 1 ? "front" : column === this.columns - 2 ? "second" : "rear"; }
  slotsInLine(team, line) { return this.slotsFor(team).filter((slot) => slot.line === line); }
  get(id) { return this.slots.find((slot) => slot.id === id) ?? null; }
  place(slotId, unitId) { const slot = this.get(slotId); if (!slot || slot.occupiedBy) return false; slot.occupiedBy = unitId; return true; }
  clear(slotId) { const slot = this.get(slotId); if (slot) slot.occupiedBy = null; }
}
