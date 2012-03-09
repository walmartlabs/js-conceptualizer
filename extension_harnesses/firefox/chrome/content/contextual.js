var Contextual = function() {
  return {
    concepts: function(request, dom, eventElem) {
      EverywhereLogger.log('Received Request for Concepts');
      EverywhereLogger.log(request);

      ConceptualizerHarness.mappings(request, function(result) {
        EverywhereLogger.log(result);

        var payload_container = JSON.parse(result);
        if (ConceptualizerHarness.onResolve) {
					EverywhereLogger.log("payload container's ");
          ConceptualizerHarness.onResolve(null, payload_container.payload);
        }

        EverywhereLogger.log("payload container:");
        EverywhereLogger.log(payload_container);

        EverywhereLogger.log("payload:");
        EverywhereLogger.log(payload_container.payload);

        eventElem.setAttribute('concepts', JSON.stringify(payload_container.payload));

        var ev = dom.createEvent("Events");
        ev.initEvent("ConceptualizerEverywhereRenderEvent", true, false);
        eventElem.dispatchEvent(ev);
        EverywhereLogger.log("sent the ConceptualizerEverywhereRenderEvent");
        Contextual.load_remotes(dom);
        Contextual.load_locals(dom);
		  });
    },

    load_remotes: function(dom) {
      var remotes = [];
      var remotes_json = ExtensionStorage.read('enabled_apps');

      var contextual_root = ExtensionStorage.read('contextual_root');
      if (!contextual_root) {
        contextual_root = 'http://dev002.sj.conceptualizer.com:1984';
      }

      //'{"conceptualizer" :{"key": "conceptualizer","name" : "Conceptualizer","desc": "Show data about everything in the API","js" : "/apps/conceptualizer.js","icon" : "/emblems/conceptualizer.png","resolver": "client","whitelist" : ["http://api.crunchbase.com/v/1/*"]}}';
      /* var remotes_json = '{"kiva":{"key":"kiva","name":"Kiva","desc":"Kiva\'s Contextual App let\'s you see recent calls for investment in the countries you are reading about","js":"/apps/kiva.js","icon":"/emblems/kiva.png","resolver":"client","whitelist":["http://api.kivaws.org/*"]}}';*/

      EverywhereLogger.log("loading remote scripts.");
      EverywhereLogger.log(remotes_json);

      if (remotes_json) {
        var parsed_remotes = JSON.parse(remotes_json);

        var dom_head = dom.getElementsByTagName('head')[0];

        EverywhereLogger.log("parsed remotes");
        EverywhereLogger.log(parsed_remotes);

        for(var key in parsed_remotes) {
          var remote = JSON.parse(parsed_remotes[key]);

          if (!remote.js.match(/^http:\/\//)) {
            remote.js = contextual_root + remote.js;
          }

          var dom_js = dom.createElement("script");
          dom_js.id = 'CONCEPTUALIZER_' + remote.key + "js";
          dom_js.type = "text/javascript";
          dom_js.src = remote.js;
          dom_head.appendChild(dom_js);
        }
      }
    },

    load_locals: function(dom) {
      var locals = Contextual.enabledFiles();

      EverywhereLogger.log("locals got from the extension : ");
      EverywhereLogger.log(locals);

      var dom_head = dom.getElementsByTagName('head')[0];

      for(var i=0; i < locals.length; i++) {
        var local = locals[i];
        var dom_js = dom.createElement("script");
        dom_js.id = 'CONCEPTUALIZER_local_' + i + "js";
        dom_js.type = "text/javascript";
        dom_js.innerHTML = local.content;
        dom_head.appendChild(dom_js);
      }
    },

    files: function() {
      developer = ExtensionStorage.read('developer');
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
      var files = Contextual.files();
      var enabledFiles = [];
      for(var i=0; i < files.length; i++) {
        if (files[i].enabled) {
          enabledFiles.push(files[i]);
        }
      }
      return enabledFiles;
    }
  }
}();
