import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_Kv7ot8NXgsZO@ep-plain-hat-abohg820-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require');

await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS points_exact_pos1 INTEGER NOT NULL DEFAULT 3`;
await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS points_exact_pos2 INTEGER NOT NULL DEFAULT 2`;
await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS points_exact_pos3 INTEGER NOT NULL DEFAULT 1`;
await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS points_exact_pos4 INTEGER NOT NULL DEFAULT 0`;
console.log('✓ Columnas de posición exacta añadidas');
