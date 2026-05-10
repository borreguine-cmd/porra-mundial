import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_Kv7ot8NXgsZO@ep-plain-hat-abohg820-pooler.eu-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require');

await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS real_champion TEXT`;
await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS real_mvp TEXT`;
await sql`ALTER TABLE config ADD COLUMN IF NOT EXISTS real_top_scorer TEXT`;

await sql`
  CREATE TABLE IF NOT EXISTS extra_results (
    user_id          TEXT PRIMARY KEY,
    champion_correct BOOLEAN NOT NULL DEFAULT FALSE,
    mvp_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    top_scorer_correct BOOLEAN NOT NULL DEFAULT FALSE
  )
`;
console.log('✓ Tabla extra_results y columnas de resultado creadas');
