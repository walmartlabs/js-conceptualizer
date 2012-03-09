var ConceptualizerEverywhereZoner = function() {
  var TEXT_TYPE = 3;

  var ZoneBlock = function() {
    this.root = null;
    this.nodes = [];
    this.text = [];
    this.children = [];
    this.hasSentence = false;
    this.parentBlock = null;

    this.toString = function() {
      var str = "";
      var childrenStr = "";
      var children_ary = [];
      for(var i=0; i < this.children.length; i++) {
        children_ary.push(this.children[i].toString());
      }

      var cleanText = this.text.join(" ").replace(/\n/g,"\\n").replace(/"/g,'\\"');

      var nodes_ary = [];
      for(var i=0; i < this.nodes.length; i++) {
        nodes_ary.push("{\"name\": \"" + this.nodes[i].nodeName + "\",\"text\":\"" + this.nodes[i].nodeValue.replace(/\n/g,"\\n").replace(/"/g,'\\"') + "\",\"parent\":\"" + this.nodes[i].parentNode.nodeName + "\"}");
      }
      str += "{ \"root\":\"" + this.root.nodeName + "." + this.root.className + "#" + this.root.id + 
        "\",\"text\":\"" + cleanText + 
        "\",\"nodes\": [" + nodes_ary.join(',') + "]" + 
        ",\"children\": [" + children_ary.join(',') + "]}";
      return str;
    }
  };

  var CL_ALLOW_TRAVERSAL_TYPES = { "TABLE" : 1, "TR" : 1 };
  var CL_GOOD_CONTAINER_TYPES = { "P" : 1, "DIV": 1, "TD" : 1, "UL": 1 };
  var CL_GOOD_NODE_TYPES = { "A": 1, "P" : 1, "DIV": 1, "TD" : 1, "SPAN" : 1, "B" : 1, "I" : 1, "STRONG" : 1, "EM" : 1, "TR": 1, "TABLE" : 1, "OL" : 1, "UL" : 1, "LI" : 1, "TBODY" : 1};

  var is_sentence = function(text) {
    return (text.indexOf('.') >= 0);
  }

  var find_text_nodes_helper = function(curBlock,node) {
    //EverywhereLogger.log("in find_tex_nodes_helper for " + node.nodeName);
    var rootBlock = curBlock;
    var style = getComputedStyle(node,null);
    if (style && (style.getPropertyValue('visibility') == 'hidden' || style.getPropertyValue('display') == 'none' )) {
      EverywhereLogger.log('Aborting on a hidden element');
      return;
    }
    if (node.childNodes) {
      var cn = node.childNodes;
      if (CL_GOOD_CONTAINER_TYPES.hasOwnProperty(node.nodeName)) {
        EverywhereLogger.log('Building Zone Block for ' + node.nodeName);
        var parentBlock = curBlock;
        curBlock = new ZoneBlock();
        curBlock.root = node;
        curBlock.parentBlock = curBlock;
      }
      for(var i=0; i < cn.length; i++) {
        var child = cn[i];
        if (child) {
          if (child.nodeType && child.nodeType == TEXT_TYPE && child.nodeValue && child.nodeValue.length > 0 && child.nodeValue.match(/\S/)) {
            EverywhereLogger.log(child.nodeName + "::'" + child.nodeValue  + "'");
            curBlock.nodes.push(child);
            curBlock.text.push(child.nodeValue);
          } else {
            if (CL_GOOD_NODE_TYPES.hasOwnProperty(child.nodeName)) {
              find_text_nodes_helper(curBlock,child);
            }
          }
        }
      }
    }

    var curBlockText = curBlock.text.join(" ");
    // Add the current block onto the parent if it has at least one sentence.
    if (is_sentence(curBlockText)) {
      if (rootBlock != curBlock) {
        rootBlock.children.push(curBlock);
        rootBlock.text.push(curBlockText);
        EverywhereLogger.log("Block Text:" + curBlockText);
      }
    }
  };

  /*
   * If the rule_nodes length is 0, then we have to do raw auto zoning from the
   * document.body. Otherwise, we can use those nodes as starting points for
   * building blocks.
   */
  var find_text_nodes = function(dom,rule_nodes) {
    var blocks = [];
    if (rule_nodes.length == 0) {
      var rootBlock = new ZoneBlock();
      rootBlock.root = dom;
      find_text_nodes_helper(rootBlock,dom.body);
      EverywhereLogger.log("Blocklist Length: " + rootBlock.children.length);
      blocks.push(rootBlock);
    } else {
      for(var i=0; i < rule_nodes.length; i++) {
        var rootBlock = new ZoneBlock();
        rootBlock.root = rule_nodes[i];
        find_text_nodes_helper(rootBlock,rule_nodes[i]);
        blocks.push(rootBlock);
      }
    }
    return blocks;
  };

  // Public Interface
  return {
    blocks: null,
    text: null,
    CL_GOOD_CONTAINER_TYPES: CL_GOOD_CONTAINER_TYPES,
    zone: function(url,dom) {
      EverywhereLogger.bench_start("zone");
      var rule_nodes = ConceptualizerEverywhereSiteRulesZoner.get_zoned_nodes(url,dom);
      EverywhereLogger.log("Nodes from Site Rules: " + rule_nodes.length );
      EverywhereLogger.log('zone start');
      var blocks = find_text_nodes(dom,rule_nodes);
      EverywhereLogger.log('zone finished');
      EverywhereLogger.bench_finish("zone");
      EverywhereLogger.log(this.dump_zone_blocks(blocks));
      this.blocks = blocks;
      return blocks;
    },

    dump_zone_blocks: function(blocks) {
      EverywhereLogger.log(blocks.length + " Blocks Dumping");
      var json = "[";
      for(var i=0; i < blocks.length; i++) {
        json += blocks[i].toString();
      }
      json += "]";
      return json;
    },

    text_from_blocks: function(blocks) {
      EverywhereLogger.bench_start("text_from_blocks");
      var text = [];
      for(var i=0; i < blocks.length; i++) {
        var block = blocks[i];
        text.push(block.text.join(" "));
      }
      EverywhereLogger.bench_finish("text_from_blocks");
      this.text = text;
      return text.join(' ');
    }
  }
}();
