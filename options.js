var tbody = document.getElementById('codes');

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
    tr.style.background = select.value === 'unassigned' ? '#fff3cd' : '';
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

document.getElementById('add').addEventListener('click', function () {
  addRow('', '', '#999999', 'export');
});

document.getElementById('save').addEventListener('click', function () {
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

  saveConfig(codes, function () {
    var status = document.getElementById('status');
    status.style.display = 'inline';
    setTimeout(function () { status.style.display = 'none'; }, 2000);
  });
});
