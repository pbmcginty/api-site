/**
 * Middleware: attaches Google Sheets helper to context.
 * Env vars required (set in Cloudflare Pages settings):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY (PEM, with \n escaped)
 *   SHEETS_SPREADSHEET_ID
 */

export async function onRequest(context) {
  context.env.SPREADSHEET_ID = context.env.SHEETS_SPREADSHEET_ID || '1zPJxSctTUZe6wOoTDd51B--4Viy-zNrAoW3p9KGKR9k';
  context.sheets = {
    getAccessToken: () => getAccessToken(context.env),
    getValues: (range) => getValues(context.env, range),
    updateCell: (range, value) => updateCell(context.env, range, value),
    findRow: (sheetName, colIndex, value) => findRow(context.env, sheetName, colIndex, value),
  };
  return await context.next();
}

// --- Google Auth via Service Account JWT ---

async function getAccessToken(env) {
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

  const key = await importPrivateKey(env.GOOGLE_PRIVATE_KEY);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(signingInput));
  const sigB64 = base64url(signature);

  const jwt = `${signingInput}.${sigB64}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await resp.json();
  return data.access_token;
}

async function importPrivateKey(pem) {
  // Handle escaped newlines from env var
  // Handle both \\n (literal backslash-n from env) and \n (real newlines)
  const pemClean = pem.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
  const pemBody = pemClean
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binary = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64url(input) {
  let str;
  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    // ArrayBuffer
    str = btoa(String.fromCharCode(...new Uint8Array(input)));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- Sheets API helpers ---

async function getValues(env, range) {
  const token = await getAccessToken(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  return data.values || [];
}

async function updateCell(env, range, value) {
  const token = await getAccessToken(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [[value]] }),
  });
}

async function findRow(env, sheetName, colIndex, searchValue) {
  const rows = await getValues(env, `${sheetName}!A:Z`);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i] && String(rows[i][colIndex] || '').trim() === searchValue) {
      return { rowIndex: i, row: rows[i] };
    }
  }
  return null;
}
