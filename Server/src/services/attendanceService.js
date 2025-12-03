const pool = require('../config/db');

async function getAttendanceForEmployee(employeeId, limit = 30) {
  const [rows] = await pool.query(
    `SELECT date,
            status,
            check_in AS checkIn,
            check_out AS checkOut,
            work_hours AS workHours,
            remarks
     FROM attendance_logs
     WHERE employee_id = ?
     ORDER BY date DESC
     LIMIT ?`,
    [employeeId, Number(limit)]
  );
  return rows;
}

async function getAttendanceSummary({ department }) {
  const params = [];
  let where = '';
  if (department) {
    where = 'WHERE e.department = ?';
    params.push(department);
  }
  const [rows] = await pool.query(
    `SELECT e.employee_id AS employeeId,
            e.name,
            e.department,
            a.date,
            a.status,
            a.check_in AS checkIn,
            a.check_out AS checkOut,
            a.work_hours AS workHours
     FROM attendance_logs a
     JOIN employees e ON e.employee_id = a.employee_id
     ${where}
     ORDER BY a.date DESC
     LIMIT 200`,
    params
  );
  return rows;
}

module.exports = {
  getAttendanceForEmployee,
  getAttendanceSummary
};

