/*
const STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
const STATE_IS_DOCUMENT = Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT;
const STATE_IS_REQUEST = Components.interfaces.nsIWebProgressListener.STATE_IS_REQUEST;
const STATE_IS_WINDOW = Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW;
*/

var ConceptualizerEverywhereProgressListener = {
  onStateChange: function(aBrowser,aWebProgress,aRequest,aStateFlags,aStatus){
    EverywhereLogger.log('On State Change');
    if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP && aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW) {
      var url = aWebProgress.DOMWindow.location.href;
      if(aWebProgress.DOMWindow != aWebProgress.DOMWindow.top) {
        if (url.indexOf('http://www.google.com/search?') != 0) {
          return;
        }
        EverywhereLogger.log('GOOGLE HACK');
      }
      var win = aWebProgress.DOMWindow;
      var dom = aWebProgress.DOMWindow.window.document;
      ConceptualizerEverywhereExtension.runExtension(win,dom);
    }
  },

  onLocationChange: function(aBrowser,aProgress, aRequest, aURI)  {
    // This fires when the location bar changes; i.e load event is confirmed
    // or when the user switches tabs. If you use myListener for more than one tab/window,
    // use aProgress.DOMWindow to obtain the tab/window which triggered the change.
  },

  onProgressChange: function(aBrowser, aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) {},
  onStatusChange: function(aBrowser,aWebProgress, aRequest, aStatus, aMessage) { },
  onSecurityChange: function(aBrowser,aWebProgress, aRequest, aState) { }
};

