EverywhereLogger.log('Loading Site Rules JS');
var ConceptualizerEverywhereSiteRulesZoner = function() {

  var chooseRule = function(url) {
    url = url.replace(/^.+?:\/\//, '');
    var domain = url.substring(0, url.indexOf('/'));
    var after_subdomain_start = 0;

    EverywhereLogger.log("DOMAIN:" + domain);

    // how to find subdomain? It's the first part if there's at least 3 parts and at least 1 part of 3 letters after it
    var parts = domain.split(/\./);
    if (parts.length >= 3 && (parts[1].length >= 3 || parts[2] >= 3)) {
      after_subdomain_start = domain.indexOf('.') + 1;
    }

    var rules = ConceptualizerEverywhereSiteRules;

    while (url.length > 0) {
      var res = rules[url];
      if (res) {
        return res;
      }
      if (after_subdomain_start) {
        res = rules[url.substr(after_subdomain_start)];
        if (res) {
          return res;
        }
      }
      var last_slash = url.lastIndexOf('/');
      if (last_slash < 0) { /* nothing left to cut off path */
        return null;
      }
      url = url.substring(0, last_slash);
    }
 
    return null;
  };

  return {
    get_zoned_nodes: function(url,dom) {
      EverywhereLogger.log("Looking for Zone Rules:" + url);
      var rule = chooseRule(url);
      if (!rule) {
        EverywhereLogger.log("No rule");
        return [];
      }
      if (rule.hasOwnProperty('sel')) {
        EverywhereLogger.log("Rule includes CSS selector "+rule.sel);
        var nodes = ConceptualizerSly.search(rule.sel,dom);
        return nodes;
      }
      return [];
    },

    zone: function(url,dom) {
      var rule = chooseRule(url);
      if (!rule) {
        EverywhereLogger.log("No rule");
        return null;
      }
      var strs = [];
      if (rule.hasOwnProperty('get')) {
        var get_goals = {};
        if (typeof(rule.get) == 'string') {
          get_goals[rule.get] = 1;
          EverywhereLogger.log("Rule includes GET "+rule.get);
        } else {
          for (var i=0, il=rule.get.length; i < il; ++i) {
            get_goals[rule.get[i]] = 1;
            EverywhereLogger.log("Rule includes GET "+rule.get[i]);
          }
        }
        var search_start = url.indexOf('?');
        if (search_start > 0) {
          var params = url.substr(search_start+1).split('&');
          for (var i=0, il=params.length; i < il; ++i) {
            var kv = params[i].split('=');
            if (get_goals[kv[0]]) {
              strs.push(kv[1]);
            }
          }
        }
      }

      if (rule.hasOwnProperty('sel')) {
        EverywhereLogger.log("Rule includes CSS selector "+rule.sel);
        var nodes = Sly.search(rule.sel,dom);
        if (nodes) {
          EverywhereLogger.log('l: '+nodes.length);
          for (var i=0, il=nodes.length; i < il; ++i) {
            strs.push(cleanupTags(nodes[i].innerHTML));
          }
        }
      }
      return strs.join(" \n").substring(0,10239);
    }
  };
}();
EverywhereLogger.log('Loaded Site Rules JS');

