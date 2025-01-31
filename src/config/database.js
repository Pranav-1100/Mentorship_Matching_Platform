const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users Table (with all columns included from the start)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('mentor', 'mentee', 'both')) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      total_sessions INTEGER DEFAULT 0,
      average_rating DECIMAL(3,2) DEFAULT 0,
      last_active TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Profiles Table
    db.run(`CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      full_name TEXT NOT NULL,
      bio TEXT,
      industry TEXT,
      years_experience INTEGER,
      availability JSON,
      age INTEGER,
      photo_url TEXT,
      location_city TEXT,
      location_country TEXT,
      education JSON,
      work_experience JSON,
      current_company TEXT,
      current_position TEXT,
      languages JSON,
      timezone TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      website_url TEXT,
      achievements TEXT,
      certificates JSON,
      interests JSON,
      career_goals JSON,
      project_portfolio JSON,
      preferred_learning_style TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Skills Categories Table
    db.run(`CREATE TABLE IF NOT EXISTS skill_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    )`);

    // Insert default skill categories
    db.run(`INSERT OR IGNORE INTO skill_categories (name) VALUES 
      ('Technical Skills'),
      ('Soft Skills'),
      ('Industry Knowledge'),
      ('Tools & Technologies'),
      ('Languages'),
      ('Frameworks'),
      ('Methodologies')`);

    // Skills Table
    db.run(`CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      category_id INTEGER REFERENCES skill_categories(id)
    )`);

    // User Skills Table
    db.run(`CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      skill_id INTEGER REFERENCES skills(id),
      proficiency_level INTEGER CHECK(proficiency_level BETWEEN 1 AND 5),
      UNIQUE(user_id, skill_id)
    )`);

    // Connections Table (with all columns included from the start)
    db.run(`CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id TEXT REFERENCES users(id),
      mentee_id TEXT REFERENCES users(id),
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      meeting_frequency TEXT,
      last_meeting_date TIMESTAMP,
      next_meeting_date TIMESTAMP,
      goals JSON,
      progress_notes JSON,
      last_message_at TIMESTAMP,
      last_message TEXT,
      is_active BOOLEAN DEFAULT true,
      UNIQUE(mentor_id, mentee_id)
    )`);

    // Notifications Table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Matching Preferences Table
    db.run(`CREATE TABLE IF NOT EXISTS matching_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id) UNIQUE,
      preferred_industries TEXT,
      min_experience INTEGER,
      max_experience INTEGER,
      preferred_meeting_frequency TEXT,
      communication_style TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Chat Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER REFERENCES connections(id),
      sender_id TEXT REFERENCES users(id),
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
    )`);

    // Match Scores Cache Table
    db.run(`CREATE TABLE IF NOT EXISTS match_scores_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      candidate_id TEXT REFERENCES users(id),
      score FLOAT,
      last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      UNIQUE(user_id, candidate_id)
    )`);

    // Mentoring Fields Table
    db.run(`CREATE TABLE IF NOT EXISTS mentoring_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default mentoring fields
    db.run(`INSERT OR IGNORE INTO mentoring_fields (name, category) VALUES 
      ('Web Development', 'Technology'),
      ('Mobile Development', 'Technology'),
      ('Data Science', 'Technology'),
      ('UI/UX Design', 'Design'),
      ('Product Management', 'Business'),
      ('Digital Marketing', 'Marketing'),
      ('Career Guidance', 'Professional Development'),
      ('Leadership', 'Professional Development'),
      ('Entrepreneurship', 'Business')`);

    // Mentor Details Table
    db.run(`CREATE TABLE IF NOT EXISTS mentor_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id),
      hourly_rate DECIMAL(10,2),
      currency TEXT DEFAULT 'USD',
      mentoring_field_id INTEGER REFERENCES mentoring_fields(id),
      experience_description TEXT,
      session_details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, mentoring_field_id)
    )`);

    // Sessions Table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id TEXT REFERENCES users(id),
      mentee_id TEXT REFERENCES users(id),
      connection_id INTEGER REFERENCES connections(id),
      scheduled_at TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT CHECK(status IN ('upcoming', 'completed', 'cancelled')) NOT NULL DEFAULT 'upcoming',
      meeting_link TEXT,
      topic TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reviews Table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      connection_id INTEGER REFERENCES connections(id),
      reviewer_id TEXT REFERENCES users(id),
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Applications Table
    db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id TEXT REFERENCES users(id),
      mentee_id TEXT REFERENCES users(id),
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mentor_id, mentee_id)
    )`);

    console.log('Database tables initialized');
  });
}

const dbAsync = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = { db, dbAsync, initializeDatabase };