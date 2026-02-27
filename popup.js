var data = null;

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.scripting.executeScript(
    { target: { tabId: tabs[0].id }, files: ['content.js'] },
    function (results) {
      var result = results && results[0] && results[0].result;

      if (!result || result.error) {
        document.getElementById('message').textContent =
          (result && result.error) || 'Kon rooster niet laden.';
        return;
      }

      loadConfig(function (codes) {
        data = applyConfig(result.shifts, codes);
        render(data);

        // Auto-save newly found codes as unassigned
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

    events.push({
      date: s.date,
      shortDate: s.shortDate,
      from: s.from,
      to: s.to,
      code: s.code,
      name: conf.name
    });
  });

  return { events: events, unknown: unknown };
}

function formatTime(hhmm) {
  var s = hhmm.padStart(4, '0');
  return s.slice(0, 2) + ':' + s.slice(2);
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

  var tbody = document.getElementById('shifts');
  data.events.forEach(function (e) {
    var tr = document.createElement('tr');
    var tdDate = document.createElement('td');
    tdDate.textContent = e.shortDate;
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

  if (data.events.length === 0) {
    document.getElementById('message').textContent = 'Geen diensten gevonden.';
    document.getElementById('message').style.display = '';
    document.getElementById('overview').style.display = 'none';
    return;
  }

  var btn = document.getElementById('download');
  btn.textContent = 'Download ' + data.events.length + ' diensten als .ics';
  btn.addEventListener('click', download);
}

function download() {
  var lines = data.events.map(function (e) {
    var datePart = e.date.replace(/-/g, '');
    var from = e.from.padStart(4, '0');
    var to = e.to.padStart(4, '0');
    var uid = datePart + '-' + from + '-' + to + '@timecare';
    return (
      'BEGIN:VEVENT\r\n' +
      'UID:' + uid + '\r\n' +
      'DTSTART;TZID=Europe/Brussels:' + datePart + 'T' + from + '00\r\n' +
      'DTEND;TZID=Europe/Brussels:' + datePart + 'T' + to + '00\r\n' +
      'SUMMARY:' + e.name + '\r\n' +
      'DESCRIPTION:' + e.code + '\r\n' +
      'END:VEVENT'
    );
  });

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
  var first = data.events[0].date;
  var last = data.events[data.events.length - 1].date;
  a.download = 'rooster-' + first + '_' + last + '.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
