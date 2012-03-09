var EverywhereBlacklist = function() {
  var prefs_service_ = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var blacklist_ = []

  const BLACKLIST_PREF = "extensions.conceptualizercontextual.blacklist";
  const DEFAULT_BLACKLIST = ["mail.yahoo.com","gmail.com","mail.google.com","hotmail.com","facebook.com"];

  // Private functions
  var uniquify = function(ary) {
    var a = [];
    var l = ary.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        // If this[i] is found later in the array
        if (ary[i] === ary[j])
          j = ++i;
      }
      a.push(ary[i]);
    }
    return a;
  };

  return {
    blacklist: blacklist_,

    init: function() {
      blacklist_ = DEFAULT_BLACKLIST;
      try {
        var blacklist_text = prefs_service_.getCharPref(BLACKLIST_PREF);
        EverywhereLogger.log("Blacklist Text:" + blacklist_text);
        blacklist_ = JSON.parse(blacklist_text);
        EverywhereLogger.log('Retrieved Blacklist of Length:' + blacklist_.length);
      } catch (ex) {
        EverywhereLogger.log("Caught Exception Reading Blacklist:" + ex);
        blacklist_ = DEFAULT_BLACKLIST;
      }
    },

    getBlacklist: function() {
      blacklist_ = DEFAULT_BLACKLIST;
      try {
        var blacklist_text = prefs_service_.getCharPref(BLACKLIST_PREF);
        blacklist_ = JSON.parse(blacklist_text);
        EverywhereLogger.log('Retrieved Blacklist of Length:' + blacklist_.length);
      } catch (ex) {
        EverywhereLogger.log("Caught Exception Reading Blacklist:" + ex);
        blacklist_ = DEFAULT_BLACKLIST;
      }
      return blacklist_;
    },

    matchesBlacklist: function(host) {
      this.getBlacklist();
      EverywhereLogger.log('Checking for "' + host + '" in blacklist');
      for(var i=0; i < blacklist_.length; i++) {
        var entry = blacklist_[i];
        EverywhereLogger.log('Checking against:"' + entry + '"');
        if (entry.charAt(0) == '.') {
          if (host.indexOf(entry) >= 0) {
            EverywhereLogger.log(host + " matched " + entry + " in blacklist");
            return true;
          }
        } else {
          if (host == entry) {
            EverywhereLogger.log(host + "exact matched " + entry + " in blacklist");
            return true
          } else if (host.indexOf("." + entry) >= 0) {
            EverywhereLogger.log(host + "fuzzy matched " + entry + " in blacklist");
            return true;
          }
        }
      }
      return false;
    },

    addToBlacklist: function(host) {
      EverywhereLogger.log('Starting Adding:' + JSON.stringify(blacklist_));
      if (host.length == 0) {
        EverywhereLogger.log('Trying to add empty host to blacklist so bailing out');
        return;
      }
      blacklist_.push(host);
      blacklist_ = uniquify(blacklist_);

      try {
        prefs_service_.setCharPref(BLACKLIST_PREF,JSON.stringify(blacklist_));
      } catch (ex) {
        EverywhereLogger.log('Caught Exception' + ex);
      }
      EverywhereLogger.log('Finished Adding:' + JSON.stringify(blacklist_));
    },

    removeFromBlacklist: function(hosts) {
      EverywhereLogger.log('Starting Removing:' + JSON.stringify(blacklist_));
      for(var i=0; i < blacklist_.length; i++) {
        for(var j=0; j < hosts.length; j++) {
          var host = hosts[j];
          if (blacklist_[i] == host) {
            EverywhereLogger.log('Splicing out "' + host + '"');
            blacklist_.splice(i,1);
            break;
          }
        }
      }

      EverywhereLogger.log(JSON.stringify(blacklist_));

      try {
        prefs_service_.setCharPref(BLACKLIST_PREF,JSON.stringify(blacklist_));
      } catch (ex) {
        EverywhereLogger.log('Caught Exception' + ex);
      }
      EverywhereLogger.log('Finished Removing:' + JSON.stringify(blacklist_));
    }

  }
}();
EverywhereBlacklist.init();