var ConceptualizerEverywhereExtension = function() {
  var prefs_service_ = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
  var version_ = "firefox-@VERSION@";

  /*
   * This is a script element that we insert into the DOM that contains all of
   * the relevant preferences, so the everywhere.js from the server can have
   * access to them.
   */
  var build_preference_element = function(dom) {
    var meta = dom.createElement('script');
    meta.type = 'text/javascript';
    var oot_enabled = true;
    try {
      oot_enabled = prefs_service_.getBoolPref("extensions.conceptualizercontextual.oot_enabled");
    } catch (ex) {
    }
    var everywhere_url = "http://everywhere.conceptualizer.com/hyper";
    try {
      everywhere_url = prefs_service_.getCharPref("extensions.conceptualizercontextual.url");
    } catch (ex) {
    }

    var installDate = "0";
    try {
      installDate = prefs_service_.getCharPref('extensions.conceptualizercontextual.installDate');
    } catch (ex) {
    }
    // Put a trailing slash on the everywhere_url because of inconsistency in chrome version
    everywhere_url += "/";
    meta.innerHTML = "var ConceptualizerEverywherePreferences = " + JSON.stringify({oot_enabled: oot_enabled, version: version_, everywhere_url: everywhere_url, installDate: installDate});
    return meta;
  };

  return {
    enabled: true,
    version: null,
    installDate: null,

    init: function() {
      EverywhereLogger.log('Initializing Conceptualizer Everywhere Extension');
      ConceptualizerHarness.initialize();

      gBrowser.addTabsProgressListener(ConceptualizerEverywhereProgressListener);
      prefs_service_.addObserver("",this,false);
      ConceptualizerEverywhereExtension.version = version_;

      try {
        prefs_service_.getBoolPref('extensions.conceptualizercontextual.alreadyRan');
      } catch(ex) {
        EverywhereLogger.log('Opening up Tutorial');
        //gBrowser.addTab('chrome://conceptualizercontextual/content/intro.html');
        window.open('chrome://conceptualizercontextual/content/intro.html','','width=600,height=250,chrome,toolbar,alwaysRaised=yes');
        setTimeout("ConceptualizerEverywhereExtension.enableSapp();", 2000);
        prefs_service_.setBoolPref('extensions.conceptualizercontextual.alreadyRan',true);
      }

      var installDatePref = 'extensions.conceptualizercontextual.installDate';
      try {
        ConceptualizerEverywhereExtension.installDate = prefs_service_.getCharPref(installDatePref);
      } catch(ex) {
        EverywhereLogger.log('Setting installDate');
        var d=new Date();
        var ts = d.getTime() + 1000*60*d.getTimezoneOffset();
        ConceptualizerEverywhereExtension.installDate = "" + ts;
        prefs_service_.setCharPref(installDatePref,this.installDate);
      }

      var panel_menu = document.getElementById('everywhere-status-menu');
      panel_menu.addEventListener('popupshowing',function() {
        EverywhereLogger.log('Popup Showing');
        var current_url_menu = document.getElementById('everywhere-status-menu-current-url');
        var current_host = gBrowser.selectedBrowser.contentWindow.document.location.host;
        current_url_menu.label = "Add " + current_host + " to the blacklist";
      },true);

      var current_url_menu = document.getElementById('everywhere-status-menu-current-url');
      current_url_menu.addEventListener('command', function() {
        var current_host = gBrowser.selectedBrowser.contentWindow.document.location.host;
        EverywhereLogger.log('Blacklisting Current URL:' + current_host);
        EverywhereBlacklist.addToBlacklist(current_host);
      }, true);

      var panel_menu_prefs = document.getElementById('everywhere-status-menu-preferences');
      panel_menu_prefs.addEventListener('command',function() {
        EverywhereLogger.log('Preferences calling the options page');
        window.openDialog('chrome://conceptualizercontextual/content/options.xul','','chrome,toolbar');
      },true);
      EverywhereLogger.log('Initialized Conceptualizer Everywhere Extension');
    },

    teardown: function() {
      EverywhereLogger.log('Tearing Down Conceptualizer Everywhere Extension');
      prefs_service_.removeObserver("",this);
    },

    handle_options_event: function(dom) {
      EverywhereLogger.log('!!Got ConceptualizerOptionsEvent!!');

      var elem = dom.createElement('enabled_apps');
      EverywhereLogger.log("elem : " + elem);
      dom.documentElement.appendChild(elem);

      var enabled_apps = ExtensionStorage.read('enabled_apps');

      if (!enabled_apps) {
        enabled_apps = "{}";
      }

      elem.setAttribute('enabled_apps', enabled_apps);

      var ev = dom.createEvent("Events");
      ev.initEvent("ConceptualizerOptionsEventCallback", true, false);
      elem.dispatchEvent(ev);
    },

    enabledAppsHash: function() {
      var enabled_apps = ExtensionStorage.read('enabled_apps');
      if(enabled_apps) {
        enabled_apps = JSON.parse(enabled_apps);
      } else {
        enabled_apps = {};
      }

      return enabled_apps;
    },

    toggleApp: function(event) {
      var elem = event.target;
      var key = elem.getAttribute('toggleApp');
      var value = elem.getAttribute('toggleAppValue');

      var enabled_apps = ConceptualizerEverywhereExtension.enabledAppsHash();
      if (enabled_apps.hasOwnProperty(key)) {
        EverywhereLogger.log('Disabling ' + key);
        delete enabled_apps[key];
      } else {
        EverywhereLogger.log('Enabling ' + key);
        enabled_apps[key] = value;
        EverywhereLogger.log(enabled_apps);
      }
      ExtensionStorage.write('enabled_apps', JSON.stringify(enabled_apps));
    },

    handle_concept_event: function(event) {
      var elem = event.target;
      var tags = elem.getAttribute('tags');
      var url = elem.getAttribute('url');
      var title = elem.getAttribute('title');
      var sver = elem.getAttribute('sver');

      EverywhereLogger.log("Got Concept Event for:" + url + " with version " + sver + " from server. And tags are :");
      EverywhereLogger.log(tags);

      var tags_array = tags.split('|');
      var filtered_tags = [];
      for(var i=0; i < tags_array.length; i++) {
        if (EverywhereTagBlacklist.is_in_blacklist(tags_array[i])) {
          EverywhereLogger.log('Filtered out ' + tags_array[i]);
          continue;
        }
        filtered_tags.push(tags_array[i]);
      }

      var dom = elem.parentNode.parentNode;
      var params = { tags: filtered_tags.join('|'), url: url, title: title, sver: sver };

      Contextual.concepts(params, dom, elem);

      EverywhereLogger.log("Calling load remotes.");
/*      Contextual.load_remotes(dom);*/
    },

    saveDeveloperFiles: function(event) {
      EverywhereLogger.log('Got ConceptualizerDeveloperEvent');

      var elem = event.target;
      var developer = elem.getAttribute('developer');
      ExtensionStorage.write('developer', developer);
    },

    rememberShown: function(event) {
      EverywhereLogger.log("rememberShown called");

      var elem = event.target;
      var key = elem.getAttribute('key');
      var value = elem.getAttribute('value');
      ExtensionStorage.write_remembered(key, [value, new Date()]);
      EverywhereLogger.log("rememberShown finished");
    },

    checkShown: function(event) {
      EverywhereLogger.log("checkShown called");
      var elem = event.target;
      var key = elem.getAttribute('key');

      var remembered = ExtensionStorage.read_remembered(key);
      var value = [];

      if(remembered) {
        for(var i=0; i < remembered.length; i++) {
          value.push(JSON.parse(remembered[i][0]));
        }
      }

      EverywhereLogger.log('Got checkShownCallback in injecter, value = ' + value);

      elem.setAttribute('value', JSON.stringify(value));
      var ev = document.createEvent("Events");
      ev.initEvent("checkShownResponseFromInjecter", true, false);
      elem.dispatchEvent(ev);
      EverywhereLogger.log("checkShown finished");
    },

    runExtension: function(win, dom) {
      EverywhereLogger.log('Running Extension on ' + dom.location.href);

      var meta = dom.getElementById('CONCEPTUALIZER_contextual_js');
      if (meta) {
        EverywhereLogger.log('Already ran extension on ' + dom.location.href);
        return;
      }

      var url = win.location.href;
      var host = win.location.host;


      var pbs = Components.classes["@mozilla.org/privatebrowsing;1"]
                            .getService(Components.interfaces.nsIPrivateBrowsingService);
      var inPrivateBrowsingMode = pbs.privateBrowsingEnabled;

      if (!inPrivateBrowsingMode && url.match(/^http:/i)) {

        if (EverywhereBlacklist.matchesBlacklist(host)) {
          EverywhereLogger.log(host + " matches blacklist. Aborting");
          return;
        }

        dom.addEventListener("ConceptualizerEverywhereConceptEvent",ConceptualizerEverywhereExtension.handle_concept_event, false, true);
        dom.addEventListener("ConceptualizerToggleEvent",ConceptualizerEverywhereExtension.toggleApp, false, true);
        dom.addEventListener("ConceptualizerDeveloperEvent",ConceptualizerEverywhereExtension.saveDeveloperFiles, false, true);
        dom.addEventListener("ConceptualizerRememberShownElement",ConceptualizerEverywhereExtension.rememberShown, false, true);
        dom.addEventListener("ConceptualizerCheckShownElement",ConceptualizerEverywhereExtension.checkShown, false, true);
        ConceptualizerEverywhereExtension.handle_options_event(dom);

        var contextual_root = prefs_service_.getCharPref("extensions.conceptualizercontextual.url");

        var contextual_css_url = contextual_root + "/contextual.css";
        var contextual_js_url = contextual_root + "/contextual.js";
        var dom_head = dom.getElementsByTagName('head')[0];

        var dom_js = dom.createElement("script");
        dom_js.id = 'CONCEPTUALIZER_contextual_js';
        dom_js.type = "text/javascript";
        dom_js.src = contextual_js_url;
        dom_head.appendChild(dom_js);

        var dom_css = dom.createElement('link');
        dom_css.id = 'CONCEPTUALIZER_contextual_css';
        dom_css.rel = "stylesheet";
        dom_css.type= "text/css";
        dom_css.href = contextual_css_url;
        dom_css.media = 'screen';
        dom_head.appendChild(dom_css);
      }
    },

    observe: function(subject,topic,data) {
      if (topic != "nsPref:changed")
        return;
      if (data == "extensions.conceptualizercontextual.blacklist") {
        EverywhereBlacklist.getBlacklist();
      }
    },

    enableSapp: function() {
      // only if the extension was downloaded from sapp.com
      var url_regex = /sapp\.com/i;
      EverywhereLogger.log("enableSapp called");

      if(ConceptualizerEverywhereExtension.isUrlOpen(url_regex)) {
        EverywhereLogger.log("enableSapp : sapp is open , lets enable this app.");

        var enabled_apps = ConceptualizerEverywhereExtension.enabledAppsHash();
        var key = 'sapp';
        var value = JSON.stringify({
          "key": "sapp",
          "name" : "Service App's Name Here",
          "desc": "",
          "js" : "/apps/sapp.js",
          "icon" : "/emblems/sapp.png",
          "resolver": "client",
          "whitelist" : [
            "http://example.com/*"
          ]
        });

        if (!enabled_apps.hasOwnProperty(key)) {
          EverywhereLogger.log("enableSapp :ok the key is missing, lets write it to the local storage.");

          EverywhereLogger.log('Enabling ' + key);
          enabled_apps[key] = value;
          EverywhereLogger.log(enabled_apps);
          ExtensionStorage.write('enabled_apps', JSON.stringify(enabled_apps));
        }

      }
    },

    isUrlOpen: function(url_regex) {
      EverywhereLogger.log("isUrlOpen called");

      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                         .getService(Components.interfaces.nsIWindowMediator);
      var browserEnumerator = wm.getEnumerator("navigator:browser");

      EverywhereLogger.log("isUrlOpen : wm variable set");

      // Check each browser instance for our URL
      var found = false;
      while (!found && browserEnumerator.hasMoreElements()) {
        var browserWin = browserEnumerator.getNext();
        var tabbrowser = browserWin.gBrowser;

        EverywhereLogger.log("isUrlOpen : tabbrowser variable set");

        // Check each tab of this browser instance
        var numTabs = tabbrowser.browsers.length;
        EverywhereLogger.log("isUrlOpen : numTabs = " + numTabs);

        for (var index = 0; index < numTabs; index++) {
          var currentBrowser = tabbrowser.browsers[index];
          EverywhereLogger.log(currentBrowser.currentURI.spec);
          if (currentBrowser.currentURI.spec.search(url_regex) != -1) {
            found = true;
            break;
          }
        }
      }

      return found;
    }

  }
}();

EverywhereLogger.log('Loading Everywhere Extension');
window.addEventListener("load", function() { ConceptualizerEverywhereExtension.init(); }, false);
window.addEventListener("unload", function() { ConceptualizerEverywhereExtension.teardown(); }, false);
