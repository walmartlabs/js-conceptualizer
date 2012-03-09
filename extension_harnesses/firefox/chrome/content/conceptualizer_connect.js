var ConceptualizerHarness = function() {
  return {
    /*
     * Use register to specify the key of your extension and the value
     */
    register: function(key,url) {
      var remotes = [];
    },

    onResolve: null,

    http_request: function(request, callback) {
      var url = request.url;
      // Do Whitelist Check here
      EverywhereLogger.log('Doing Http Request for ' + url);

      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          var res = new Object();
          res.status = req.status;
          res.body = req.responseText;
          callback(res);
        }
      }

      if (request.req_type.toLowerCase() == 'post') {
        req.open("POST", url, true);
        req.send(params);
      } else {
        req.open("GET", url, true);
        req.send(null);
      }
    },

    mappings: function(request, callback) {
      var identify_url = this.contextual_root + '/identify';
      var req = new XMLHttpRequest();
      var params = "text=" + encodeURIComponent(request.tags) +
        "&url=" + encodeURIComponent(request.url) +
        "&cver=" + 'kiva_chrome' +
        "&sver=" + encodeURIComponent(request.sver);
      req.open("POST", identify_url, true);
      req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
          EverywhereLogger.log(req);
          callback(req.responseText);
        } else {
        }
      }
      req.send(params);
    },

    /*
     * When this is called it sends down data to the injected script to render into the page
     * emblems is an array of objects where each object can specify
     * -- match  (usually how the match appeared on the page, textual representation)
     * -- concept (the name of the canonical concept, sometimes useful for queries)
     * -- icon (a url or chrome url to the icon img (16x16 png is the best))
     * -- click (a callback for a click event on the hover)
     * -- hover (a callback to call on the page)
     */
    render: function(tab, emblems) {
      EverywhereLogger.log('Attention !!! - Calling Render');
      EverywhereLogger.log(emblems);

      chrome.tabs.sendRequest(tab.id, {action:"render",emblems: emblems}, function(response) {
      });
    },

    files: function() {
      developer = localStorage['developer'];
      var files = []
      if (developer) {
        developer = JSON.parse(developer);
        if (developer.files) {
          for (var filename in developer.files) {
            files.push(developer.files[filename]);
          }
        }
      }
      return files;
    },

    enabledFiles: function() {
      var files = ConceptualizerHarness.files();
      var enabledFiles = [];
      for(var i=0; i < files.length; i++) {
        if (files[i].enabled) {
          enabledFiles.push(files[i]);
        }
      }
      return enabledFiles;
    },

    enabledAppsHash: function() {
      var enabled_apps = localStorage.hasOwnProperty('enabled_apps') ? JSON.parse(localStorage['enabled_apps']) : {};
      return enabled_apps;
    },

    toggleApp: function(key, value) {
      var enabled_apps = ConceptualizerHarness.enabledAppsHash();
      if (enabled_apps.hasOwnProperty(key)) {
        EverywhereLogger.log('Disabling ' + key);
        delete enabled_apps[key];
      } else {
        EverywhereLogger.log('Enabling ' + key);
        enabled_apps[key] = value;
        EverywhereLogger.log(enabled_apps);
      }
      localStorage['enabled_apps'] = JSON.stringify(enabled_apps);
    },

    /* Constructor function to setup all the events and global data */
    initialize: function() {
      if (!this.contextual_root) {
        this.contextual_root = 'http://dev002.sj.conceptualizer.com:1984';
      }
    }
  }
}();
