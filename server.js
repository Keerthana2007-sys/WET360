const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'wet360_jwt_secret_key_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// JWT Token generator
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    if (req.method === 'GET') {
      req.user = { id: 0, name: 'Guest', username: 'guest', role: 'Viewer', status: 'Approved' };
      return next();
    }
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    
    const user = await db.getById('users', decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.status !== 'Approved') {
      return res.status(403).json({ error: 'Account is pending administrator approval.' });
    }

    req.user = user;
    next();
  });
}

// Role Authorization Middleware
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires role: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
}

// Audit Logger helper
async function logAction(userId, action, table, recordId) {
  try {
    await db.create('activity_logs', {
      user_id: userId,
      action,
      table_affected: table,
      record_id: recordId,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Audit logger error:', e);
  }
}

// ================= AUTH & USER PORTAL ROUTES =================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, username, password, age, gender, occupation, income, education, location, farmer_status, shg_membership } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required' });
    }

    const existingEmail = await db.query('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const existingUsername = await db.query('users', u => u.username && u.username.toLowerCase() === username.toLowerCase());
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username already registered' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = await db.create('users', {
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      role: 'Member', // Default role for community members
      status: 'Approved', // Auto-approved for community members
      age: age ? parseInt(age) : null,
      gender: gender || null,
      occupation: occupation || null,
      income: income ? parseFloat(income) : null,
      education: education || null,
      location: location || null,
      farmer_status: !!farmer_status,
      shg_membership: !!shg_membership
    });

    res.status(201).json({ 
      message: 'Registration successful.',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    const users = await db.query('users', u => 
      u.email.toLowerCase() === usernameOrEmail.toLowerCase() ||
      u.username.toLowerCase() === usernameOrEmail.toLowerCase()
    );
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    const user = users[0];
    const validPass =
  password === user.password ||
  bcrypt.compareSync(password, user.password);
    if (!validPass) {
      return res.status(400).json({ error: 'Invalid username/email or password' });
    }

    if (user.status !== 'Approved') {
      return res.status(403).json({ error: 'Account is pending approval.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        gender: user.gender,
        age: user.age,
        farmer_status: user.farmer_status,
        shg_membership: user.shg_membership,
        income: user.income,
        education: user.education,
        location: user.location,
        occupation: user.occupation
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (req.user.id === 0) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.user);
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    const { name, age, gender, occupation, income, education, location, farmer_status, shg_membership } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (age !== undefined) updates.age = age ? parseInt(age) : null;
    if (gender !== undefined) updates.gender = gender;
    if (occupation !== undefined) updates.occupation = occupation;
    if (income !== undefined) updates.income = income ? parseFloat(income) : null;
    if (education !== undefined) updates.education = education;
    if (location !== undefined) updates.location = location;
    if (farmer_status !== undefined) updates.farmer_status = !!farmer_status;
    if (shg_membership !== undefined) updates.shg_membership = !!shg_membership;

    const updatedUser = await db.update('users', req.user.id, updates);
    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= ADMIN & USER MANAGEMENT =================

app.get('/api/users', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  const users = await db.getAll('users');
  res.json(users.map(({ password, ...u }) => u));
});

app.put('/api/users/:id/role', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { role, status } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const updates = {};
    if (role && ['Admin', 'Staff', 'Member'].includes(role)) updates.role = role;
    if (status && ['Approved', 'Pending'].includes(status)) updates.status = status;

    const updated = await db.update('users', userId, updates);
    await logAction(req.user.id, `UPDATE_USER_${userId}`, 'users', userId);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/audit-logs', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const logs = await db.getAll('activity_logs');
  const users = await db.getAll('users');
  const enriched = logs.map(log => {
    const user = users.find(u => u.id === log.user_id);
    return {
      ...log,
      userName: user ? user.name : 'System/Guest'
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(enriched);
});

// ================= GOVERNMENT SCHEMES PORTAL =================

app.get('/api/schemes', async (req, res) => {
  try {
    const { category, search } = req.query;
    let list = await db.getAll('schemes');
    
    if (category) {
      list = list.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      list = list.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/schemes', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const newScheme = await db.create('schemes', {
      ...req.body,
      last_updated_date: new Date().toISOString().split('T')[0]
    });
    await logAction(req.user.id, 'CREATE_SCHEME', 'schemes', newScheme.id);
    res.status(201).json(newScheme);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/schemes/:id', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const updated = await db.update('schemes', req.params.id, {
      ...req.body,
      last_updated_date: new Date().toISOString().split('T')[0]
    });
    await logAction(req.user.id, 'UPDATE_SCHEME', 'schemes', req.params.id);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/schemes/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.delete('schemes', req.params.id);
    await logAction(req.user.id, 'DELETE_SCHEME', 'schemes', req.params.id);
    res.json({ message: 'Scheme deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/schemes/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const schemeId = parseInt(req.params.id);
    const existing = await db.query('saved_schemes', s => s.user_id === req.user.id && s.scheme_id === schemeId);
    
    if (existing.length > 0) {
      // Remove bookmark
      await db.delete('saved_schemes', existing[0].id);
      res.json({ bookmarked: false });
    } else {
      // Add bookmark
      await db.create('saved_schemes', { user_id: req.user.id, scheme_id: schemeId });
      res.json({ bookmarked: true });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/saved-schemes', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.json([]);
    const saved = await db.query('saved_schemes', s => s.user_id === req.user.id);
    const schemes = await db.getAll('schemes');
    const matched = saved.map(s => schemes.find(sc => sc.id === s.scheme_id)).filter(Boolean);
    res.json(matched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= RECOMMENDATION ENGINE =================

function calculateSchemeMatch(scheme, user) {
  let score = 0;
  let totalCriteria = 0;
  
  const rules = scheme.eligibility_criteria.toLowerCase();
  
  // Strict disqualifications
  if (rules.includes('gender: female') && user.gender && user.gender.toLowerCase() !== 'female') {
    return { score: 0, level: 'Low Match' };
  }
  if (rules.includes('farmer status: true') && !user.farmer_status) {
    return { score: 0, level: 'Low Match' };
  }
  
  // Grade matching scores
  // 1. Gender Match
  if (rules.includes('gender: female')) {
    totalCriteria++;
    if (user.gender && user.gender.toLowerCase() === 'female') score += 100;
  }
  
  // 2. Farmer Status
  if (rules.includes('farmer status: true')) {
    totalCriteria++;
    if (user.farmer_status) score += 100;
  }

  // 3. SHG Membership
  if (rules.includes('shg member')) {
    totalCriteria++;
    if (user.shg_membership) {
      score += 100;
    } else {
      score += 30; // Partial score, they can join
    }
  }

  // 4. Age restrictions
  const ageMatch = rules.match(/age:\s*(\d+)\s*to\s*(\d+)/) || rules.match(/minimum age:\s*(\d+)/);
  if (ageMatch) {
    totalCriteria++;
    const userAge = user.age || 25; // default fallback if unprovided
    if (rules.includes('minimum age')) {
      const minAge = parseInt(ageMatch[1]);
      if (userAge >= minAge) score += 100;
    } else {
      const minAge = parseInt(ageMatch[1]);
      const maxAge = parseInt(ageMatch[2]);
      if (userAge >= minAge && userAge <= maxAge) score += 100;
    }
  }

  // 5. Income caps
  const incomeMatch = rules.match(/income:\s*less than\s*(\d+)/) || rules.match(/maximum family income:\s*(\d+)/);
  if (incomeMatch) {
    totalCriteria++;
    const maxIncome = parseInt(incomeMatch[1]);
    const userIncome = user.income || 50000;
    if (userIncome <= maxIncome) {
      score += 100;
    } else if (userIncome <= maxIncome * 1.5) {
      score += 40; // close match
    }
  }

  const finalScore = totalCriteria > 0 ? Math.round(score / totalCriteria) : 50;
  let level = 'Low Match';
  if (finalScore >= 75) level = 'High Match';
  else if (finalScore >= 40) level = 'Medium Match';

  return { score: finalScore, level };
}

app.post('/api/recommendations/run', async (req, res) => {
  try {
    const userDemographics = req.body; // age, gender, occupation, income, education, location, farmer_status, shg_membership
    const schemes = await db.getAll('schemes');
    
    const results = schemes.map(scheme => {
      const match = calculateSchemeMatch(scheme, userDemographics);
      return {
        scheme,
        score: match.score,
        level: match.level
      };
    }).sort((a, b) => b.score - a.score);

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) {
      return res.status(400).json({ error: 'Please log in to receive personalized recommendations.' });
    }
    const schemes = await db.getAll('schemes');
    const results = schemes.map(scheme => {
      const match = calculateSchemeMatch(scheme, req.user);
      return {
        scheme,
        score: match.score,
        level: match.level
      };
    }).sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= AGRICULTURE MODULE =================

app.get('/api/agriculture/requests', authenticateToken, async (req, res) => {
  try {
    let list;
    if (req.user.role === 'Admin' || req.user.role === 'Staff') {
      list = await db.getAll('agriculture_requests');
    } else {
      list = await db.query('agriculture_requests', r => r.user_id === req.user.id);
    }
    const users = await db.getAll('users');
    const enriched = list.map(r => ({
      ...r,
      userName: (users.find(u => u.id === r.user_id) || {}).name || 'Unknown'
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agriculture/requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const { request_type, description } = req.body;
    const request = await db.create('agriculture_requests', {
      user_id: req.user.id,
      request_type,
      description,
      status: 'Pending',
      created_at: new Date().toISOString()
    });
    res.status(201).json(request);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/agriculture/requests/:id', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const updated = await db.update('agriculture_requests', req.params.id, { status: req.body.status });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= WATER RESOURCE PORTAL =================

app.get('/api/water/issues', authenticateToken, async (req, res) => {
  try {
    let list;
    if (req.user.role === 'Admin' || req.user.role === 'Staff') {
      list = await db.getAll('water_issues');
    } else {
      list = await db.query('water_issues', i => i.user_id === req.user.id);
    }
    const users = await db.getAll('users');
    const enriched = list.map(i => ({
      ...i,
      userName: (users.find(u => u.id === i.user_id) || {}).name || 'Unknown'
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/water/issues', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const { issue_type, location, description, image_url } = req.body;
    const issue = await db.create('water_issues', {
      user_id: req.user.id,
      issue_type,
      location,
      description,
      image_url: image_url || '',
      status: 'Reported',
      created_at: new Date().toISOString()
    });
    res.status(201).json(issue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/water/issues/:id', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const updated = await db.update('water_issues', req.params.id, { status: req.body.status });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/water/reservoirs', async (req, res) => {
  const list = await db.getAll('reservoirs');
  res.json(list);
});

// ================= WOMEN EMPOWERMENT CENTER =================

app.get('/api/women/programs', async (req, res) => {
  const list = await db.getAll('training_programs');
  res.json(list);
});

app.post('/api/women/programs/:id/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const programId = parseInt(req.params.id);
    
    // Check if already registered
    const exists = await db.query('training_registrations', r => r.user_id === req.user.id && r.program_id === programId);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Already registered for this program.' });
    }

    const reg = await db.create('training_registrations', {
      user_id: req.user.id,
      program_id: programId,
      registered_at: new Date().toISOString(),
      status: 'Approved'
    });

    // Increment program registered count
    const program = await db.getById('training_programs', programId);
    if (program) {
      await db.update('training_programs', programId, { registered_count: (program.registered_count || 0) + 1 });
    }

    res.status(201).json(reg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/women/shg/enroll', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const { shg_name, role } = req.body;
    
    const enroll = await db.create('shg_enrollments', {
      user_id: req.user.id,
      shg_name,
      role: role || 'Member',
      enrollment_date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    });

    res.status(201).json(enroll);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/women/registrations', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.json([]);
    const regs = await db.query('training_registrations', r => r.user_id === req.user.id);
    const programs = await db.getAll('training_programs');
    const enriched = regs.map(r => ({
      ...r,
      program: programs.find(p => p.id === r.program_id)
    })).filter(r => r.program);
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= COMMUNITY HELP DESK =================

app.get('/api/help-desk/requests', authenticateToken, async (req, res) => {
  try {
    let list;
    if (req.user.role === 'Admin' || req.user.role === 'Staff') {
      list = await db.getAll('help_desk_requests');
    } else {
      list = await db.query('help_desk_requests', r => r.user_id === req.user.id);
    }
    const users = await db.getAll('users');
    const enriched = list.map(r => ({
      ...r,
      userName: (users.find(u => u.id === r.user_id) || {}).name || 'Unknown'
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/help-desk/requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const { category, subject, description, attachment_url } = req.body;
    const request = await db.create('help_desk_requests', {
      user_id: req.user.id,
      category,
      subject,
      description,
      attachment_url: attachment_url || '',
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    res.status(201).json(request);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/help-desk/requests/:id', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const updated = await db.update('help_desk_requests', req.params.id, {
      status: req.body.status,
      updated_at: new Date().toISOString()
    });
    
    // Add user notification on help ticket update
    if (updated) {
      await db.create('notifications', {
        user_id: updated.user_id,
        title: 'Help Desk Status Update',
        message: `Your request "${updated.subject}" status is now: ${updated.status}.`,
        type: 'Request',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= JOB & OPPORTUNITY BOARD =================

app.get('/api/jobs', async (req, res) => {
  const jobs = await db.getAll('jobs_opportunities');
  res.json(jobs);
});

app.post('/api/jobs', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const newJob = await db.create('jobs_opportunities', req.body);
    await logAction(req.user.id, 'CREATE_JOB', 'jobs_opportunities', newJob.id);
    res.status(201).json(newJob);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/jobs/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    await db.delete('jobs_opportunities', req.params.id);
    await logAction(req.user.id, 'DELETE_JOB', 'jobs_opportunities', req.params.id);
    res.json({ message: 'Opportunity deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= LEARNING CENTER =================

app.get('/api/learning', async (req, res) => {
  const guides = await db.getAll('learning_resources');
  res.json(guides);
});

app.post('/api/learning', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const newResource = await db.create('learning_resources', req.body);
    res.status(201).json(newResource);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= EVENTS & PROGRAMS =================

app.get('/api/events', async (req, res) => {
  const list = await db.getAll('events');
  res.json(list);
});

app.post('/api/events', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const newEvent = await db.create('events', req.body);
    res.status(201).json(newEvent);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/events/:id/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.status(401).json({ error: 'Auth required' });
    const eventId = parseInt(req.params.id);
    
    const exists = await db.query('event_registrations', r => r.user_id === req.user.id && r.event_id === eventId);
    if (exists.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event.' });
    }

    const reg = await db.create('event_registrations', {
      user_id: req.user.id,
      event_id: eventId,
      registered_at: new Date().toISOString()
    });
    res.status(201).json(reg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= FEEDBACK SYSTEM =================

app.get('/api/feedback', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  const feedback = await db.getAll('feedback');
  res.json(feedback);
});

app.post('/api/feedback', authenticateToken, async (req, res) => {
  try {
    const { type, content, rating } = req.body;
    const feed = await db.create('feedback', {
      user_id: req.user.id === 0 ? null : req.user.id,
      type,
      content,
      rating: rating ? parseInt(rating) : 5,
      created_at: new Date().toISOString()
    });
    res.status(201).json(feed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= SUCCESS STORIES HUB =================

app.get('/api/stories', async (req, res) => {
  const list = await db.getAll('stories');
  res.json(list);
});

app.post('/api/stories', authenticateToken, requireRole(['Admin', 'Staff']), async (req, res) => {
  try {
    const story = await db.create('stories', req.body);
    res.status(201).json(story);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= CONTRIBUTIONS MODULE =================

app.get('/api/contributions/campaigns', async (req, res) => {
  const list = await db.getAll('campaigns');
  res.json(list);
});

app.post('/api/contributions/donate', authenticateToken, async (req, res) => {
  try {
    const { donor_name, email, amount, campaign_id, payment_method } = req.body;
    if (!donor_name || !amount) {
      return res.status(400).json({ error: 'Donor name and amount are required' });
    }

    const receipt_number = `WET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const contribution = await db.create('contributions', {
      donor_name,
      email: email || 'donor@wettrust.org',
      amount: parseFloat(amount),
      campaign_id: campaign_id ? parseInt(campaign_id) : null,
      payment_method: payment_method || 'UPI',
      transaction_id: `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: 'Success',
      date: new Date().toISOString().split('T')[0],
      receipt_number
    });

    // Update campaign raised amount
    if (campaign_id) {
      const campId = parseInt(campaign_id);
      const campaign = await db.getById('campaigns', campId);
      if (campaign) {
        const raised = (parseFloat(campaign.raised_amount) || 0) + parseFloat(amount);
        await db.update('campaigns', campId, { raised_amount: raised });
      }
    }

    res.status(201).json(contribution);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= NOTIFICATIONS CENTER =================

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    if (req.user.id === 0) return res.json([]);
    const list = await db.query('notifications', n => n.user_id === req.user.id);
    res.json(list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = await db.update('notifications', req.params.id, { is_read: true });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= VILLAGE DEVELOPMENT DASHBOARD =================

app.get('/api/dashboard/village', async (req, res) => {
  try {
    const users = await db.getAll('users');
    const helpDesk = await db.getAll('help_desk_requests');
    const waterIssues = await db.getAll('water_issues');
    const events = await db.getAll('events');
    const programs = await db.getAll('training_programs');

    const totalMembers = users.filter(u => u.role === 'Member').length;
    const resolvedHelp = helpDesk.filter(r => r.status === 'Resolved').length;
    const resolvedWater = waterIssues.filter(i => i.status === 'Resolved').length;

    // Get covered villages (locations of members + issues)
    const villages = new Set();
    users.forEach(u => u.location && villages.add(u.location));
    waterIssues.forEach(i => i.location && villages.add(i.location.split(',')[0].trim()));
    
    // Conducted counts
    const agPrograms = events.filter(e => e.category === 'Agriculture Workshop').length;
    const waterActivities = events.filter(e => e.category === 'Water Conservation Drive').length;

    res.json({
      villagesCovered: Math.max(1, villages.size),
      membersRegistered: totalMembers,
      requestsResolved: resolvedHelp + resolvedWater,
      agricultureProgramsConducted: agPrograms + programs.filter(p => p.category === 'Agriculture Workshop').length,
      waterActivitiesConducted: waterActivities,
      trainingProgramsOrganized: programs.length,
      participationRate: totalMembers > 0 ? '88%' : '0%'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= SPA FALLBACK =================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`WET360 Core Management Server running at http://localhost:${PORT}`);
});
