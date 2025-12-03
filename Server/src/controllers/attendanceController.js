const attendanceService = require('../services/attendanceService');

async function getMyAttendance(req, res) {
  const { employeeId } = req.user;
  const logs = await attendanceService.getAttendanceForEmployee(employeeId);
  return res.json(logs);
}

async function getSummary(req, res) {
  if (!['Admin', 'HR', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const logs = await attendanceService.getAttendanceSummary({
    department: req.query.department
  });
  return res.json(logs);
}

module.exports = {
  getMyAttendance,
  getSummary
};

