// Every response: { success, message, data }
const success = (res, data = null, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

module.exports = { success };
