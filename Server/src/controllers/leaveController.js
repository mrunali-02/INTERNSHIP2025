const leaveService = require('../services/leaveService');
const employeeService = require('../services/employeeService');

async function getBalances(req, res) {
  const { employeeId } = req.params;
  if (req.user.employeeId !== employeeId && !['Admin', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const balances = await leaveService.getLeaveBalances(employeeId);
  return res.json(
    balances.reduce((acc, item) => {
      acc[item.leaveType] = {
        total: item.total,
        remaining: item.remaining,
        updatedAt: item.updatedAt
      };
      return acc;
    }, {})
  );
}

async function getHistory(req, res) {
  const { employeeId } = req.params;
  if (req.user.employeeId !== employeeId && !['Admin', 'HR', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const history = await leaveService.getLeaveHistory(employeeId);
  return res.json(history);
}

async function validateLeave(req, res, next) {
  try {
    await leaveService.validateBalance({
      employeeId: req.query.employeeId,
      leaveType: req.query.type,
      days: Number(req.query.days)
    });
    return res.json({ ok: true });
  } catch (error) {
    error.status = error.status || 400;
    return next(error);
  }
}

async function createLeave(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeByEmployeeId(req.body.employeeId);
    if (!employee || employee.firebase_uid !== req.user.firebaseUid) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const created = await leaveService.createLeaveRequest(req.body);
    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
}

async function listLeaveRequests(req, res) {
  const requests = await leaveService.getLeaveRequestsForRole(req.user.role, req.user.employeeId);
  return res.json(requests);
}

async function updateStatus(req, res) {
  if (!['Admin', 'HR', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  const { status, remark } = req.body;
  const updated = await leaveService.updateLeaveStatus(id, status, remark, req.user.employeeId);
  return res.json(updated);
}

module.exports = {
  getBalances,
  getHistory,
  validateLeave,
  createLeave,
  listLeaveRequests,
  updateStatus
};

