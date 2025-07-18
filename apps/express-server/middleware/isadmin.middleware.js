import { queryOne } from '../lib/database.js';

const isAdmin = async (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = await queryOne('SELECT id, is_admin FROM users WHERE id = $1', [req.user.userId]);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
};

export default isAdmin;
