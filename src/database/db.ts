import * as SQLite from 'expo-sqlite';

export async function initializeDatabase(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_plan_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_plan_id) REFERENCES workout_plans (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_plan_id INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      duration INTEGER,
      FOREIGN KEY (workout_plan_id) REFERENCES workout_plans (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS workout_session_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      reps_completed INTEGER,
      weight_used REAL,
      is_completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (workout_session_id) REFERENCES workout_sessions (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      weight_kg REAL,
      body_fat_pct REAL,
      chest_cm REAL,
      waist_cm REAL,
      hips_cm REAL,
      bicep_cm REAL,
      thigh_cm REAL,
      notes TEXT
    );
  `);

  // Migration for existing tables to add local_image_uri
  try {
    await db.execAsync('ALTER TABLE exercises ADD COLUMN local_image_uri TEXT;');
  } catch (e) {
    // Column likely already exists
  }
}
