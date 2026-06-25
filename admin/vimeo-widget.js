// Vimeo widget — uses plain string input (see /vimeo-picker for video browser)
(function() {
  var string = window.CMS.resolveWidget('string');
  window.CMS.registerWidget('vimeo-browser', string.control, string.preview);
})();
