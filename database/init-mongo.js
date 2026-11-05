// ── init-mongo.js ─────────────────────────────────────────────────────────────
// Runs automatically on first container start inside docker-entrypoint-initdb.d/
// Creates a dedicated app user with readWrite access to faculty_feedback DB

db = db.getSiblingDB('faculty_feedback');

db.createUser({
  user: 'feedback_user',
  pwd:  'feedback_pass',
  roles: [
    { role: 'readWrite', db: 'faculty_feedback' }
  ]
});

// Create initial collections so the app doesn't error on first run
db.createCollection('users');
db.createCollection('reports');
db.createCollection('submissions');

print('✅ MongoDB initialized — faculty_feedback database and user created');
