var data = null;
var weekFilter = {};
var mergeEnabled = false;
var exportHistory = [];

// Load export history
chrome.storage.local.get({ exportHistory: [] }, function (result) {
  exportHistory = result.exportHistory;
});

// Settings link
document.getElementById('settings').addEventListener('click', function (e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Merge toggle
document.getElementById('merge-toggle').addEventListener('change', function () {
  mergeEnabled = this.checked;
  renderTable();
});

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.scripting.executeScript(
    { target: { tabId: tabs[0].id }, files: ['content.js'] },
    function (results) {
      var result = results && results[0] && results[0].result;

      if (!result || result.error) {
        var msg = document.getElementById('message');
        msg.textContent = (result && result.error) || 'Kon rooster niet laden.';
        return;
      }

      loadConfig(function (codes) {
        data = applyConfig(result.shifts, codes);
        render(data);

        if (data.unknown.length > 0) {
          data.unknown.forEach(function (code) {
            var baseCode = code.split(/[\s(]/)[0];
            if (!codes[baseCode]) {
              codes[baseCode] = { name: baseCode, action: 'unassigned' };
            }
          });
          saveConfig(codes);
        }
      });
    }
  );
});

function applyConfig(shifts, codes) {
  var events = [];
  var unknown = [];

  shifts.forEach(function (s) {
    var conf = codes[s.baseCode];

    if (!conf || conf.action === 'unassigned') {
      if (unknown.indexOf(s.code) === -1) unknown.push(s.code);
      return;
    }

    if (conf.action === 'skip') return;

    var fromMin = toMinutes(s.from);
    var toMin = toMinutes(s.to);
    var endDate = s.date;
    if (toMin <= fromMin) {
      endDate = nextDay(s.date);
    }

    events.push({
      date: s.date,
      endDate: endDate,
      shortDate: s.shortDate,
      from: s.from,
      to: s.to,
      code: s.code,
      baseCode: s.baseCode,
      name: conf.name,
      color: conf.color || '#999'
    });
  });

  return { events: events, unknown: unknown };
}

function toMinutes(hhmm) {
  var s = hhmm.padStart(4, '0');
  return parseInt(s.slice(0, 2)) * 60 + parseInt(s.slice(2));
}

function nextDay(dateStr) {
  var parts = dateStr.split('-');
  var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  d.setDate(d.getDate() + 1);
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

function formatTime(hhmm) {
  var s = hhmm.padStart(4, '0');
  return s.slice(0, 2) + ':' + s.slice(2);
}

function formatHours(totalHours) {
  var h = Math.floor(totalHours);
  var m = Math.round((totalHours - h) * 60);
  return h + ':' + (m < 10 ? '0' : '') + m;
}

function calcHours(from, to) {
  var startMin = toMinutes(from);
  var endMin = toMinutes(to);
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}

function getWeekNumber(dateStr) {
  var parts = dateStr.split('-');
  var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  var week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getEventUid(e) {
  var startDate = e.date.replace(/-/g, '');
  var from = e.from.padStart(4, '0');
  var to = e.to.padStart(4, '0');
  return startDate + '-' + from + '-' + to + '@timecare';
}

function findConflicts(events) {
  var conflicts = {};
  for (var i = 0; i < events.length; i++) {
    for (var j = i + 1; j < events.length; j++) {
      if (events[i].date !== events[j].date) continue;
      var aStart = toMinutes(events[i].from);
      var aEnd = toMinutes(events[i].to);
      if (aEnd <= aStart) aEnd += 24 * 60;
      var bStart = toMinutes(events[j].from);
      var bEnd = toMinutes(events[j].to);
      if (bEnd <= bStart) bEnd += 24 * 60;
      if (aStart < bEnd && bStart < aEnd) {
        conflicts[i] = true;
        conflicts[j] = true;
      }
    }
  }
  return conflicts;
}

function mergeConsecutiveShifts(events) {
  if (events.length === 0) return events;
  var sorted = events.slice().sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return toMinutes(a.from) - toMinutes(b.from);
  });
  var merged = [sorted[0]];
  for (var i = 1; i < sorted.length; i++) {
    var prev = merged[merged.length - 1];
    var curr = sorted[i];
    if (prev.date === curr.date && prev.to === curr.from) {
      merged[merged.length - 1] = {
        date: prev.date,
        endDate: curr.endDate,
        shortDate: prev.shortDate,
        from: prev.from,
        to: curr.to,
        code: prev.code + ' + ' + curr.code,
        baseCode: prev.baseCode,
        name: prev.name + ' + ' + curr.name,
        color: prev.color
      };
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

function getFilteredEvents() {
  var filtered = data.events.filter(function (e) {
    var week = getWeekNumber(e.date);
    return weekFilter[week] !== false;
  });
  if (mergeEnabled) {
    filtered = mergeConsecutiveShifts(filtered);
  }
  return filtered;
}

function render(data) {
  document.getElementById('message').style.display = 'none';
  document.getElementById('overview').style.display = '';

  if (data.unknown.length > 0) {
    var box = document.getElementById('unknown');
    var warning = document.createElement('div');
    warning.className = 'warning';
    var strong = document.createElement('strong');
    strong.textContent = 'Onbekende codes overgeslagen:';
    warning.appendChild(strong);
    warning.appendChild(document.createTextNode(' ' + data.unknown.join(', ')));
    box.appendChild(warning);
  }

  if (data.events.length === 0) {
    document.getElementById('message').textContent = 'Geen diensten gevonden.';
    document.getElementById('message').style.display = '';
    document.getElementById('overview').style.display = 'none';
    return;
  }

  var weeks = [];
  data.events.forEach(function (e) {
    var w = getWeekNumber(e.date);
    if (weeks.indexOf(w) === -1) weeks.push(w);
    if (weekFilter[w] === undefined) weekFilter[w] = true;
  });

  // Show export history info
  var previouslyExported = 0;
  data.events.forEach(function (e) {
    if (exportHistory.indexOf(getEventUid(e)) !== -1) previouslyExported++;
  });
  if (previouslyExported > 0) {
    var infoBar = document.getElementById('export-info');
    var info = document.createElement('div');
    info.className = 'info-bar';
    info.textContent = previouslyExported + ' van ' + data.events.length + ' diensten eerder geëxporteerd';
    infoBar.appendChild(info);
  }

  renderWeekFilter(weeks);
  renderTable();

  document.getElementById('download').addEventListener('click', download);
  document.getElementById('gcal').addEventListener('click', addToGoogleCalendar);
  document.getElementById('copy').addEventListener('click', copyText);
}

function renderWeekFilter(weeks) {
  var container = document.getElementById('week-filter');
  container.textContent = '';
  weeks.forEach(function (w) {
    var label = document.createElement('label');
    label.className = 'week-chip' + (weekFilter[w] !== false ? ' active' : '');
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = weekFilter[w] !== false;
    cb.addEventListener('change', function () {
      weekFilter[w] = cb.checked;
      label.className = 'week-chip' + (cb.checked ? ' active' : '');
      renderTable();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode('Week ' + w));
    container.appendChild(label);
  });
}

function renderTable() {
  var filtered = getFilteredEvents();
  var conflicts = findConflicts(filtered);

  var tbody = document.getElementById('shifts');
  tbody.textContent = '';
  var totalHours = 0;
  var weekHours = 0;
  var lastWeek = null;
  var stats = {};
  var uniqueWeeks = [];

  // Count unique weeks
  filtered.forEach(function (e) {
    var w = getWeekNumber(e.date);
    if (uniqueWeeks.indexOf(w) === -1) uniqueWeeks.push(w);
  });
  var multipleWeeks = uniqueWeeks.length > 1;

  var conflictBox = document.getElementById('conflicts');
  conflictBox.textContent = '';
  if (Object.keys(conflicts).length > 0) {
    var warning = document.createElement('div');
    warning.className = 'warning conflict';
    var strong = document.createElement('strong');
    strong.textContent = 'Overlappende diensten gevonden';
    warning.appendChild(strong);
    conflictBox.appendChild(warning);
  }

  filtered.forEach(function (e, i) {
    var week = getWeekNumber(e.date);

    // Week boundary: subtotal for previous week
    if (lastWeek !== null && week !== lastWeek) {
      if (multipleWeeks) {
        addWeekSubtotal(tbody, lastWeek, weekHours);
      }
      weekHours = 0;
    }
    lastWeek = week;

    var hours = calcHours(e.from, e.to);
    totalHours += hours;
    weekHours += hours;

    stats[e.name] = (stats[e.name] || 0) + 1;

    var tr = document.createElement('tr');
    if (conflicts[i]) tr.className = 'conflict-row';

    var tdDate = document.createElement('td');
    var dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = e.color;
    tdDate.appendChild(dot);
    tdDate.appendChild(document.createTextNode(e.shortDate));

    var tdName = document.createElement('td');
    tdName.textContent = e.name;
    var tdFrom = document.createElement('td');
    tdFrom.className = 'time';
    tdFrom.textContent = formatTime(e.from);
    var tdTo = document.createElement('td');
    tdTo.className = 'time';
    tdTo.textContent = formatTime(e.to);
    tr.appendChild(tdDate);
    tr.appendChild(tdName);
    tr.appendChild(tdFrom);
    tr.appendChild(tdTo);
    tbody.appendChild(tr);
  });

  // Subtotal for last week
  if (multipleWeeks && lastWeek !== null) {
    addWeekSubtotal(tbody, lastWeek, weekHours);
  }

  // Total hours
  var totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  var tdLabel = document.createElement('td');
  tdLabel.colSpan = 3;
  tdLabel.textContent = 'Totaal';
  var tdHours = document.createElement('td');
  tdHours.className = 'time';
  tdHours.textContent = formatHours(totalHours);
  totalRow.appendChild(tdLabel);
  totalRow.appendChild(tdHours);
  tbody.appendChild(totalRow);

  // Stats
  var statsEl = document.getElementById('stats');
  statsEl.textContent = '';
  var entries = Object.keys(stats).sort(function (a, b) { return stats[b] - stats[a]; });
  entries.forEach(function (name) {
    var span = document.createElement('span');
    span.className = 'stat-chip';
    span.textContent = stats[name] + 'x ' + name;
    statsEl.appendChild(span);
  });

  // Button text
  var btn = document.getElementById('download');
  btn.textContent = 'Download ' + filtered.length + ' diensten als .ics';
}

function addWeekSubtotal(tbody, week, hours) {
  var row = document.createElement('tr');
  row.className = 'week-subtotal';
  var tdLabel = document.createElement('td');
  tdLabel.colSpan = 3;
  var lbl = document.createElement('span');
  lbl.className = 'week-label';
  lbl.textContent = 'Week ' + week;
  tdLabel.appendChild(lbl);
  var tdHours = document.createElement('td');
  tdHours.className = 'time';
  tdHours.textContent = formatHours(hours);
  row.appendChild(tdLabel);
  row.appendChild(tdHours);
  tbody.appendChild(row);
}

function buildIcsEvents(events) {
  return events.map(function (e) {
    var startDate = e.date.replace(/-/g, '');
    var endDatePart = e.endDate.replace(/-/g, '');
    var from = e.from.padStart(4, '0');
    var to = e.to.padStart(4, '0');
    var uid = getEventUid(e);
    return (
      'BEGIN:VEVENT\r\n' +
      'UID:' + uid + '\r\n' +
      'DTSTART;TZID=Europe/Brussels:' + startDate + 'T' + from + '00\r\n' +
      'DTEND;TZID=Europe/Brussels:' + endDatePart + 'T' + to + '00\r\n' +
      'SUMMARY:' + e.name + '\r\n' +
      'DESCRIPTION:' + e.code + '\r\n' +
      'END:VEVENT'
    );
  });
}

function saveExportedUids(events) {
  var uids = events.map(getEventUid);
  chrome.storage.local.get({ exportHistory: [] }, function (result) {
    var existing = result.exportHistory;
    uids.forEach(function (uid) {
      if (existing.indexOf(uid) === -1) existing.push(uid);
    });
    // Keep only last 500 entries
    if (existing.length > 500) existing = existing.slice(-500);
    chrome.storage.local.set({ exportHistory: existing });
  });
}

function download() {
  var filtered = getFilteredEvents();
  if (filtered.length === 0) return;

  var lines = buildIcsEvents(filtered);

  var ics =
    'BEGIN:VCALENDAR\r\n' +
    'VERSION:2.0\r\n' +
    'PRODID:-//TimeCare to Calendar//EN\r\n' +
    'X-WR-TIMEZONE:Europe/Brussels\r\n' +
    lines.join('\r\n') + '\r\n' +
    'END:VCALENDAR';

  var blob = new Blob([ics], { type: 'text/calendar' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  var first = filtered[0].date;
  var last = filtered[filtered.length - 1].date;
  a.download = 'rooster-' + first + '_' + last + '.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Save to export history
  saveExportedUids(filtered);

  // Success feedback
  var btn = document.getElementById('download');
  var original = btn.textContent;
  btn.textContent = 'Gedownload!';
  btn.classList.add('success');
  setTimeout(function () {
    btn.textContent = original;
    btn.classList.remove('success');
  }, 1500);
}

function addToGoogleCalendar() {
  var filtered = getFilteredEvents();
  if (filtered.length === 0) return;

  chrome.storage.sync.get({ gcalClientId: '' }, function (result) {
    if (!result.gcalClientId) {
      chrome.runtime.openOptionsPage();
      return;
    }
    doGoogleCalendarAuth(result.gcalClientId, filtered);
  });
}

function doGoogleCalendarAuth(clientId, events) {
  var btn = document.getElementById('gcal');
  btn.textContent = 'Inloggen...';
  btn.disabled = true;

  var redirectUrl = chrome.identity.getRedirectURL();
  var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&response_type=token' +
    '&redirect_uri=' + encodeURIComponent(redirectUrl) +
    '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/calendar.events');

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    function (responseUrl) {
      if (chrome.runtime.lastError || !responseUrl) {
        btn.textContent = 'Login mislukt';
        btn.disabled = false;
        setTimeout(function () { btn.textContent = 'Google Calendar'; }, 2000);
        return;
      }

      var match = responseUrl.match(/access_token=([^&]*)/);
      if (!match) {
        btn.textContent = 'Login mislukt';
        btn.disabled = false;
        setTimeout(function () { btn.textContent = 'Google Calendar'; }, 2000);
        return;
      }

      createCalendarEvents(match[1], events);
    }
  );
}

function createCalendarEvents(token, events) {
  var btn = document.getElementById('gcal');
  var total = events.length;
  var done = 0;
  var errors = 0;

  events.forEach(function (e) {
    var from = e.from.padStart(4, '0');
    var to = e.to.padStart(4, '0');

    var event = {
      iCalUID: getEventUid(e),
      summary: e.name,
      description: e.code,
      start: {
        dateTime: e.date + 'T' + from.slice(0, 2) + ':' + from.slice(2) + ':00',
        timeZone: 'Europe/Brussels'
      },
      end: {
        dateTime: e.endDate + 'T' + to.slice(0, 2) + ':' + to.slice(2) + ':00',
        timeZone: 'Europe/Brussels'
      }
    };

    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/import', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).then(function (response) {
      done++;
      if (!response.ok) errors++;
      btn.textContent = done + '/' + total + ' toegevoegd...';
      if (done === total) {
        saveExportedUids(events);
        if (errors === 0) {
          btn.textContent = 'Toegevoegd!';
          btn.classList.add('success');
        } else {
          btn.textContent = errors + ' fouten';
        }
        btn.disabled = false;
        setTimeout(function () {
          btn.textContent = 'Google Calendar';
          btn.classList.remove('success');
        }, 2000);
      }
    });
  });
}

function copyText() {
  var filtered = getFilteredEvents();
  var lines = filtered.map(function (e) {
    return e.shortDate + '  ' + e.name + '  ' + formatTime(e.from) + '-' + formatTime(e.to);
  });
  var text = lines.join('\n');
  navigator.clipboard.writeText(text).then(function () {
    var btn = document.getElementById('copy');
    btn.textContent = 'Gekopieerd!';
    setTimeout(function () { btn.textContent = 'Kopieer als tekst'; }, 1500);
  });
}
