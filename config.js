var DEFAULT_CODES = {
  'L':    { name: 'Late dienst',           action: 'export' },
  'LL3':  { name: 'Dagpost',               action: 'export' },
  'V':    { name: 'Vroege dienst',         action: 'export' },
  'D':    { name: 'Dagdienst',             action: 'export' },
  'WD':   { name: 'Wachtdienst',           action: 'export' },
  'VOR':  { name: 'Bijscholing',           action: 'export' },
  'ZT':   { name: 'Zorgteam vergadering',  action: 'export' },
  'VETO': { name: 'VETO',                  action: 'skip' },
  'POTA': { name: 'POTA',                  action: 'skip' },
  'BFU':  { name: 'BFU',                   action: 'skip' }
};

function loadConfig(callback) {
  chrome.storage.sync.get({ codes: DEFAULT_CODES }, function (result) {
    callback(result.codes);
  });
}

function saveConfig(codes, callback) {
  chrome.storage.sync.set({ codes: codes }, callback || function () {});
}
