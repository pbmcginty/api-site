/**
 * GET /api/debug — Tests middleware sheets connection
 */

export async function onRequestGet(context) {
  const results = {};

  try {
    const sheets = context.data && context.data.sheets;
    results.middlewareAttached = !!sheets;

    if (!sheets) {
      results.error = 'context.data.sheets is not set by middleware';
      results.dataKeys = context.data ? Object.keys(context.data) : 'context.data is null';
      return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await sheets.getAccessToken();
    results.tokenObtained = !!token;

    const rows = await sheets.getValues('Email Log!A1:B2');
    results.sheetsRead = true;
    results.firstRow = rows[0] || 'empty';

    await sheets.updateCell('Email Log!M1', 'middleware-test-' + Date.now());
    results.sheetsWrite = true;

  } catch (err) {
    results.error = err.message;
    results.stack = err.stack;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
