(function () {
  var DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];

  var table = document.getElementById('Table3');
  if (!table) return { error: 'Geen rooster gevonden (Table3 niet gevonden).' };

  var rows = table.querySelectorAll('tr.Table_Data');
  var shifts = [];

  rows.forEach(function (row) {
    var dateCell = row.querySelector('.DateCells');
    var codeCell = row.querySelector('.CodeCells');
    var fromCell = row.querySelector('.FromCells');
    var toCell = row.querySelector('.ToCells');

    if (!dateCell || !fromCell || !toCell) return;

    var from = fromCell.textContent.trim();
    var to = toCell.textContent.trim();
    if (!from || !to) return;

    var dateText = dateCell.textContent.trim();
    var code = codeCell ? codeCell.textContent.trim() : '';
    if (!code) return;

    var baseCode = code.split(/[\s(]/)[0];
    var parts = dateText.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var shortDate = DAYS[d.getDay()] + ' ' + parts[2] + '/' + parts[1];

    shifts.push({
      date: dateText,
      shortDate: shortDate,
      from: from,
      to: to,
      code: code,
      baseCode: baseCode
    });
  });

  return { shifts: shifts };
})();
