const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const employeesRouter = require('./routes/employeeRoutes.js');

app.use('/api/employees', employeesRouter);


app.listen(PORT, () => {
  logger.info(`🚀 Server listening on port ${PORT}`);
});

