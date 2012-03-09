var ConceptualizerHarnessRenderer = function() {
  EverywhereLogger.log('Initializing ConceptualizerHarness Connect Renderer');
  //var CONCEPT_BLACKLIST = ["Monday","Tuesday","Wednesday", "Thursday","Friday","Mr", "Mr.","Mrs.","Mrs", "They", "January", "February","March", "April","May","June","July","August","September","October","November","December","New","Speaker"];

  var RENDER_EVENT = "ConceptualizerEverywhereRenderEvent";
  var RENDER_EVENT_ELEM = RENDER_EVENT + "Elem";
  var RENDER_EVENT_CALLBACK = RENDER_EVENT;

  var build_regex_from_emblems = function(emblems) {
    var textual_reps = [];
    var emblem_hash= {};
    for(var i=0; i < emblems.length; i++) {
      // Clean version of the match 
      var clean_rep = emblems[i].match.replace(/[^a-zA-Z0-9')( ]/g,"");
      //if (CONCEPT_BLACKLIST.indexOf(clean_rep) == -1) {
      textual_reps.push(clean_rep);
      emblem_hash[clean_rep] = emblems[i];
      //}
    }
    EverywhereLogger.log('Textual Reps:' + JSON.stringify(textual_reps));
    if (textual_reps.length == 0) {
      throw "Empty Regular Expression";
    }

    var regex = new RegExp("\\b(" + textual_reps.join(")\\b|\\b(") + ")\\b","g");
    EverywhereLogger.log("Regex:" + regex);
    return regex;
  };

  var build_emblem_hash = function(emblems) {
    var emblem_hash = {};
    for(var i=0; i < emblems.length; i++) {
      // Clean version of the textual representations
      var clean_rep = emblems[i].match.replace(/[^a-zA-Z0-9')( ]/g,"");
      emblem_hash[clean_rep] = emblems[i];
    }
    return emblem_hash;
  };

  var get_leaf_nodes_in_block = function(leaf_nodes,block) {
    for(var i=0; i < block.nodes.length; i++) {
      EverywhereLogger.log("Adding " + block.nodes[i].nodeValue + " to leaf nodes");
      leaf_nodes.push(block.nodes[i]);
    }
    for(var i=0; i < block.children.length; i++) {
      get_leaf_nodes_in_block(leaf_nodes,block.children[i]);
    }
  };

  /*
   * If you are a inside a link. Bail out as soon as you hit a container type
   */
  var child_of_a_link = function(node) {
    var cur = node;
    while(1) {
      if (cur.nodeName == 'BODY')
        return null;
      if (ConceptualizerEverywhereZoner.CL_GOOD_CONTAINER_TYPES.hasOwnProperty(cur.nodeName))
        return false;
      if (cur.nodeName == 'A') {
        return true;
      } else {
        cur = cur.parentNode;
      }
    }
  };

  var retrieve_link_parent = function(node) {
    var cur = node;
    while(1) {
      if (cur.nodeName == 'BODY')
        return null;
      if (ConceptualizerEverywhereZoner.CL_GOOD_CONTAINER_TYPES.hasOwnProperty(cur.nodeName))
        return null;
      if (cur.nodeName == 'A') {
        return cur;
      } else {
        cur = cur.parentNode;
        if (cur == null) {
          return null;
        }
      }
    }
  }

  /* Depending on the type of metadata, build an emblem */
  var build_emblem_elem = function(dom,emblem) {
    if (emblem) {
      EverywhereLogger.log('Building Emblem:' + JSON.stringify(emblem));
      var emblem_img = document.createElement('img');
      //emblem_img.className = 'CL_img';
      emblem_img.src = emblem.icon;
      emblem_img.setAttribute('metadata',JSON.stringify(emblem));
      emblem_img.style.cssText = 'display:inline !important; cursor: pointer !important; border: 0px !important; float:none !important; height: 13px !important; width:13px !important; margin:0px 0px 0px 2px !important; padding:0px !important; min-width: 13px !important; max-width: 13px !important; min-height: 13px !important; max-height: 13px !important; position: static !important;';

      emblem_img.addEventListener('mouseover',function(event) {
        var metadata = event.target.getAttribute('metadata');
        var emblem_data = JSON.parse(metadata);
        emblem.hover(emblem_data);
        event.stopPropagation();
      },false);

      emblem_img.addEventListener('mouseout', function(event) {
        event.stopPropagation();
      },true);

      emblem_img.addEventListener('click', function(event) {
        event.stopPropagation();
      }, false);

      return emblem_img;
    }
    return null;
  };

  var iterative_shallowing_hilight = function(dom,zone_blocks,regex, emblem_hash) {
    var leaf_nodes = [];
    for(var i=0; i < zone_blocks.length; i++) {
      get_leaf_nodes_in_block(leaf_nodes,zone_blocks[i]);
    }

    highlighted_words = {};
    for(var j=0; j < leaf_nodes.length; j++) {
      var node = leaf_nodes[j];
      var start = 0;
      var link_parent = retrieve_link_parent(node);
      var new_children_to_add = [];
      if (link_parent) {
        EverywhereLogger.log("Searching for Regex on Link " + node.nodeValue);
        matches = regex.exec(node.nodeValue);
        if (matches) {
          var word = matches[0];
          if (highlighted_words.hasOwnProperty(word)) {
            EverywhereLogger.log('Already highlighted:' + word);
            continue;
          }

          if (link_parent.className && link_parent.className.indexOf('twitter-account') > -1) {
            EverywhereLogger.log('Aborting a highlight because of potential @anywhere collision');
            continue;
          }
          EverywhereLogger.log('Found Word inside a link:' + matches[0]);
          if (node.nodeValue == word) {
            EverywhereLogger.log('Exact match inside the link so emblemizing it');
            var sibling = link_parent.previousSibling;
            /* This is to ensure we do not link concepts that have a @ in front of them */
            if (sibling) {
              var siblingText = sibling.nodeValue;
              EverywhereLogger.log('Sibling Text:"' + siblingText + '"');
              if (siblingText && siblingText.charAt(siblingText.length - 1) == '@')
                continue;
            }

            var emblem = build_emblem_elem(dom,emblem_hash[word]);
            if (link_parent && emblem) {
              EverywhereLogger.log('Drawing Emblem after Link');
              link_parent.parentNode.insertBefore(emblem, link_parent.nextSibling);
              new_children_to_add.push(emblem);
              highlighted_words[word] = 1;
            }
          } else {
            EverywhereLogger.log('Not exact match, so probably a headline or some other type of link');
            // Break out of here because we are inside a link, so only want one potential emblem
          }
          continue;
        }
      } else {
        EverywhereLogger.log("Searching for Regex on Text:" + node.nodeValue);
        while((matches = regex.exec(node.nodeValue)) != null) {
          EverywhereLogger.log('Exec Matches');
          EverywhereLogger.log(matches);
          var word = matches[0];
          if (highlighted_words.hasOwnProperty(word)) {
            EverywhereLogger.log('Already highlighted:' + word);
            continue;
          }

          EverywhereLogger.log('Found Word in Normal Text:' + matches[0]);
          var prematch = node.nodeValue.substr(start,matches.index - start);
          EverywhereLogger.log("Found prematch:'" + prematch + "'");
          var postmatch = node.nodeValue.substr(matches.index + word.length);
          EverywhereLogger.log("Found postmatch:'" + postmatch + "'");
          EverywhereLogger.log("Postmatch:" + postmatch.charCodeAt(0));
          start = regex.lastIndex;
          var emblem = build_emblem_elem(dom,emblem_hash[word]);
          if (emblem) {
            var pre_text = dom.createTextNode(prematch + matches[0]);
            new_children_to_add.push(pre_text);
            new_children_to_add.push(emblem);
            highlighted_words[word] = 1;
          }
        }
        if (new_children_to_add.length > 0) {
          new_children_to_add.push(dom.createTextNode(node.nodeValue.substr(start)));
          var parentNode = node.parentNode;
          if (parentNode) {
            for(var k=0; k < new_children_to_add.length; k++) {
              parentNode.insertBefore(new_children_to_add[k],node);
            }
            parentNode.removeChild(node);
          }
        }
      }
      regex.lastIndex = 0;
    }
  };

  EverywhereLogger.log('Initialized Everywhere Renderer');

  document.addEventListener(RENDER_EVENT,function(event) {
    console.log(event);
    var tgt = event.target;
    var emblems_json = tgt.getAttribute('emblems');
    if (emblems_json) {
      var emblems = JSON.parse(emblems_json);
      console.log('Got Render From Injected Script');
      ConceptualizerHarnessRenderer.render(document,emblems,ConceptualizerEverywhereZoner.blocks);
    }

  },false);

  return {
    highlight_concepts: function(dom,emblems,zone_blocks) {
      EverywhereLogger.log('In highlight concepts');
      EverywhereLogger.log(emblems);
      EverywhereLogger.bench_start("highlight_concepts");
      if (emblems.length > 0) {
        try {
          EverywhereLogger.log('here');
          var regex = build_regex_from_emblems(emblems);
          EverywhereLogger.log(regex);
          var emblem_hash = build_emblem_hash(emblems);

          iterative_shallowing_hilight(dom,zone_blocks,regex,emblem_hash);
        } catch(ex) {
          EverywhereLogger.log(ex);
        }
      }
      EverywhereLogger.bench_finish("highlight_concepts");
      EverywhereLogger.log('Done highlight concepts');
    },

    render: function(dom,emblems,zone_blocks) {
      EverywhereLogger.log('In HyperRenderer with ' + dom.location.href);
      /*
      EverywhereLogger.log('Sandbox Initiated');
      var sandbox = dom.createElement('div');
      sandbox.setAttribute('id','CL_sandbox');
      sandbox.style.cssText = 'margin:0;position:absolute;top:0;left:0';
      dom.body.appendChild(sandbox);
      EverywhereLogger.log('Sandbox Created');
      EverywhereLogger.log("Meta:" + this.meta);
      */
      this.highlight_concepts(dom,emblems,zone_blocks);

      /* Add the global event handler for clicking on the body to close popups
      dom.body.addEventListener('click',function() {
        CLInlineRenderer.closeWindows();
      },false);
      */
    }
  }
}();

var ConceptualizerHarness = function() {
  /*
   * This function gives us the real location of a body element
   */
  var bodyOffset = function(elem) {
      var valueT = 0, valueL = 0;
      var element = elem;
      do {
        valueT += element.offsetTop  || 0;
        valueL += element.offsetLeft || 0;
        if (element.offsetParent == document.body) break;
      } while (element = element.offsetParent);
      element = elem;
      do {
        if (element.tagName == 'BODY') {
          break;
        }
      } while (element = element.parentNode);
      return [valueL, valueT];
  };

  return {
    onResolve: function(callback) {
      var tagElems = document.getElementsByTagName('conceptualizereverywhereconceptevent');
      if (tagElems.length > 0) {
        var elem = tagElems[0];
        var tags = elem.getAttribute('tags');
        var url = elem.getAttribute('url');
        var title = elem.getAttribute('title');
        var sver = elem.getAttribute('sver');
        var concepts = elem.getAttribute('concepts');
        var parsed_concepts = JSON.parse(concepts);
        callback(parsed_concepts);
      }
    },

    http: function(url,type,params,callback) {
      var req_elem = document.createElement('conceptualizerrequest');
      req_elem.setAttribute('url',url);
      req_elem.setAttribute('params', JSON.stringify(params));
      req_elem.setAttribute('type', type);

      req_elem.addEventListener('ConceptualizerHarnessHttpResponse', function(event) {
        var elem = event.target;
        var result_payload = elem.getAttribute('result');
        var response = JSON.parse(result_payload);
        callback(response);
      }, false);

      document.documentElement.appendChild(req_elem);
      var ev = document.createEvent("Events");
      ev.initEvent("ConceptualizerHarnessHttpRequest",true,false);
      req_elem.dispatchEvent(ev);
    },

    render: function(emblems) {
      EverywhereLogger.log('Calling Renderer');

      var sandbox = document.createElement('div');
      sandbox.setAttribute('id','FH_sandbox');
      sandbox.style.cssText = 'margin:0;position:absolute;top:0;left:0';
      document.body.appendChild(sandbox);

      ConceptualizerHarnessRenderer.render(document,emblems,ConceptualizerEverywhereZoner.blocks);
    },

    popup: function(app, emblem, header, callback) {
      var popup_id = 'FH_popup_' + app + "_" + emblem.match.toLowerCase().replace(/[\s ']/,'_');
      var pos_ary = bodyOffset(event.target);
      var popup_offset = [-45,35];
      var popup = document.getElementById(popup_id);
      if (!popup) {
        popup = document.createElement('div');
        popup.id = popup_id;
        popup.addEventListener('click',function(event) { event.stopPropagation(); }, false);
        popup.className = 'FH_popup';
        popup.style.width = '300px';

        var popup_arrow = document.createElement('div');
        var popup_header = document.createElement('div');
        var close_button = document.createElement('div');
        
        popup_arrow.className = 'FH_popup_arrow_container';
        popup_arrow.innerHTML = '<div class="FH_popup_arrow_outer"><div class="FH_popup_arrow_shadow"></div></div><div class="FH_popup_arrow_inner"></div>';
        
        popup_header.className = 'FH_popup_header';
        popup_header.innerHTML = header;

        close_button.className = 'FH_it_close_button';
        close_button.innerHTML = '&times;';

        close_button.addEventListener('click',function(event) {
          event.stopPropagation();
          popup.style.display = 'none';
        },true);
        
        popup_header.appendChild(close_button);
        popup.appendChild(popup_arrow);
        popup.appendChild(popup_header);

        var popup_content = document.createElement('div');
        popup_content.id = popup_id + "-content";
        popup_content.innerHTML = '<span class="FH_loading">Loading...<img src="http://k05.kstatic.net/images/loading.gif" width="15" height="15" class=/></span>';

        popup.appendChild(popup_content);
        var sandbox = document.getElementById('FH_sandbox');
        if (sandbox) {
          sandbox.appendChild(popup);
        }

        var clientX = event.clientX;
        var clientY = event.clientY;
        var iL = document.body.scrollLeft;
        var iV = document.body.scrollTop;
        popup.style.left = "" + (pos_ary[0] + popup_offset[0]) + "px";
        popup.style.top = "" + (pos_ary[1] + popup_offset[1]) + "px";

        callback(popup_content);

      } else {
        if (popup.style.display!= 'block') {
          popup.style.display = 'block';
          popup.style.left = "" + (pos_ary[0] + popup_offset[0]) + "px";
          popup.style.top = "" + (pos_ary[1] + popup_offset[1]) + "px";
          //CLInlineRenderer.openWindows.push(popup);
        }
      }
    }
  }
}();
