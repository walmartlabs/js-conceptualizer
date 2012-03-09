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

/* If we are running at the Extension Level, this will be defined, otherwise we are inside the page */
var is_injected = false;
try {
  var es = chrome.tabs.executeScript;
} catch (ex) {
  is_injected = true;
}
if (!is_injected) {
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

      mappings: function(request,callback) {
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
      render: function(tab,emblems) {
        console.log('Calling Render');
        console.log(emblems);
        chrome.tabs.sendRequest(tab.id,{action:"render",emblems: emblems}, function(response) {
        });
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
          this.contextual_root = 'http://contextual.conceptualizer.com';
        }

        /* Check if sapp needs to be enabled if loaded for first time */
        if(!localStorage.hasOwnProperty('loaded_before')) {
          ConceptualizerHarness.enableSapp();
        }


        chrome.extension.onRequest.addListener(
          function(request, sender, sendResponse) {
            if (request.action == "concepts") {
              console.log('Received Request for Concepts');
              console.log(request);
              ConceptualizerHarness.mappings(request,function(result) {
                console.log(sender);
                console.log(result);
                var payload_container= JSON.parse(result);
                if (ConceptualizerHarness.onResolve) {
                  ConceptualizerHarness.onResolve(sender.tab,payload_container.payload);
                }
                sendResponse({result: payload_container.payload});
              });
            } else if (request.action == 'preferences') {
              console.log('Extension Received Preferences');
              console.log(ConceptualizerHarness.contextual_root);
              sendResponse({contextual_root: ConceptualizerHarness.contextual_root});
            } else if (request.action == 'http') {
              console.log('Extension Received Http Request');
              console.log(request);
              ConceptualizerHarness.http_request(request.request,function(response) {
                console.log('Received Http Result in Extension');
                console.log(response);
                sendResponse({response:response});
              });
            } else if (request.action == 'remotes') {
              var remotes = [];
              var remotes_json = localStorage['enabled_apps'];
              if (remotes_json) {
                var parsed_remotes = JSON.parse(remotes_json);
                for(var key in parsed_remotes) {
                  var remote = parsed_remotes[key];
                  if (!remote.js.match(/^http:\/\//)) {
                    remote.js = ConceptualizerHarness.contextual_root + remote.js;
                  }
                }
                sendResponse({remotes: parsed_remotes});
              }
            } else if (request.action == 'preferences') {
              EverywhereLogger.log('EXT: Received Request for Preferences');
              sendResponse(EverywherePreferences.preferences());
            } else if (request.action == 'locals') {
              console.log('Ext: Received request for locals');
              var enabledFiles = ConceptualizerDeveloper.enabledFiles();
              if (enabledFiles.length > 0) {
                console.log('Sending back files');
                console.log(enabledFiles);
                sendResponse({files: enabledFiles});
              } else {
                sendResponse({error: 'no enabled developer files'});
              }
            } else if (request.action == 'remember') {
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

              } else if (request.action == 'checkShown') {
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

                  sendResponse({ value: value});
                }
              } else if(request.action == 'toggleApp') {
                console.log('Extension Received toggle request from injecter');
                ConceptualizerHarness.toggleApp(request.key, request.value);
              } else if(request.action == 'developer') {
                console.log('Extension Received developer event from injecter');
                if (localStorage.hasOwnProperty('developer')) {
                  localStorage['developer_last'] = localStorage['developer'];
                }
                console.log("the localStorage['developer'] in extension : " + request.developer);
                localStorage['developer'] = request.developer;
              } else if(request.action == 'options') {
                console.log('Extension Received options request from injecter');
                var enabled_apps = localStorage.hasOwnProperty('enabled_apps') ? JSON.parse(localStorage['enabled_apps']) : {};
                console.log('Enabled apps are' + enabled_apps);

                sendResponse(enabled_apps);
              }
            });

        /*
         * Here we detect that the conceptualizer.js injection has completed, so then we do a remoteLoad
         * to grab the contextual.js from the server.
         */
        chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab) {
          if (changeInfo.status == 'complete') {
            try {
              chrome.tabs.executeScript(tab.id,{file:"conceptualizer.js"}, function() {
                console.log('Done Executing ConceptualizerHarness.js Injection');
                chrome.tabs.sendRequest(tab.id,{action:"remoteLoad"}, function(response) {
                });
              });
            } catch (ex) {
            }
          }
        });
      },

      enableSapp: function() {
        // only if the extension was downloaded from sapp.com
        EverywhereLogger.log("enableSapp called");

        var callback = function() {
          EverywhereLogger.log("enableSapp : sapp is open , lets enable this app.");

          var enabled_apps = localStorage.hasOwnProperty('enabled_apps') ? JSON.parse(localStorage['enabled_apps']) : {};
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
            localStorage['enabled_apps'] = JSON.stringify(enabled_apps);
          }

        };

        ConceptualizerHarness.enableIfUrlOpen(callback);
      },

      enableIfUrlOpen: function(callback) {
        EverywhereLogger.log("enableIfUrlOpen called");

        chrome.tabs.getAllInWindow(null, function(tabs) {
          var found = false;
          var url_regex = /sapp\.com/i;
          var i=0;
          EverywhereLogger.log(tabs.length);

          for(i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            EverywhereLogger.log(tab.url);

            if(tab.url && tab.url.search(url_regex) != -1) {
              found = true;
              break;
            }
          }

          if(found) {
            callback();
          }
          localStorage['loaded_before'] = true;
        });
      }

    }
  }();
  ConceptualizerHarness.initialize();
} else {



/*************************************
 * Starting Injected Script
 *************************************/


  console.log("Got injected into " + window.location.href);
  if (window.top === window) {
    var ConceptualizerHarnessInterceptor = function() {

      this.contextual_root = localStorage['contextual_root'];
      if (!this.contextual_root) {
        this.contextual_root = 'http://contextual.conceptualizer.com';
      }

      document.addEventListener("ConceptualizerEverywhereConceptEvent",function(event) {
        EverywhereLogger.log('Finished Client Side Doctagging');
        var elem = event.target;
        var tags = elem.getAttribute('tags');
        var url = elem.getAttribute('url');
        var title = elem.getAttribute('title');
        var sver = elem.getAttribute('sver');
        var existing_concepts = elem.getAttribute('concepts');


        chrome.extension.sendRequest({action: "concepts", tags: tags, url: url, title: title, sver: sver, concepts: existing_concepts},function(result) {
          elem.setAttribute('concepts',JSON.stringify(result.result));

          console.log('Got Concepts, now let"s render the containers before loading in the apps');
          EverywhereLogger.log('tags:' + tags);
          EverywhereLogger.log('Sending Concept Event to Extension Layer');
          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerEverywhereRenderEvent", true, false);
          elem.dispatchEvent(ev);

          // Here we want to now load in any remote scripts
          chrome.extension.sendRequest({action: "remotes"}, function(result) {
            console.log('Got Remotes');
            console.log(result.remotes);
            var remotes = result.remotes;
            var dom_head = document.getElementsByTagName('head')[0];
            for(var key in remotes) {
              var remote = remotes[key];
              var dom_js = document.createElement("script");
              dom_js.id = 'CONCEPTUALIZER_' + remote.key + "js";
              dom_js.type = "text/javascript";
              dom_js.src = remote.js;
              dom_head.appendChild(dom_js);
            }
          });

          // Now we will load in any local scripts that the user has been developing
          chrome.extension.sendRequest({action: "locals"}, function(result) {
            console.log('Got Locals');
            if (result.files) {
              var locals = result.files;
              var dom_head = document.getElementsByTagName('head')[0];
              for(var i=0; i < locals.length; i++) {
                var local = locals[i];
                var dom_js = document.createElement("script");
                dom_js.id = 'CONCEPTUALIZER_local_' + i + "js";
                dom_js.type = "text/javascript";
                dom_js.innerHTML = local.content;
                dom_head.appendChild(dom_js);
              }
            }
            console.log('Done with Locals');
          });
        });

        EverywhereLogger.log('Sent Event to Chrome');
      },false,true);

      document.addEventListener("ConceptualizerRememberShownElement", function(event) {
        EverywhereLogger.log('Got ConceptualizerRememberShownElement');

        var elem = event.target;
        var key = elem.getAttribute('key');
        var value = elem.getAttribute('value');
        chrome.extension.sendRequest({'action' : "remember", 'key' : key, 'value' : value});
      });

      document.addEventListener("ConceptualizerCheckShownElement", function(event) {
        EverywhereLogger.log('Got ConceptualizerCheckShownElement');

        var elem = event.target;
        var key = elem.getAttribute('key');

        chrome.extension.sendRequest({action: "checkShown", key: key}, function(result) {
          console.log('Got checkShownCallback in injecter, value is:' + result.value);
          console.log(result.value);

          var value = result.value;

          elem.setAttribute('value', JSON.stringify(value));
          var ev = document.createEvent("Events");
          ev.initEvent("checkShownResponseFromInjecter", true, false);
          elem.dispatchEvent(ev);
        });

      });

      document.addEventListener("ConceptualizerToggleEvent", function(event) {
        EverywhereLogger.log('Got ConceptualizerToggleEvent');

        var elem = event.target;
        var key = elem.getAttribute('toggleApp');
        var value = elem.getAttribute('toggleAppValue');

        chrome.extension.sendRequest({action: "toggleApp", key: key, value: value});
      });

      document.addEventListener("ConceptualizerDeveloperEvent", function(event) {
        EverywhereLogger.log('Got ConceptualizerDeveloperEvent');

        var elem = event.target;
        var developer = elem.getAttribute('developer');

        chrome.extension.sendRequest({action: "developer", developer: developer});
      });

      document.addEventListener("ConceptualizerOptionsEvent", function(event) {
        EverywhereLogger.log('Got ConceptualizerOptionsEvent');

        var elem = event.target;

        chrome.extension.sendRequest({action: "options"}, function(enabled_apps){
          console.log('Got optionsCallback in injecter, enabled_apps = ' + enabled_apps);
          elem.setAttribute('enabled_apps',JSON.stringify(enabled_apps));

          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerOptionsEventCallback", true, false);
          elem.dispatchEvent(ev);
        });
      });

      // Here we add the listener for cross site request calls
      document.addEventListener("ConceptualizerHarnessHttpRequest", function(event) {
        console.log('Heard conceptualizer request');
        var elem = event.target;
        var req = new Object();
        req.url = elem.getAttribute('url');
        req.req_type = elem.getAttribute('type');
        req.params = JSON.parse(elem.getAttribute('params'));
        chrome.extension.sendRequest({action: "http", request: req}, function(response) {
          console.log('Got Cross Site Result');
          elem.setAttribute('result',JSON.stringify(response.response));
          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerHarnessHttpResponse", true, false);
          elem.dispatchEvent(ev);
        });
      });

      var elem = document.createElement('enabled_apps');
      console.log("elem : " + elem);
      document.documentElement.appendChild(elem);

      var ev = document.createEvent("Events");
      ev.initEvent("ConceptualizerOptionsEvent", true, false);
      elem.dispatchEvent(ev);

      var findAlreadyComputedTags = function() {
        var tagElems = document.getElementsByTagName('conceptualizereverywhereconceptevent');
        if (tagElems.length > 0) {
          var elem = tagElems[0];
          var tags = elem.getAttribute('tags');
          var url = elem.getAttribute('url');
          var title = elem.getAttribute('title');
          var sver = elem.getAttribute('sver');
          var existing_concepts = elem.getAttribute('concepts');

          EverywhereLogger.log('tags:' + tags);
          EverywhereLogger.log('Sending Already Found Concept Event to Extension Layer');

          chrome.extension.sendRequest({action: "concepts", tags: tags, url: url, title: title, sver: sver, concepts: existing_concepts});
        }
      }

      var saveConcepts = function(messageData) {
         var tagElems = document.getElementsByTagName('conceptualizereverywhereconceptevent');
         if (tagElems.length > 0) {
           var elem = tagElems[0];
           elem.setAttribute('concepts', JSON.stringify(messageData.matches))
         }
      }

      var remoteLoad = function() {
        if (document.location.href.match(/^http:/i)) {
          var contextual_css_url = ConceptualizerHarnessInterceptor.contextual_root + "/contextual.css";
          var contextual_js_url = ConceptualizerHarnessInterceptor.contextual_root + "/contextual.js";

          if (document.getElementById('CONCEPTUALIZER_contextual_js')) {
            findAlreadyComputedTags();
            EverywhereLogger.log("Already inserted this js, so don't need to do it again");
            return;
          }

          var dom_head = document.getElementsByTagName('head')[0];

          /*
              var meta = document.createElement('script');
              meta.type = 'text/javascript';
              var prefs = {};
              prefs.oot_enabled = response.oot_enabled;
              meta.innerHTML = "var ConceptualizerEverywherePreferences = " + JSON.stringify(response);
              dom_head.appendChild(meta);
              */

          var dom_js = document.createElement("script");
          dom_js.id = 'CONCEPTUALIZER_contextual_js';
          dom_js.type = "text/javascript";
          dom_js.src = contextual_js_url;
          dom_head.appendChild(dom_js);

          var dom_css = document.createElement('link');
          dom_css.id = 'CONCEPTUALIZER_contextual_css';
          dom_css.rel = "stylesheet";
          dom_css.type= "text/css";
          dom_css.href = contextual_css_url;
          dom_css.media = 'screen';
          dom_head.appendChild(dom_css);
        }
      };

      var dispatchRenderEventToDOM = function(emblems) {
        console.log('INJ: Calling dispatch Render Event');
        var eventElem = document.createElement("ConceptualizerEverywhereRenderEventElem");
        eventElem.setAttribute('emblems', JSON.stringify(emblems));
        document.documentElement.appendChild(eventElem);

        var ev = document.createEvent("Events");
        ev.initEvent("ConceptualizerEverywhereRenderEvent",true,false);
        eventElem.dispatchEvent(ev);
        console.log('INJ: Completed Dispatch');
      };

      chrome.extension.onRequest.addListener(function(request,sender,sendResponse) {
        EverywhereLogger.log('Received Event in Injected Script');
        if (request.action == 'remoteLoad') {
          chrome.extension.sendRequest({action: "preferences"}, function(response) {
            console.log('Got Preferences');
            console.log(response);
            ConceptualizerHarnessInterceptor.contextual_root = response.contextual_root;
            remoteLoad();
          });
        } else if (request.action == 'render') {
          var emblems = request.emblems;
          dispatchRenderEventToDOM(emblems);
        }
      });

      return {
        contextual_root: null
      }
    }();
  }
}
