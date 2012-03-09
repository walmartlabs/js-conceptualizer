var EverywhereTagBlacklist = function() {
  var prefs_service_ = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var tag_blacklist_ = {};
  var TAG_BLACKLIST_PREF = 'extensions.conceptualizercontextual.tag-blacklist';

  var load_tag_blacklist = function(str) {
    EverywhereLogger.log('load_tag_blacklist');
    try {
      var tag_blacklist_json = prefs_service_.getCharPref(TAG_BLACKLIST_PREF);
      tag_blacklist_= JSON.parse(tag_blacklist_json);
      var d = new Date();
      var deleted = false;
      for(var elem in tag_blacklist_) {
        if (d.getTime() - tag_blacklist_[elem] > 604800000) { //1 week in milliseconds
          EverywhereLogger.log('Tag Blacklist:' + elem + ' has expired');
          delete tag_blacklist_[elem];
          deleted = true;
        }
      }
      if (deleted) {
        try {
          prefs_service_.setCharPref(TAG_BLACKLIST_PREF, JSON.stringify(tag_blacklist_));
        } catch (ex) {
          EverywhereLogger.log('Caught Exception:' + ex);
        }
      }
    } catch (ex) {
      EverywhereLogger.log('Caught Exception:' + ex);
      tag_blacklist_= {};
    }
    EverywhereLogger.log('done load_tag_blacklist');
  };

  // Initialization
  load_tag_blacklist();

  return {
    is_in_blacklist: function(str) {
      if (tag_blacklist_.hasOwnProperty(str)) {
        var d = new Date();
        if (d.getTime() - tag_blacklist_[str] > 604800000) { //1 week in milliseconds
          delete tag_blacklist_[str];
        }
        return true;
      }
      return false;
    },

    add_to_blacklist: function(str) {
      EverywhereLogger.log('Adding ' + str + ' to blacklist');
      var d = new Date();
      tag_blacklist_[str] = d.getTime();
      try {
        prefs_service_.setCharPref(TAG_BLACKLIST_PREF, JSON.stringify(tag_blacklist_));
      } catch (ex) {
        EverywhereLogger.log('Caught Exception:' + ex);
      }
    }
  }
}();
