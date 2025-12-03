const pool = require('../config/db');

async function getLeaveBalances(employeeId) {
  const [rows] = await pool.query(
    `SELECT leave_type AS leaveType, total, remaining, updated_at AS updatedAt
     FROM leave_balances
     WHERE employee_id = ?`,
    [employeeId]
  );
  return rows;
}

async function getLeaveHistory(employeeId) {
  const [rows] = await pool.query(
    `SELECT id,
            leave_type AS leaveType,
            start_date AS startDate,
            end_date AS endDate,
            days,
            status,
            manager_remarks AS managerRemarks,
            created_at AS createdAt
     FROM leave_requests
     WHERE employee_id = ?
     ORDER BY created_at DESC`,
    [employeeId]
  );
  return rows;
}

async function validateBalance({ employeeId, leaveType, days }) {
  const [rows] = await pool.query(
    `SELECT remaining
     FROM leave_balances
     WHERE employee_id = ? AND leave_type = ?
     LIMIT 1`,
    [employeeId, leaveType]
  );
  if (!rows.length) {
    throw new Error('Leave balance not configured');
  }
  if (rows[0].remaining < days) {
    const err = new Error('Insufficient balance');
    err.status = 400;
    throw err;
  }
  return true;
}

async function deductBalance({ employeeId, leaveType, days }) {
  await pool.query(
    `UPDATE leave_balances
     SET remaining = remaining - ?
     WHERE employee_id = ? AND leave_type = ?`,
    [days, employeeId, leaveType]
  );
}

async function createLeaveRequest(payload) {
  const {
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason,
    days,
    emergency
  } = payload;

  await validateBalance({ employeeId, leaveType, days });

  const [result] = await pool.query(
    `INSERT INTO leave_requests
       (employee_id, leave_type, start_date, end_date, reason, days, status, emergency)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
    [employeeId, leaveType, startDate, endDate, reason, days, emergency ? 1 : 0]
  );

  await deductBalance({ employeeId, leaveType, days });

  const [rows] = await pool.query(
    `SELECT *
     FROM leave_requests
     WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

async function getLeaveRequestsForRole(role, employeeId) {
  if (role === 'Employee') {
    return getLeaveHistory(employeeId);
  }
  const [rows] = await pool.query(
    `SELECT lr.*, e.name, e.department
     FROM leave_requests lr
     JOIN employees e ON e.employee_id = lr.employee_id
     ORDER BY lr.created_at DESC`,
    []
  );
  return rows;
}

async function updateLeaveStatus(id, status, remark, reviewerId) {
  await pool.query(
    `UPDATE leave_requests
     SET status = ?,
         manager_remarks = ?,
         reviewed_by = ?
     WHERE id = ?`,
    [status, remark, reviewerId, id]
  );
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
  return rows[0];
}

module.exports = {
  getLeaveBalances,
  getLeaveHistory,
  validateBalance,
  createLeaveRequest,
  getLeaveRequestsForRole,
  updateLeaveStatus
};

