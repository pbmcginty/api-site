var CONFIG = {
  CALENDAR_ID: PropertiesService.getScriptProperties().getProperty('CALENDAR_ID'),
  SHEET_ID: PropertiesService.getScriptProperties().getProperty('SHEET_ID'),
  NOTIFICATION_EMAIL: PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL'),
  TIMEZONE: 'America/Phoenix',
  SLOT_MINUTES: 30,
  BUFFER_MINUTES: 15,
  WINDOW_DAYS: 14,
  HOUR_START: 9,
  HOUR_END: 16,
  INVITE_TITLE: 'Discovery Call — Anchor Point Intelligence',
  INVITE_DESCRIPTION:
    'Thank you for booking a discovery call with Anchor Point Intelligence.\n\n' +
    'Purpose: This is a 30-minute session to explore your current data landscape — ' +
    'the systems, databases, and tools your organization relies on — and determine ' +
    'how we can best support your data infrastructure goals.\n\n' +
    'To make the most of our time, please have the following ready if possible:\n' +
    '  • What CRM, ERP, and accounting software you currently use\n' +
    '  • Any databases or data warehouses in your stack\n' +
    '  • Key integrations or data flows between systems\n' +
    '  • Your biggest data pain points or questions\n\n' +
    'We look forward to speaking with you.\n\n' +
    '— The Anchor Point Intelligence Team'
};

