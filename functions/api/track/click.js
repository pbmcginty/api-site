/**
 * GET /api/track/click?tid=<uuid>&url=<destination>
 * Records click in Email Log, redirects to destination URL.
 */

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const tid = (url.searchParams.get('tid') || '').trim();
  const dest = url.searchParams.get('url') || 'https://anchorpointintelligence.com';

  // Validate destination URL to prevent open redirect
  let redirectUrl;
  try {
    const parsed = new URL(dest);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      redirectUrl = parsed.href;
    } else {
      redirectUrl = 'https://anchorpointintelligence.com';
    }
  } catch {
    redirectUrl = 'https://anchorpointintelligence.com';
  }

  if (tid) {
    try {
      const rows = await context.sheets.getValues('Email Log!A:L');

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][7] || '').trim() === tid) {
          // Only record first click (column J = index 9)
          if (!rows[i][9]) {
            const rowNum = i + 1;
            await context.sheets.updateCell(`Email Log!J${rowNum}`, new Date().toISOString());
          }
          break;
        }
      }
    } catch (err) {
      console.error('Click tracking error:', err);
    }
  }

  return Response.redirect(redirectUrl, 302);
}
