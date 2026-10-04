const SPREADSHEET_ID = '1k2-YgKKuqzDsDLYazZTuhcr61FirpcNArTutGjmvkGg';
const SHEET_GID = 1993837448;
const FIELDS = [
  { key: 'submittedAt', header: 'Submitted At', aliases: ['submitted at', 'timestamp', 'date'] },
  { key: 'name', header: 'Name', aliases: ['name', 'full name'] },
  { key: 'email', header: 'Email', aliases: ['email', 'email address'] },
  { key: 'company', header: 'Company', aliases: ['company', 'business', 'organization', 'organisation'] },
  { key: 'service', header: 'Service', aliases: ['service', 'interest', 'service of interest'] },
  { key: 'message', header: 'Project Details', aliases: ['project details', 'message', 'project', 'description'] }
];

function doPost(e) {
  try {
    const submission = validateSubmission(e.parameter);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      appendSubmission(submission);
    } finally {
      lock.releaseLock();
    }

    return renderResult(true);
  } catch (error) {
    console.error(error);
    return renderResult(false);
  }
}

function validateSubmission(parameters) {
  if (!parameters || parameters.website) {
    throw new Error('Invalid form submission.');
  }

  const submission = {
    name: requiredField(parameters.name, 'Name', 120),
    email: requiredField(parameters.email, 'Email', 254),
    company: optionalField(parameters.company, 160),
    service: requiredField(parameters.service, 'Service', 120),
    message: requiredField(parameters.message, 'Project details', 5000),
    submittedAt: new Date()
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    throw new Error('Invalid email address.');
  }
  return submission;
}

function requiredField(value, label, maxLength) {
  const text = String(value || '').trim();
  if (!text || text.length > maxLength) {
    throw new Error('Invalid ' + label + ' field.');
  }
  return text;
}

function optionalField(value, maxLength) {
  const text = String(value || '').trim();
  if (text.length > maxLength) {
    throw new Error('Invalid company field.');
  }
  return text;
}

function appendSubmission(submission) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets().find(function (candidate) {
    return candidate.getSheetId() === SHEET_GID;
  });
  if (!sheet) {
    throw new Error('The configured sheet tab was not found.');
  }

  let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0] : [];
  const columns = {};

  FIELDS.forEach(function (field) {
    const aliases = field.aliases;
    const existingIndex = headers.findIndex(function (header) {
      return aliases.indexOf(String(header).trim().toLowerCase()) !== -1;
    });
    if (existingIndex !== -1) {
      columns[field.key] = existingIndex;
      return;
    }

    const newIndex = headers.length;
    sheet.getRange(1, newIndex + 1).setValue(field.header);
    headers.push(field.header);
    columns[field.key] = newIndex;
  });

  const row = new Array(headers.length).fill('');
  FIELDS.forEach(function (field) {
    row[columns[field.key]] = sheetSafeValue(submission[field.key]);
  });
  sheet.appendRow(row);
}

function sheetSafeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function renderResult(success) {
  const title = success ? 'Project brief received' : 'Could not save your project brief';
  const message = success
    ? 'Your project brief has been added to our Google Sheet. Thank you for reaching out.'
    : 'We could not save your project brief. Please email hello@ponegram.com and we will help.';
  const color = success ? '#16803c' : '#b42318';
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
    title + '</title><body style="font:16px/1.6 Arial,sans-serif;max-width:620px;margin:12vh auto;padding:24px;color:#17152b">' +
    '<h1 style="font-size:28px">' + title + '</h1><p>' + message + '</p>' +
    '<p style="color:' + color + ';font-weight:600">' + (success ? 'Submission saved' : 'Submission not saved') +
    '</p></body></html>';
  return HtmlService.createHtmlOutput(html);
}
