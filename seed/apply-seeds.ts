import { getDb, runMigrations } from "@rxflow/shared-db";

runMigrations();
const db = getDb();

const labs = [
  { id: "lab-north", name: "North Optical Lab", capacity: 50, sla_hours: 24, accepts_lens_types: ["single-vision", "bifocal"] },
  { id: "lab-south", name: "South Precision Lens", capacity: 30, sla_hours: 48, accepts_lens_types: ["single-vision", "progressive"] },
  { id: "lab-east", name: "East Specialty Optics", capacity: 15, sla_hours: 72, accepts_lens_types: ["progressive", "high-index"] },
];

const insertLab = db.prepare(
  `INSERT OR IGNORE INTO labs (id, name, capacity, sla_hours, accepts_lens_types) VALUES (@id, @name, @capacity, @sla_hours, @accepts_lens_types)`
);
for (const lab of labs) {
  insertLab.run({ ...lab, accepts_lens_types: JSON.stringify(lab.accepts_lens_types) });
}

console.log(`Seeded ${labs.length} labs. See seed-manifest.md for the 10 planted decisions/defects/scenarios.`);