function doGet(e) {
  try {
    var clientTz = (e && e.parameter && e.parameter.tz) ? e.parameter.tz : CONFIG.TIMEZONE;
    var slots = getAvailableSlots(clientTz);
    return ContentService.createTextOutput(JSON.stringify({ slots: slots }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    alertError('doGet', err, e ? JSON.stringify(e.parameter) : 'no params');
    return ContentService.createTextOutput(JSON.stringify({ slots: [], error: 'Failed to load availability.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Server busy, please try again.' });
  }

  try {
    var data = JSON.parse(e.postData.contents);

    if (!data.name || !data.email || !data.slotStart || !data.slotEnd) {
      return jsonResponse({ success: false, error: 'Missing required fields.' });
    }

    var start = new Date(data.slotStart);
    var end = new Date(data.slotEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return jsonResponse({ success: false, error: 'Invalid date format.' });
    }

    if (start < new Date()) {
      return jsonResponse({ success: false, error: 'This time slot has passed.' });
    }

    if (!isSlotFree(start, end)) {
      return jsonResponse({ success: false, error: 'This slot is no longer available. Please choose another time.' });
    }

    var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    var event = cal.createEvent(
      CONFIG.INVITE_TITLE,
      start,
      end,
      {
        description: CONFIG.INVITE_DESCRIPTION,
        guests: data.email,
        sendInvites: true
      }
    );

    logToSheet(data, event.getId());

    if (CONFIG.NOTIFICATION_EMAIL) {
      MailApp.sendEmail({
        to: CONFIG.NOTIFICATION_EMAIL,
        subject: 'New Discovery Call Booked — ' + data.name,
        body:
          'New booking:\n\n' +
          'Name: ' + data.name + '\n' +
          'Email: ' + data.email + '\n' +
          'Phone: ' + (data.phone || 'N/A') + '\n' +
          'Company: ' + (data.company || 'N/A') + '\n' +
          'Systems: ' + (data.systems || 'N/A') + '\n' +
          'Message: ' + (data.message || 'N/A') + '\n\n' +
          'Time: ' + formatInTz(start) + ' — ' + formatInTz(end) + ' (Arizona)\n' +
          'Calendar Event ID: ' + event.getId()
      });
    }

    return jsonResponse({ success: true, eventId: event.getId() });
  } catch (err) {
    var context = '';
    try { context = e.postData.contents; } catch (x) { context = 'unable to read payload'; }
    alertError('doPost', err, context);
    return jsonResponse({ success: false, error: 'Booking failed: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

function getAvailableSlots(clientTz) {
  var now = new Date();
  var windowEnd = new Date(now.getTime() + CONFIG.WINDOW_DAYS * 86400000);

  var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  var events = cal.getEvents(now, windowEnd);

  var busy = [];
  for (var i = 0; i < events.length; i++) {
    busy.push({
      start: events[i].getStartTime().getTime(),
      end: events[i].getEndTime().getTime()
    });
  }
  busy.sort(function(a, b) { return a.start - b.start; });

  var slots = [];
  var d = new Date(now);
  d = shiftToTz(d, CONFIG.TIMEZONE);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() < now.getTime()) {
    d.setDate(d.getDate() + 1);
  }

  for (var day = 0; day < CONFIG.WINDOW_DAYS; day++) {
    var current = new Date(d.getTime() + day * 86400000);
    var dow = getDowInTz(current, CONFIG.TIMEZONE);
    if (dow === 0 || dow === 6) continue;

    var daySlots = [];
    for (var h = CONFIG.HOUR_START; h < CONFIG.HOUR_END; h++) {
      for (var m = 0; m < 60; m += CONFIG.SLOT_MINUTES) {
        var slotStart = buildDateInTz(current, h, m, CONFIG.TIMEZONE);
        var slotEnd = new Date(slotStart.getTime() + CONFIG.SLOT_MINUTES * 60000);

        if (slotStart.getTime() <= now.getTime()) continue;
        if (slotEnd.getTime() > buildDateInTz(current, CONFIG.HOUR_END, 0, CONFIG.TIMEZONE).getTime()) continue;

        if (isSlotAvailable(slotStart.getTime(), slotEnd.getTime(), busy)) {
          daySlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: formatTimeInClientTz(slotStart, clientTz)
          });
        }
      }
    }

    if (daySlots.length > 0) {
      slots.push({
        date: Utilities.formatDate(current, CONFIG.TIMEZONE, 'yyyy-MM-dd'),
        label: Utilities.formatDate(buildDateInTz(current, 12, 0, CONFIG.TIMEZONE), CONFIG.TIMEZONE, 'EEE, MMM d'),
        times: daySlots
      });
    }
  }

  return slots;
}

function isSlotAvailable(slotStartMs, slotEndMs, busy) {
  var bufferMs = CONFIG.BUFFER_MINUTES * 60000;

  for (var i = 0; i < busy.length; i++) {
    var b = busy[i];
    if (b.start >= slotEndMs) break;

    if (slotStartMs < b.end + bufferMs && slotEndMs > b.start) {
      return false;
    }
  }
  return true;
}

function isSlotFree(start, end) {
  var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  var events = cal.getEvents(
    new Date(start.getTime() - CONFIG.BUFFER_MINUTES * 60000),
    new Date(end.getTime() + CONFIG.BUFFER_MINUTES * 60000)
  );
  return events.length === 0;
}

function logToSheet(data, eventId) {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName('Bookings') || ss.getSheets()[0];
  sheet.appendRow([
    new Date(),
    data.name,
    data.email,
    data.phone || '',
    data.company || '',
    data.systems || '',
    data.message || '',
    data.slotStart,
    data.slotEnd,
    eventId,
    'Confirmed'
  ]);
}

function buildDateInTz(baseDate, hours, minutes, tz) {
  var dateStr = Utilities.formatDate(baseDate, tz, 'yyyy-MM-dd');
  var full = dateStr + 'T' + padZero(hours) + ':' + padZero(minutes) + ':00';
  return Utilities.parseDate(full, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function shiftToTz(date, tz) {
  var str = Utilities.formatDate(date, tz, 'yyyy-MM-dd');
  return new Date(str + 'T00:00:00Z');
}

function getDowInTz(date, tz) {
  var dayName = Utilities.formatDate(date, tz, 'u');
  return parseInt(dayName, 10) % 7;
}

function formatTimeInClientTz(date, tz) {
  try {
    return Utilities.formatDate(date, tz, 'h:mm a');
  } catch (e) {
    return Utilities.formatDate(date, CONFIG.TIMEZONE, 'h:mm a');
  }
}

function formatInTz(date) {
  return Utilities.formatDate(date, CONFIG.TIMEZONE, 'EEE, MMM d, yyyy h:mm a');
}

function padZero(n) {
  return n < 10 ? '0' + n : '' + n;
}

function alertError(source, err, context) {
  try {
    MailApp.sendEmail({
      to: CONFIG.NOTIFICATION_EMAIL,
      subject: 'BOOKING SYSTEM ERROR — ' + source,
      body:
        'An error occurred in the booking system.\n\n' +
        'Function: ' + source + '\n' +
        'Time: ' + formatInTz(new Date()) + ' (Arizona)\n' +
        'Error: ' + err.message + '\n' +
        'Stack: ' + (err.stack || 'N/A') + '\n\n' +
        'Context:\n' + context
    });
  } catch (mailErr) {
    Logger.log('Failed to send error alert: ' + mailErr.message);
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupHeaders() {
  var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName('Bookings') || ss.getSheets()[0];
  sheet.getRange(1, 1, 1, 11).setValues([[
    'Timestamp', 'Name', 'Email', 'Phone', 'Company',
    'Systems', 'Message', 'Slot Start', 'Slot End',
    'Calendar Event ID', 'Status'
  ]]);
}
