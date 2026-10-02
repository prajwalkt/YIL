const { sql, getConnection } = require('./library/db');

async function test() {
  const pool = await getConnection();
  const regQuery = await pool.request().query('SELECT TOP 1 * FROM Registrations ORDER BY Id DESC');
  const reg = regQuery.recordset[0];
  console.log("Registration:", reg);
  
  if (reg) {
    const updateResult = await pool.request()
      .input('Id', reg.Id)
      .input('Status', 'APPROVED')
      .input('FinalStart', '2026-10-05')
      .input('FinalEnd', '2026-10-09')
      .input('Remarks', 'Testing')
      .input('TMId', null)
      .query(`
        UPDATE Registrations 
        SET 
          DateApprovalStatus = @Status,
          FinalStartDate = CASE WHEN @Status = 'APPROVED' THEN @FinalStart ELSE NULL END,
          FinalEndDate = CASE WHEN @Status = 'APPROVED' THEN @FinalEnd ELSE NULL END,
          TMRemarks = @Remarks,
          TMReviewedBy = @TMId,
          TMReviewDate = GETDATE()
        WHERE Id = @Id
      `);
    console.log("Rows affected:", updateResult.rowsAffected);
  }
}
test().catch(console.error).finally(() => process.exit(0));
