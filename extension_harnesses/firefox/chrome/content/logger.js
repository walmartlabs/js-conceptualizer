var EverywhereLogger = function() {
  var prefs_service = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var console_service = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

  var DEBUG = true;
  var BENCH = [];
  try {
    DEBUG = prefs_service.getBoolPref("extensions.conceptualizercontextual.debug");
  } catch(ex) {
  }

  return {
    log: function(msg)
    {
      if (DEBUG) {
        console_service.logStringMessage('everywhere:' + msg);
      }
    },

    dumpObj: function(obj) {
      EverywhereLogger.log('Dump Object:' + obj);
      for(var prop in obj) {
        EverywhereLogger.log('Prop:' + prop + ':' + obj[prop]);
      }
      EverywhereLogger.log('Done Dump Object:' + obj);
    },

    bench_start: function(name) {
      BENCH[name] = new Date();
    },

    bench_finish: function(name) {
      var end = new Date();
      this.log(name + "::" + (end - BENCH[name]) + " ms");
    }
  }
}();
