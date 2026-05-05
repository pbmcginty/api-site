/**
 * GET /api/track/open?tid=<uuid>
 * Records email open in Email Log, returns 1x1 transparent GIF.
 */

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const tid = (url.searchParams.get('tid') || '').trim();

  if (!tid) {
    return new Response(PIXEL, {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' },
    });
  }

  try {
    // Find tracking ID in Email Log (column H = index 7)
    const rows = await context.sheets.getValues('Email Log!A:L');

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][7] || '').trim() === tid) {
        // Only record first open (column I = index 8)
        if (!rows[i][8]) {
          const rowNum = i + 1;
          await context.sheets.updateCell(`Email Log!I${rowNum}`, new Date().toISOString());
        }
        break;
      }
    }
  } catch (err) {
    console.error('Open tracking error:', err);
  }

  return new Response(PIXEL, {
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store' },
  });
}
