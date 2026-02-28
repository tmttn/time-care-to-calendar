var tbody = document.getElementById('codes');

// Load Google Calendar client ID
chrome.storage.sync.get({ gcalClientId: '' }, function (result) {
  document.getElementById('gcal-client-id').value = result.gcalClientId || '';
});

document.getElementById('save-gcal').addEventListener('click', function () {
  var clientId = document.getElementById('gcal-client-id').value.trim();
  chrome.storage.sync.set({ gcalClientId: clientId }, function () {
    var status = document.getElementById('gcal-status');
    status.style.opacity = '1';
    setTimeout(function () { status.style.opacity = '0'; }, 2000);
  });
});

loadConfig(function (codes) {
  var keys = Object.keys(codes).sort(function (a, b) {
    var aU = codes[a].action === 'unassigned' ? 0 : 1;
    var bU = codes[b].action === 'unassigned' ? 0 : 1;
    return aU - bU;
  });
  keys.forEach(function (code) {
    addRow(code, codes[code].name, codes[code].color, codes[code].action);
  });
});

function addRow(code, name, color, action) {
  var tr = document.createElement('tr');

  var tdCode = document.createElement('td');
  var inputCode = document.createElement('input');
  inputCode.type = 'text';
  inputCode.value = code || '';
  inputCode.className = 'code-input';
  tdCode.appendChild(inputCode);

  var tdName = document.createElement('td');
  var inputName = document.createElement('input');
  inputName.type = 'text';
  inputName.value = name || '';
  inputName.className = 'name-input';
  tdName.appendChild(inputName);

  var tdColor = document.createElement('td');
  var inputColor = document.createElement('input');
  inputColor.type = 'color';
  inputColor.value = color || '#999999';
  inputColor.className = 'color-input';
  tdColor.appendChild(inputColor);

  var tdAction = document.createElement('td');
  var select = document.createElement('select');
  select.className = 'action-input';
  var options = [
    { value: 'export', text: 'Exporteren' },
    { value: 'skip', text: 'Overslaan' },
    { value: 'unassigned', text: 'Niet toegewezen' }
  ];
  options.forEach(function (o) {
    var opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.text;
    select.appendChild(opt);
  });
  select.value = action || 'export';
  tdAction.appendChild(select);

  function updateStyle() {
    tr.className = select.value === 'unassigned' ? 'unassigned-row' : '';
  }
  select.addEventListener('change', updateStyle);
  updateStyle();

  var tdDelete = document.createElement('td');
  var btnDelete = document.createElement('button');
  btnDelete.className = 'delete-btn';
  btnDelete.textContent = '\u00d7';
  btnDelete.title = 'Verwijderen';
  btnDelete.addEventListener('click', function () {
    tr.remove();
  });
  tdDelete.appendChild(btnDelete);

  tr.appendChild(tdCode);
  tr.appendChild(tdName);
  tr.appendChild(tdColor);
  tr.appendChild(tdAction);
  tr.appendChild(tdDelete);
  tbody.appendChild(tr);
}

function collectCodes() {
  var rows = tbody.querySelectorAll('tr');
  var codes = {};
  rows.forEach(function (row) {
    var code = row.querySelector('.code-input').value.trim();
    if (!code) return;
    codes[code] = {
      name: row.querySelector('.name-input').value.trim() || code,
      color: row.querySelector('.color-input').value,
      action: row.querySelector('.action-input').value
    };
  });
  return codes;
}

document.getElementById('add').addEventListener('click', function () {
  addRow('', '', '#999999', 'export');
});

document.getElementById('save').addEventListener('click', function () {
  saveConfig(collectCodes(), function () {
    var status = document.getElementById('status');
    status.classList.add('visible');
    setTimeout(function () { status.classList.remove('visible'); }, 2000);
  });
});

// Export config as JSON
document.getElementById('export-config').addEventListener('click', function () {
  var codes = collectCodes();
  var json = JSON.stringify(codes, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'timecare-config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Import config from JSON
document.getElementById('import-config').addEventListener('click', function () {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    try {
      var codes = JSON.parse(ev.target.result);
      // Clear existing rows
      tbody.textContent = '';
      // Add imported rows
      var keys = Object.keys(codes).sort(function (a, b) {
        var aU = codes[a].action === 'unassigned' ? 0 : 1;
        var bU = codes[b].action === 'unassigned' ? 0 : 1;
        return aU - bU;
      });
      keys.forEach(function (code) {
        addRow(code, codes[code].name, codes[code].color, codes[code].action);
      });
      // Auto-save
      saveConfig(codes, function () {
        var status = document.getElementById('status');
        status.textContent = 'Geïmporteerd!';
        status.classList.add('visible');
        setTimeout(function () {
          status.classList.remove('visible');
          status.textContent = 'Opgeslagen!';
        }, 2000);
      });
    } catch (err) {
      alert('Ongeldig configuratiebestand.');
    }
  };
  reader.readAsText(file);
  // Reset file input
  e.target.value = '';
});
