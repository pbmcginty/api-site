/**
 * GET /api/debug — self-contained Sheets auth test. No middleware dependency.
 */

export async function onRequestGet(context) {
  const results = {};
  const env = context.env;

  try {
    results.hasEmail = !!env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    results.hasKey = !!env.GOOGLE_PRIVATE_KEY;
    results.hasSheet = !!env.SHEETS_SPREADSHEET_ID;

    // Fix the key: Cloudflare stores \\n as literal text
    const rawKey = env.GOOGLE_PRIVATE_KEY || '';
    const fixedKey = rawKey.replace(/\\n/g, '\n');
    results.keyStartsCorrectly = fixedKey.startsWith('-----BEGIN PRIVATE KEY-----\n');

    // Build JWT
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    const enc = new TextEncoder();
    const headerB64 = base64url(JSON.stringify(header));
    const payloadB64 = base64url(JSON.stringify(payload));
    const signingInput = `${headerB64}.${payloadB64}`;

    // Import private key
    const pemBody = fixedKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const binary = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8', binary.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    results.keyImported = true;

    // Sign
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
    const jwt = `${signingInput}.${base64url(signature)}`;
    results.jwtSigned = true;

    // Exchange for token
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenResp.json();
    results.tokenObtained = !!tokenData.access_token;
    if (!tokenData.access_token) {
      results.tokenError = tokenData;
    }

    if (tokenData.access_token) {
      // Try reading
      const sheetId = env.SHEETS_SPREADSHEET_ID;
      const range = encodeURIComponent('Email Log!A1:B2');
      const readResp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const readData = await readResp.json();
      results.sheetsRead = !!readData.values;
      results.readData = readData.values || readData.error || 'empty';

      // Try writing
      const writeRange = encodeURIComponent('Email Log!M1');
      const writeResp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [['debug-' + Date.now()]] }),
        }
      );
      const writeData = await writeResp.json();
      results.sheetsWrite = !!writeData.updatedCells;
      if (!writeData.updatedCells) results.writeError = writeData;
    }
  } catch (err) {
    results.error = err.message;
    results.stack = err.stack;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function base64url(input) {
  let str;
  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    str = btoa(String.fromCharCode(...new Uint8Array(input)));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
