/**
 * GET /api/debug
 * Tests the Google Sheets connection. Remove after confirming it works.
 */

export async function onRequestGet(context) {
  const results = {};

  try {
    // Check env vars exist
    results.hasEmail = !!context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    results.hasKey = !!context.env.GOOGLE_PRIVATE_KEY;
    results.hasSheet = !!context.env.SHEETS_SPREADSHEET_ID;
    results.keyPreview = context.env.GOOGLE_PRIVATE_KEY
      ? context.env.GOOGLE_PRIVATE_KEY.substring(0, 30) + '...'
      : 'MISSING';
    results.keyHasLiteralBackslashN = context.env.GOOGLE_PRIVATE_KEY
      ? context.env.GOOGLE_PRIVATE_KEY.includes('\\n')
      : false;
    results.keyHasRealNewlines = context.env.GOOGLE_PRIVATE_KEY
      ? context.env.GOOGLE_PRIVATE_KEY.includes('\n')
      : false;

    // Try to get access token
    const token = await context.data.sheets.getAccessToken();
    results.tokenObtained = !!token;
    results.tokenPreview = token ? token.substring(0, 20) + '...' : 'FAILED';

    // Try to read from sheet
    const rows = await context.data.sheets.getValues('Email Log!A1:B2');
    results.sheetsRead = true;
    results.rowCount = rows.length;
    results.firstRow = rows[0] || 'empty';

    // Try to write a test value
    await context.data.sheets.updateCell('Email Log!M1', 'debug-test-' + Date.now());
    results.sheetsWrite = true;

  } catch (err) {
    results.error = err.message;
    results.stack = err.stack;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
