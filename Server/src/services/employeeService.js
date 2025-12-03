const pool = require('../config/db');

async function getEmployeeByFirebaseUid(firebaseUid) {
  const [rows] = await pool.query(
    `SELECT e.id,
            e.firebase_uid AS firebaseUid,
            e.employee_id AS employeeId,
            e.name,
            e.email,
            e.department,
            e.phone,
            e.joined_on AS joinedOn,
            e.avatar_color AS avatarColor,
            e.photo_url AS photoUrl,
            e.address,
            e.contact_number AS contactNumber,
            r.name AS role
     FROM employees e
     JOIN roles r ON r.id = e.role_id
     WHERE e.firebase_uid = ?
     LIMIT 1`,
    [firebaseUid]
  );
  return rows[0];
}

async function getEmployeeByEmployeeId(employeeId) {
  const [rows] = await pool.query(
    `SELECT *
     FROM employees
     WHERE employee_id = ?
     LIMIT 1`,
    [employeeId]
  );
  return rows[0];
}

async function getEmployeeProfile(targetUid) {
  const [rows] = await pool.query(
    `SELECT e.firebase_uid AS firebaseUid,
            e.employee_id AS employeeId,
            e.name,
            e.email,
            e.department,
            e.phone,
            e.joined_on AS joinedOn,
            e.address,
            e.contact_number AS contactNumber,
            e.photo_url AS photoUrl,
            e.avatar_color AS avatarColor
     FROM employees e
     WHERE e.firebase_uid = ?
     LIMIT 1`,
    [targetUid]
  );
  return rows[0];
}

async function updateEmployeeProfile(firebaseUid, profile = {}) {
  const {
    name,
    department,
    phone,
    address,
    contactNumber
  } = profile;

  await pool.query(
    `UPDATE employees
     SET name = COALESCE(?, name),
         department = COALESCE(?, department),
         phone = COALESCE(?, phone),
         address = COALESCE(?, address),
         contact_number = COALESCE(?, contact_number)
     WHERE firebase_uid = ?`,
    [name, department, phone, address, contactNumber, firebaseUid]
  );

  return getEmployeeProfile(firebaseUid);
}

async function updateEmployeePhoto(firebaseUid, photoUrl) {
  await pool.query(
    `UPDATE employees
     SET photo_url = ?
     WHERE firebase_uid = ?`,
    [photoUrl, firebaseUid]
  );
  return getEmployeeProfile(firebaseUid);
}

async function getDeviceLogins(firebaseUid) {
  const [rows] = await pool.query(
    `SELECT id,
            device_info AS deviceInfo,
            ip_address AS ipAddress,
            logged_in_at AS loggedInAt
     FROM device_logins
     WHERE firebase_uid = ?
     ORDER BY logged_in_at DESC
     LIMIT 50`,
    [firebaseUid]
  );
  return rows;
}

module.exports = {
  getEmployeeByFirebaseUid,
  getEmployeeByEmployeeId,
  getEmployeeProfile,
  updateEmployeeProfile,
  updateEmployeePhoto,
  getDeviceLogins
};

