var EverywhereLogger = function() {
  var BENCH = [];

  return {
    log: function(args) {
      if (typeof(console) != 'undefined') {
        console.log('--INJ');
        console.log(args);
      }
    },

    bench_start: function(name) {
      BENCH[name] = new Date();
    },

    bench_finish: function(name) {
      var end = new Date();
      this.log(name + "::" + (end - BENCH[name]) + " ms");
    }
  };
}();

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
      console.log('Doing Http Request for ' + url);

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
          console.log(req);
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
      console.log('Attention !!! - Calling Render');
      console.log(emblems);

      chrome.tabs.sendRequest(tab.id, {action:"render",emblems: emblems}, function(response) {
      });
    },

    files: function() {
      developer = localStorage['developer'];
      var files = [];
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
        console.log('Disabling ' + key);
        delete enabled_apps[key];
      } else {
        console.log('Enabling ' + key);
        enabled_apps[key] = value;
        console.log(enabled_apps);
      }
      localStorage['enabled_apps'] = JSON.stringify(enabled_apps);
    },

    /* Constructor function to setup all the events and global data */
    initialize: function() {
      this.contextual_root = localStorage['contextual_root'];
      if (!this.contextual_root) {
        this.contextual_root = 'http://dev002.sj.conceptualizer.com:1984';
      }

      /* Check if sapp needs to be enabled if loaded for first time */
      if(!localStorage.hasOwnProperty('loaded_before')) {
        ConceptualizerHarness.enableSapp();
      }

			safari.application.addEventListener('message', function(msgEvent) {
				var msgName = msgEvent.name;
				var request = msgEvent.message;
				console.log(msgEvent);

        if (msgName == "concepts") {
          console.log('Received Request for Concepts');
          console.log(request);

          ConceptualizerHarness.mappings(msgEvent.message, function(result) {
            console.log(result);

            var payload_container = JSON.parse(result);
            if (ConceptualizerHarness.onResolve) {
							console.log("payload container's ");
              ConceptualizerHarness.onResolve(sender.tab, payload_container.payload);
            }
						msgEvent.target.page.dispatchMessage("conceptsCallback", payload_container.payload);
				  });

        } else if (msgName == 'preferences') {
          console.log('Extension Received Preferences');
          console.log(ConceptualizerHarness.contextual_root);
					msgEvent.target.page.dispatchMessage("preferencesCallback", ConceptualizerHarness.contextual_root);

        } else if (msgName == 'options') {
          console.log('Extension Received options request from injecter');
          var enabled_apps = localStorage.hasOwnProperty('enabled_apps') ? JSON.parse(localStorage['enabled_apps']) : {};
          console.log('Enabled apps are' + enabled_apps);

          msgEvent.target.page.dispatchMessage("optionsCallback", enabled_apps);

        } else if (msgName == 'developer') {
          console.log('Extension Received developer event from injecter');

          if (localStorage.hasOwnProperty('developer')) {
            localStorage['developer_last'] = localStorage['developer'];
          }
          console.log("the localStorage['developer'] in extension : " + request.developer);
          localStorage['developer'] = request.developer;

        } else if (msgName == 'remember') {
          console.log('Extension Received remember event from injecter');

          if (!localStorage.hasOwnProperty('remember')) {
            localStorage['remember'] = JSON.stringify({});
          }

          console.log("the localStorage['remember'] in extension : " + localStorage['remember']);
          var remembered = JSON.parse(localStorage['remember']);
          if (!remembered[request.key]) {
            remembered[request.key] = [];
          }

          remembered[request.key].push([request.value, new Date()]);

          localStorage['remember'] = JSON.stringify(remembered);
          console.log("the updated localStorage['remember'] in extension : " + localStorage['remember']);

        } else if (msgName == 'checkShown') {
          console.log('Extension Received checkShown event from injecter');

          if (localStorage.hasOwnProperty('remember')) {
            console.log("the localStorage['remember'] in extension : " + localStorage['remember']);
            var remembered = JSON.parse(localStorage['remember']);
            var value = [];

            if(remembered[request.key]) {
              for(var i=0; i < remembered[request.key].length; i++) {
                value.push(JSON.parse(remembered[request.key][i][0]));
              }
            }

            msgEvent.target.page.dispatchMessage("checkShownCallback", { 'value' : value});
          }
        } else if (msgName == 'toggleApp') {
          console.log('Extension Received toggle request from injecter');
          ConceptualizerHarness.toggleApp(request.key, request.value);

        } else if (msgName == 'http') {
          	console.log('Extension Received Http Request');
          	console.log(request);

						ConceptualizerHarness.http_request(request.request,function(response) {
            console.log('Received Http Result in Extension');
            console.log(response);
						msgEvent.target.page.dispatchMessage("httpCallback", response);
          });
        } else if (msgName == 'remotes') {
          var remotes = [];
          var remotes_json = localStorage['enabled_apps'];

          //'{"kiva":{"key":"kiva","name":"Kiva","desc":"Kiva\'s Contextual App let\'s you see recent calls for investment in the countries you are reading about","js":"/apps/kiva.js","icon":"/emblems/kiva.png","resolver":"client","whitelist":["http://api.kivaws.org/*"]}}';


          if (remotes_json) {
            var parsed_remotes = JSON.parse(remotes_json);

            for(var key in parsed_remotes) {
              parsed_remotes[key] = JSON.parse(parsed_remotes[key]);
              var remote = parsed_remotes[key];

              if (!remote.js.match(/^http:\/\//)) {
                remote.js = ConceptualizerHarness.contextual_root + remote.js;
              }
            }
						msgEvent.target.page.dispatchMessage("remotesCallback", parsed_remotes);
          }
        } else if (msgName == 'preferences') {
          EverywhereLogger.log('EXT: Received Request for Preferences');
					msgEvent.target.page.dispatchMessage("preferencesCallback", parsed_remotes);
        } else if (msgName == 'locals') {
          console.log('Ext: Received request for locals');
          var enabledFiles = ConceptualizerHarness.enabledFiles();

          if (enabledFiles.length > 0) {
            console.log('Sending back files');
            console.log(enabledFiles);
						msgEvent.target.page.dispatchMessage("localsCallback", enabledFiles);
          } else {
					   console.log('no enabled developer files , msgName : ' + msgName);
             // sendResponse({error: 'no enabled developer files'});
          }
        }
			});
    },

    enableSapp: function() {
      // only if the extension was downloaded from sapp.com
      EverywhereLogger.log("enableSapp called");

      if(ConceptualizerHarness.isUrlOpen()) {
        EverywhereLogger.log("enableSapp : sapp is open , lets enable this app.");

        var enabled_apps = localStorage.hasOwnProperty('enabled_apps') ? JSON.parse(localStorage['enabled_apps']) : {};
        var key = 'sapp';
        var value = JSON.stringify({
          "key": "sapp",
          "name" : "Service App's Name",
          "desc": "",
          "js" : "/apps/sapp.js",
          "icon" : "/emblems/sapp.png",
          "resolver": "client",
          "whitelist" : [
          // any servers allowed to be contacted should be listed here
          ]
        });

        if (!enabled_apps.hasOwnProperty(key)) {
          EverywhereLogger.log("enableSapp :ok the key is missing, lets write it to the local storage.");

          EverywhereLogger.log('Enabling ' + key);
          enabled_apps[key] = value;
          EverywhereLogger.log(enabled_apps);
          localStorage['enabled_apps'] = JSON.stringify(enabled_apps);
        }

      };

      localStorage['loaded_before'] = true;

    },

    isUrlOpen: function() {
      EverywhereLogger.log("enableIfUrlOpen called");

      var found = false;
      var url_regex = /sapp\.com/i;
      var browserWindows = safari.application.browserWindows;

      var i = 0
      for(i=0; i < browserWindows.length && !found; i++) {
        var browserWindow = browserWindows[i];

        var tabs = browserWindow.tabs;
        var numTabs = tabs.length;
        EverywhereLogger.log("isUrlOpen : numTabs = " + numTabs);

        for (var index = 0; index < numTabs; index++) {
          var tab = tabs[index];
          EverywhereLogger.log(tab.url);
          if (tab.url.search(url_regex) != -1) {
            found = true;
            break;
          }
        }
      }

      return found;
    }

  }
}();

console.log("first hand connect : initializing");
ConceptualizerHarness.initialize();
