const db = require('../config/database');

const EMPLOYEE_TABLE = 'employees';

const normalizeEmployeeRow = (row = {}) => ({
  id: row.id,
  employeeId: row.employee_id,
  roleId: row.role_id,
  name: row.name,
  email: row.email,
  department: row.department,
  phone: row.phone,
  joinedOn: row.joined_on,
  avatarColor: row.avatar_color,
  photoUrl: row.photo_url,
  address: row.address,
  contactNumber: row.contact_number,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

async function listEmployees(req, res, next) {
  try {
    const search = (req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const query = db.select('*').from(EMPLOYEE_TABLE).orderBy('id', 'asc').limit(limit).offset(offset);

    if (search) {
      query.where(function applySearch() {
        this.where('name', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('employee_id', 'like', `%${search}%`)
          .orWhere('department', 'like', `%${search}%`);
      });
    }

    const [rows, [{ count }]] = await Promise.all([
      query,
      db(EMPLOYEE_TABLE).count({ count: '*' })
    ]);

    const data = rows.map(normalizeEmployeeRow);
    res.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total: Number(count),
        pages: Math.ceil(Number(count) / limit) || 1
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getEmployeeById(req, res, next) {
  try {
    const idOrCode = req.params.id;
    const row = await db(EMPLOYEE_TABLE)
      .where('id', idOrCode)
      .orWhere('employee_id', idOrCode)
      .first();

    if (!row) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: normalizeEmployeeRow(row) });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const body = req.body || {};
    const payload = {
      employee_id: body.employee_id || body.employeeId,
      role_id: body.role_id || body.roleId || 4,
      name: body.name,
      email: body.email,
      department: body.department,
      phone: body.phone,
      joined_on: body.joined_on || body.joinedOn,
      address: body.address,
      contact_number: body.contact_number || body.contactNumber,
      created_at: body.created_at || body.createdAt || new Date(),
    };

    if (!payload.employee_id || !payload.name || !payload.email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [insertId] = await db(EMPLOYEE_TABLE).insert(payload);
    const row = await db(EMPLOYEE_TABLE).where({ id: insertId }).first();
    return res.status(201).json({ success: true, data: normalizeEmployeeRow(row) });
  } catch (err) {
    return next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const idOrCode = req.params.id;
    const body = req.body || {};

    const updates = {};
    if (body.role_id != null || body.roleId != null) {
      updates.role_id = body.role_id || body.roleId;
    }
    if (body.name != null) updates.name = body.name;
    if (body.email != null) updates.email = body.email;
    if (body.department != null) updates.department = body.department;
    if (body.phone != null) updates.phone = body.phone;
    if (body.joined_on != null || body.joinedOn != null) {
      updates.joined_on = body.joined_on || body.joinedOn;
    }
    if (body.address != null) updates.address = body.address;
    if (body.contact_number != null || body.contactNumber != null) {
      updates.contact_number = body.contact_number || body.contactNumber;
    }
    if (body.created_at != null || body.createdAt != null) {
      updates.created_at = body.created_at || body.createdAt;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    const affected = await db(EMPLOYEE_TABLE)
      .where('id', idOrCode)
      .orWhere('employee_id', idOrCode)
      .update(updates);

    if (!affected) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const row = await db(EMPLOYEE_TABLE)
      .where('id', idOrCode)
      .orWhere('employee_id', idOrCode)
      .first();

    return res.json({ success: true, data: normalizeEmployeeRow(row) });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee
};
