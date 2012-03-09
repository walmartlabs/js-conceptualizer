var EverywhereOptions = function() {
  // Constants
  const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  const BLACKLIST_PREF = "extensions.conceptualizercontextual.blacklist";

  // Static Variables
  var prefs_service_ = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

  return {
    /* Setup the necessary events for the UI elements described in options.xul */
    init: function() {
      var input = document.getElementById('blacklist_input');
      var add_button = document.getElementById('blacklist_input_button');
      var remove_button = document.getElementById('blacklist_remove_button');
      var lb = document.getElementById('blacklist_listbox');

      input.addEventListener('change',function() {
        EverywhereLogger.log('Input Changed');
      }, true);
      input.addEventListener('keyup',function() {
        EverywhereLogger.log('Key Input Changed');
        add_button.disabled = !(input.value.length > 0);
      }, true);

      add_button.addEventListener('command',function() {
        EverywhereOptions.addBlacklistURL();
      }, true);

      remove_button.addEventListener('command',function() {
        EverywhereOptions.removeBlacklistURL();
      }, true);

      lb.addEventListener('select', function() {
        EverywhereLogger.log('Element Selected');
        remove_button.disabled = false;
      },true);

      EverywhereOptions.updateListBoxUI();
    },

    updateListBoxUI: function() {
      EverywhereLogger.log('Rendering Preferences 1.2');
      var blacklist = EverywhereBlacklist.getBlacklist();
      var lb = document.getElementById('blacklist_listbox');
      if (lb.hasChildNodes()) {
        while(lb.childNodes.length >= 1) {
          lb.removeChild(lb.firstChild);
        }
      }

      for(var i=0; i < blacklist.length; i++) {
        var item = document.createElementNS(XUL_NS,"listitem");
        item.setAttribute("label",blacklist[i]);
        lb.appendChild(item);
      }
      var input = document.getElementById('blacklist_input');
      input.value = "";

      var input_button = document.getElementById('blacklist_input_button');
      input_button.disabled = true;

      var remove_button = document.getElementById('blacklist_remove_button');
      remove_button.disabled = true;

      EverywhereLogger.log('Done Rendering Preferences');
    },

    /*
     * Add the current input to the blacklist and update the UI accordingly
     */
    addBlacklistURL: function() {
      var input = document.getElementById('blacklist_input');
      var value = input.value;
      EverywhereLogger.log("Adding " + value + " to blacklist");
      EverywhereBlacklist.addToBlacklist(value);
      EverywhereOptions.updateListBoxUI();
      EverywhereLogger.log("Done Adding " + value + " to blacklist");
    },

    /*
     * Removes the selected item(s) from the pref array and then rewrites it
     * back to the preferences.
     */
    removeBlacklistURL: function() {
      EverywhereLogger.log("Removing from blacklist");
      hosts = [];
      var lb = document.getElementById('blacklist_listbox');
      for(var j=0; j < lb.selectedItems.length; j++) {
        var sel = lb.selectedItems[j];
        hosts.push(sel.label);
      }

      EverywhereLogger.log('Removing:' + JSON.stringify(hosts));

      EverywhereBlacklist.removeFromBlacklist(hosts);

      EverywhereOptions.updateListBoxUI();
      EverywhereLogger.log("Done Removing");
    },
  };
}();

EverywhereOptions.init();
