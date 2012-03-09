var ConceptualizerOptions = function() {
  var toggleApp = function(key) {
    var elem = document.getElementById(key);
    if (enabled_apps.hasOwnProperty(key)) {
      console.log('Disabling ' + key);
      elem.className = 'app';
    } else {
      console.log('Enabling ' + key);
      elem.className = 'enabled_app';
    }
    // send it to the extension layer
    var elem = document.getElementsByTagName('enabled_apps')[0];
    elem.setAttribute('toggleApp', key);
    elem.setAttribute('toggleAppValue', ConceptualizerOptions.apps[key]);

    var ev = document.createEvent("Events");
    ev.initEvent("ConceptualizerToggleEvent", true, false);
    elem.dispatchEvent(ev);
  }

  return {
    /* Public Interface */
    contextual_root: null,
    apps: null,

    init: function() {
      var elem = document.createElement('enabled_apps');
      console.log("elem : " + elem);
      document.documentElement.appendChild(elem);
      
      var ev = document.createEvent("Events");
      ev.initEvent("ConceptualizerOptionsEvent", true, false);
      elem.dispatchEvent(ev);
    },
    
    download : function(url,callback) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          var res = new Object();
          res.status = req.status;
          res.body = req.responseText;
          console.log(url);
          console.log(res);
          callback(res);
        } 
      };
      req.open("GET", url, true);
      req.send(null);
    },
    
    renderAppStore : function(apps,ea_hash) {
      var app_store_elem = document.getElementById('apps');
      for(var i=0; i < apps.length; i++) {
        var app = apps[i];
        var app_div = document.createElement('div');
        app_div.id = app.key;
        if (ea_hash.hasOwnProperty(app.key)) {
          app_div.className = 'enabled_app';
        } else {
          app_div.className = 'app';
        }

        app_div.addEventListener('click',function(e) {
          toggleApp(this.id);
        },true);

        var title_div = document.createElement('div');
        var icon_img = document.createElement('img');
        if (apps[i].icon.match(/^http:\/\//)) {
          icon_img.src = apps[i].icon;
        } else {
          icon_img.src = ConceptualizerOptions.contextual_root + apps[i].icon;
        }
        var title_text = document.createTextNode(apps[i].name);

        title_div.appendChild(icon_img);
        title_div.appendChild(title_text);

        app_div.appendChild(title_div);
        app_store_elem.appendChild(app_div);

      }
    }
    
  }
}();

document.addEventListener("ConceptualizerOptionsEventCallback", function(event) {  
  var contextual_root = localStorage['contextual_root'];
  if (!contextual_root) {
    contextual_root = 'http://dev002.sj.conceptualizer.com:1984';
  }
  ConceptualizerOptions.contextual_root = contextual_root;
  var kce_url = contextual_root + "/json/apps.json";

/*  var enabled_apps_hash = enabledAppsHash(); */
  var enabledAppsHash = event.target.getAttribute('enabled_apps');
  console.log("in the options page ConceptualizerOptionsEventCallback. EnableAppHash : " + enabledAppsHash);
  
  ConceptualizerOptions.download(kce_url,function(result) {
    if (result.status == 200) {
      localStorage['apps'] = result.body;
      var apps = JSON.parse(result.body);
      ConceptualizerOptions.apps = {};
      for(var i=0; i < apps.length; i++) {
        ConceptualizerOptions.apps[apps[i].key] = apps[i];
      }
      ConceptualizerOptions.renderAppStore(apps, enabled_apps_hash);
    } else {
      alert('Error Retrieving Apps');
    }
  });
  
});

/*ConceptualizerOptions.init();*/
