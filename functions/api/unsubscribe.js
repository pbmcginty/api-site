/**
 * GET /api/unsubscribe?email=someone@example.com
 * Marks lead as unsubscribed, stops sequence, promotes next contact.
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const email = (url.searchParams.get('email') || '').toLowerCase().trim();

  if (!email) {
    return new Response('Missing email parameter.', { status: 400 });
  }

  try {
    const env = context.env;
    const token = await context.sheets.getAccessToken();
    const spreadsheetId = env.SPREADSHEET_ID;

    // Get all leads
    const rows = await context.sheets.getValues('Leads!A:AE');

    const updates = [];
    const affectedCompanies = new Set();

    for (let i = 1; i < rows.length; i++) {
      const rowEmail = String(rows[i][4] || '').toLowerCase().trim(); // Column E
      if (rowEmail === email) {
        const rowNum = i + 1;
        // Mark unsubscribed (col R = index 17)
        updates.push({ range: `Leads!R${rowNum}`, value: 'YES' });
        // Set status to Unsubscribed (col O = index 14)
        updates.push({ range: `Leads!O${rowNum}`, value: 'Unsubscribed' });
        // Clear next email date (col AD = index 29)
        updates.push({ range: `Leads!AD${rowNum}`, value: '' });

        const companyId = String(rows[i][0] || '').trim();
        if (companyId) affectedCompanies.add(companyId);
      }
    }

    // Batch update
    for (const u of updates) {
      await context.sheets.updateCell(u.range, u.value);
    }

    // Promote next contact at affected companies
    for (const companyId of affectedCompanies) {
      await promoteNextContact(context, rows, companyId);
    }

    return new Response(UNSUB_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return new Response(UNSUB_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function promoteNextContact(context, rows, companyId) {
  // Find queued contacts for this company, pick highest lead score
  let bestIdx = -1;
  let bestScore = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() !== companyId) continue;
    const role = String(rows[i][30] || '').trim(); // Column AE (index 30)
    if (role !== 'Queued') continue;

    const score = parseInt(rows[i][23] || '0', 10); // Column X = LeadScore
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestIdx >= 0) {
    const rowNum = bestIdx + 1;
    await context.sheets.updateCell(`Leads!AE${rowNum}`, 'Promoted');
    await context.sheets.updateCell(`Leads!O${rowNum}`, 'New');
    await context.sheets.updateCell(`Leads!AB${rowNum}`, ''); // Clear seq step
    await context.sheets.updateCell(`Leads!AC${rowNum}`, ''); // Clear last email
    await context.sheets.updateCell(`Leads!AD${rowNum}`, ''); // Clear next email
  }
}

const UNSUB_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:500px;margin:80px auto;text-align:center;color:#1a2332;">
<h2>Unsubscribed</h2>
<p>You've been removed from our mailing list and won't receive further emails from Anchor Point Intelligence.</p>
</body>
</html>`;
