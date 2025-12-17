import { Router, Response } from 'express';
import multer from 'multer';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { processExcelFile } from '../services/excelProcessor';
import db from '../db/connection';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

router.post('/', authenticateToken, requireAdmin, upload.single('file') as any, (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = processExcelFile(req.file.buffer, req.user!.id);
    
    db.prepare(`
      INSERT INTO upload_logs (filename, rows_processed, rows_success, rows_failed, errors, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.file.originalname,
      result.rowsProcessed,
      result.rowsSuccess,
      result.rowsFailed,
      JSON.stringify(result.errors),
      req.user!.id
    );
    
    res.json({
      success: result.success,
      message: result.success 
        ? `Successfully processed ${result.rowsSuccess} rows` 
        : `Processed with errors: ${result.rowsSuccess} success, ${result.rowsFailed} failed`,
      details: result
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process file' });
  }
});

router.get('/history', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT 
        ul.*,
        u.username as uploaded_by_name
      FROM upload_logs ul
      LEFT JOIN users u ON ul.uploaded_by = u.id
      ORDER BY ul.uploaded_at DESC
      LIMIT 50
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// Get all KPI data for management
router.get('/data', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT
        w.*,
        e.name,
        e.position
      FROM weekly_kpi w
      JOIN employees e ON w.employee_id = e.id
      ORDER BY w.week_start DESC, e.position, e.name
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
});

// Delete all data
router.delete('/all-data', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare('DELETE FROM weekly_kpi').run();
    res.json({
      success: true,
      message: `Deleted ${result.changes} records`
    });
  } catch (error) {
    console.error('Delete all data error:', error);
    res.status(500).json({ error: 'Failed to delete all data' });
  }
});

router.delete('/week/:weekStart', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { weekStart } = req.params;
    const result = db.prepare('DELETE FROM weekly_kpi WHERE week_start = ?').run(weekStart);
    res.json({ 
      success: true, 
      message: `Deleted ${result.changes} records for week starting ${weekStart}` 
    });
  } catch (error) {
    console.error('Delete week error:', error);
    res.status(500).json({ error: 'Failed to delete week data' });
  }
});

router.delete('/record/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM weekly_kpi WHERE id = ?').run(id);
    res.json({ success: true, message: 'Record deleted' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

router.put('/record/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { verifications, cv_added, recommendations, interviews, placements, days_worked } = req.body;
    
    db.prepare(`
      UPDATE weekly_kpi
      SET verifications = ?, cv_added = ?, recommendations = ?, 
          interviews = ?, placements = ?, days_worked = ?,
          uploaded_at = datetime('now')
      WHERE id = ?
    `).run(verifications, cv_added, recommendations, interviews, placements, days_worked, id);
    
    res.json({ success: true, message: 'Record updated' });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

router.post('/employee', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { name, position } = req.body;
    
    if (!name || !position) {
      return res.status(400).json({ error: 'Name and position required' });
    }
    
    if (!['Sourcer', 'Rekruter', 'TAC'].includes(position)) {
      return res.status(400).json({ error: 'Invalid position. Must be: Sourcer, Rekruter, or TAC' });
    }
    
    const result = db.prepare('INSERT INTO employees (name, position) VALUES (?, ?)').run(name, position);
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    
    res.json(employee);
  } catch (error: any) {
    console.error('Add employee error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Employee with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add employee' });
  }
});

router.put('/employee/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, position, is_active } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (position !== undefined) { updates.push('position = ?'); params.push(position); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    
    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true, message: 'Employee updated' });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

router.delete('/employee/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE employees SET is_active = 0 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

export default router;
