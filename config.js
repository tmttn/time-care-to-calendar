var DEFAULT_CODES = {
  'L':    { name: 'Late dienst',           action: 'export', color: '#5b6abf' },
  'LL3':  { name: 'Dagpost',               action: 'export', color: '#6a9f4d' },
  'V':    { name: 'Vroege dienst',         action: 'export', color: '#e8a735' },
  'D':    { name: 'Dagdienst',             action: 'export', color: '#4a9abe' },
  'WD':   { name: 'Wachtdienst',           action: 'export', color: '#c0392b' },
  'VOR':  { name: 'Bijscholing',           action: 'export', color: '#8e44ad' },
  'ZT':   { name: 'Zorgteam vergadering',  action: 'export', color: '#d4731a' },
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
