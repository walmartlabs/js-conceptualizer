console.log("script is being injected");

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

console.log("Got injected into " + window.location.href);

if (window.top === window) {
  var ConceptualizerHarnessInterceptor = function() {
  
    this.contextual_root = localStorage['contextual_root'];
    if (!this.contextual_root) {
      this.contextual_root = 'http://dev002.sj.conceptualizer.com:1984';
    }
  
    var remoteLoad = function() {
      if (document.location.href.match(/^http:/i)) {
  
        var contextual_css_url = contextual_root + "/contextual.css";
        var contextual_js_url = contextual_root + "/contextual.js";

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
    
    // first get the preferences then call remoteload 
    // remoteLoad();
    document.addEventListener("ConceptualizerOptionsEvent", function(event) {
      EverywhereLogger.log('Got ConceptualizerOptionsEvent');
      
      var elem = event.target;
      safari.self.addEventListener("message", function(msgEvent) {
        var messageName = msgEvent.name; 
        var messageData = msgEvent.message; 
    
        if (messageName === "optionsCallback") {
          console.log('Got optionsCallback in injecter, messageData = ' + messageData);
          elem.setAttribute('enabled_apps',JSON.stringify(messageData));
          
          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerOptionsEventCallback", true, false);
          elem.dispatchEvent(ev);
        
          safari.self.removeEventListener('message', arguments.callee, false);
        }
      }, false);
            
      safari.self.tab.dispatchMessage("options");
    });
    
    document.addEventListener("ConceptualizerDeveloperEvent", function(event) {
      EverywhereLogger.log('Got ConceptualizerDeveloperEvent');
      
      var elem = event.target;
      var developer = elem.getAttribute('developer');
      safari.self.tab.dispatchMessage("developer", { 'developer' : developer});
    });

    document.addEventListener("ConceptualizerRememberShownElement", function(event) {
      EverywhereLogger.log('Got ConceptualizerRememberShownElement');
      
      var elem = event.target;
      var key = elem.getAttribute('key');
      var value = elem.getAttribute('value');
      safari.self.tab.dispatchMessage("remember", { 'key' : key, 'value' : value});
    });

    document.addEventListener("ConceptualizerCheckShownElement", function(event) {
      EverywhereLogger.log('Got ConceptualizerCheckShownElement');
      
      var elem = event.target;
      var key = elem.getAttribute('key');
            
      safari.self.addEventListener("message", function(msgEvent) {
        var messageName = msgEvent.name; 
        var messageData = msgEvent.message; 
    
        if (messageName === "checkShownCallback") {
          console.log('Got checkShownCallback in injecter, messageData = ' + messageData);
          
          var value = messageData.value;
          
          elem.setAttribute('value', JSON.stringify(value));
          var ev = document.createEvent("Events");
          ev.initEvent("checkShownResponseFromInjecter", true, false);
          elem.dispatchEvent(ev);
        
          safari.self.removeEventListener('message', arguments.callee, false);
        }
      }, false);
      
      
      safari.self.tab.dispatchMessage("checkShown", { 'key' : key});
    });
    
    document.addEventListener("ConceptualizerToggleEvent", function(event) {
      EverywhereLogger.log('Got ConceptualizerToggleEvent');
      
      var elem = event.target;
      var key = elem.getAttribute('toggleApp');
      var value = elem.getAttribute('toggleAppValue');
      safari.self.tab.dispatchMessage("toggleApp", {'key' : key, 'value' : value});
    });
    

    var elem = document.createElement('enabled_apps');
    console.log("elem : " + elem);
    document.documentElement.appendChild(elem);
    
    var ev = document.createEvent("Events");
    ev.initEvent("ConceptualizerOptionsEvent", true, false);
    elem.dispatchEvent(ev);
    
    document.addEventListener("ConceptualizerEverywhereConceptEvent", function(event) {
      EverywhereLogger.log('Finished Client Side Doctagging');

      var elem              = event.target;
      var tags              = elem.getAttribute('tags');
      var url               = elem.getAttribute('url');
      var title             = elem.getAttribute('title');
      var sver              = elem.getAttribute('sver');
      var existing_concepts = elem.getAttribute('concepts');
      
      console.log("Existing concepts are :" + existing_concepts);
      
      EverywhereLogger.log('tags:' + tags);
      EverywhereLogger.log('Sending Concept Event to Extension Layer');
      
      safari.self.addEventListener("message", function(msgEvent) {
        var messageName = msgEvent.name; 
        var messageData = msgEvent.message; 
    
        if (messageName === "conceptsCallback") {
          console.log("messageData : " + messageData);
          var payload = messageData;
          
          console.log("payload :" + payload);
          
          elem.setAttribute('concepts', JSON.stringify(payload));
          
          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerEverywhereRenderEvent", true, false);
          elem.dispatchEvent(ev);
          
          // Here we want to now load in any remote scripts
          
          safari.self.addEventListener("message", function(msgEvent) {
            var messageName = msgEvent.name; 
            var messageData = msgEvent.message; 
           
            if (messageName === "remotesCallback") {
              console.log('Got Remotes');

              console.log("In remotes callback " + messageData);
    
              var remotes = messageData;
              var dom_head = document.getElementsByTagName('head')[0];
              
              for(var key in remotes) {
                var remote = remotes[key];
                var dom_js = document.createElement("script");
                dom_js.id = 'CONCEPTUALIZER_' + remote.key + "js";
                dom_js.type = "text/javascript";
                dom_js.src = remote.js;
                dom_head.appendChild(dom_js);
              }
              
              safari.self.removeEventListener('message', arguments.callee, false);
            }
            
          });
          
          safari.self.tab.dispatchMessage("remotes", {action   : "remotes"});

          // Now we will load in any local scripts that the user has been developing

          
          safari.self.addEventListener("message", function(msgEvent) {
            var messageName = msgEvent.name; 
            var messageData = msgEvent.message; 
           
            if (messageName === "localsCallback") {
              console.log('Got Locals');
    
              if (messageData) {
                var locals = messageData;
                
                console.log("locals got from the extension : ");
                console.log(locals);
                
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
              
              safari.self.removeEventListener('message', arguments.callee, false);
            }
            
          });
          
          safari.self.tab.dispatchMessage("locals", {action   : "locals"});
                  
          safari.self.removeEventListener('message', arguments.callee, false);
        }
      }, false);
            
      safari.self.tab.dispatchMessage("concepts", {
        action   : "concepts", 
        tags     : tags, 
        url      : url, 
        title    : title, 
        sver     : sver, 
        concepts : existing_concepts }
      );
    
      EverywhereLogger.log('Sent Event to Safari');
     
    });

    // Here we add the listener for cross site request calls
    document.addEventListener("ConceptualizerHarnessHttpRequest", function(event) {
      console.log('Heard conceptualizer request');
      var elem = event.target;
      var req = new Object();
      req.url = elem.getAttribute('url');
      req.req_type = elem.getAttribute('type');
      req.params = JSON.parse(elem.getAttribute('params'));
    
      safari.self.addEventListener("message", function(msgEvent) {
        var messageName = msgEvent.name; 
        var messageData = msgEvent.message; 
    
        if (messageName === "httpCallback") {
          console.log('Got Cross Site Result, messageData = ' + messageData);
          elem.setAttribute('result',JSON.stringify(messageData));
          var ev = document.createEvent("Events");
          ev.initEvent("ConceptualizerHarnessHttpResponse", true, false);
          elem.dispatchEvent(ev);
        
          safari.self.removeEventListener('message', arguments.callee, false);
        }
      }, false);
            
      safari.self.tab.dispatchMessage("http", {request: req});
    });
   
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
      
        safari.self.tab.dispatchMessage('concepts', {action: "concepts", tags: tags, url: url, title: title, sver: sver, concepts: existing_concepts});
      }
    };
   
    var saveConcepts = function(messageData) {
       var tagElems = document.getElementsByTagName('conceptualizereverywhereconceptevent');
       if (tagElems.length > 0) {
         var elem = tagElems[0];
         elem.setAttribute('concepts', JSON.stringify(messageData.matches))
       }
    };

    var dispatchRenderEventToDOM = function(emblems) {
      console.log('INJ: Calling dispatch Render Event');
      var eventElem = document.createElement("ConceptualizerEverywhereRenderEventElem");
      eventElem.setAttribute('emblems',JSON.stringify(emblems));
      document.documentElement.appendChild(eventElem);

      var ev = document.createEvent("Events");
      ev.initEvent("ConceptualizerEverywhereRenderEvent",true,false);
      eventElem.dispatchEvent(ev);
      console.log('INJ: Completed Dispatch');
    };
    
    safari.self.addEventListener("message", function(msgEvent) {
      var messageName = msgEvent.name; 
      var messageData = msgEvent.message; 
 
      if (messageName === "preferencesCallback") {
        console.log('Got Preferences');
        console.log(messageData);
        ConceptualizerHarnessInterceptor.contextual_root = messageData;
        remoteLoad();
    
        safari.self.removeEventListener('message', arguments.callee, false);
      }
    }, false);
  
    safari.self.tab.dispatchMessage('preferences', {action: "preferences"});        
    
    return ({
      contextual_root: null
    }); 
  }();
}