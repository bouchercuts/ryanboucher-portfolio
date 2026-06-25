// Vimeo Widget — debug version to find React in Decap 3.x
(function () {
  // Log everything on window that might be React or contain it
  var found = [];
  for (var key in window) {
    try {
      var obj = window[key];
      if (!obj || typeof obj !== 'object' && typeof obj !== 'function') continue;
      // Direct React check
      if (obj.createElement && obj.Component) {
        found.push('REACT DIRECT: window.' + key);
      }
      // Nested React check
      if (obj.React && obj.React.createElement) {
        found.push('REACT NESTED: window.' + key + '.React');
      }
      if (obj.default && obj.default.createElement && obj.default.Component) {
        found.push('REACT DEFAULT: window.' + key + '.default');
      }
    } catch(e) {}
  }
  console.log('[vimeo-widget] React search results:', found.length ? found : 'NONE FOUND');
  console.log('[vimeo-widget] window.CMS keys:', window.CMS ? Object.keys(window.CMS).join(', ') : 'CMS not found');
})();
