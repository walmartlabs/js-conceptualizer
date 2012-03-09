function get_selected_text()
{
  var txt = '';
  if (window.getSelection)
  {
    txt = window.getSelection();
  }
  else if (document.getSelection)
  {
    txt = document.getSelection();
  }
  else if (document.selection)
  {
    txt = document.selection.createRange().text;
  }
  return "" + txt;
}
/*
 * Regex 
 * Try to build text out of the DOM by various Regex
 */
function getElementsByClassName(node, classname)
{
  var a = [];
  var re = new RegExp('\\b' + classname + '\\b');
  var els = node.getElementsByTagName("*");
  for(var i=0,j=els.length; i<j; i++)
    if(els[i].className == classname)
      a.push(els[i]);
  return a;
}

function find_text_nodes(dom) {
  var text_nodes = [];
  var TEXT_TYPE = 3;
  if (dom.childNodes) {
    for(var i=0; i < dom.childNodes.length; i++) {
      var child = dom.childNodes[i];
      if (child.nodeType == TEXT_TYPE && child.nodeValue && child.nodeValue.length > 0) {
        text_nodes.push(child); 
      }
    }
    for(var i=0; i < CL_good_node_types.length; i++) {
      var tags = dom.getElementsByTagName(CL_good_node_types[i]);
      for(var j=0; j < tags.length; j++) {
        var tag = tags[j];
        // Skip links with text nodes inside them
        if (tag.parentNode.nodeName != 'A') {
          for(var k=0; k < tag.childNodes.length; k++) {
            var child = tag.childNodes[k];
            if (child.nodeType == TEXT_TYPE && child.nodeValue && child.nodeValue.length > 0) {
              text_nodes.push(child); 
            }
          }
        }
      }
    }
  }
  //for(var i=0; i < leaf_nodes.length; i++) {
  //  console.log(i + ":" + leaf_nodes[i].nodeName + "::" + (leaf_nodes[i].firstChild ? leaf_nodes[i].firstChild.nodeValue : 'null'));
  //}
  return text_nodes;
}

function replace_text_with_link(node,regex) {
  var TEXT_TYPE = 3;
  var text_nodes = find_text_nodes(node);
  var parent_type = node.nodeName;
  var highlighted_words = [];

  var limited_length = (text_nodes.length > 200) ? 200 : text_nodes.length;

  for(var i=0; i < limited_length; i++) {
    var child = text_nodes[i];
    var child_name = child.nodeName;
    var child_type = child.nodeType;
    var child_value = child.nodeValue;
    var text = child.nodeValue;
    var match_found = false;
    var matches = null;
    var start = 0;
    var new_children_to_add = [];
    while((matches = regex.exec(child_value)) != null) {
      match_found = true;
      var prematch = child_value.substr(start,matches.index - start);
      start = regex.lastIndex;
      var word = matches[0];
      var new_text = document.createTextNode(prematch);
      new_children_to_add.push(new_text);
      if (highlighted_words[word] != 1) {
        var link = document.createElement('a');
        link.setAttribute('href','javascript:CL_doit(document,"' + word + '")');
        link.innerHTML = word + " <img class='CL_img' src='http://assets.cruxlux.com/images/small_x.png' style='display:inline; border: 0px; float:none; height: 13px; width:8px'/>";
        link.className = 'CL_marked';
        //var img = document.createElement('img');
        //img.setAttribute('src','http://www.cruxlux.com/images/small_x.png');
        //img.style.cssText = "display:inline;border:0px;";
        //link.style.cssText = "color: #1c00c6; text-decoration:none; background-color: #00ff00;";
        new_children_to_add.push(link);
        //new_children_to_add.push(img);
        highlighted_words[word] = 1;
      } else {
        var just_word = document.createTextNode(word);
        new_children_to_add.push(just_word);
      }
    }
    if (new_children_to_add.length > 0) {
      new_children_to_add.push(document.createTextNode(child_value.substr(start)));
      for(var j=0; j < new_children_to_add.length; j++) {
        child.parentNode.insertBefore(new_children_to_add[j],child);
      }
      child.parentNode.removeChild(child);
      regex.lastIndex = 0;
    }
  }
}

function highlight_tuples(tuples) {
  if (tuples.length > 0) {
    CL_good_node_types = ["P","DIV","SPAN","LI","B","I","FONT","STRONG","EM","TD"];
    CL_good_node_types_hash = [];
    CL_seen = [];
    for(var i=0; i < CL_good_node_types.length; i++) {
      CL_good_node_types_hash[CL_good_node_types[i]] = 1;
    }


    var regex = new RegExp("(" + tuples.join(")|(").replace(/[^a-zA-Z0-9)(| ]/g,"") + ")","g");
    //console.log(regex);
    replace_text_with_link(document.body,regex);
    /*
    var elems = [];
    for(var i=0; i < CL_good_node_types.length; i++) {
      var type = CL_good_node_types[i];
      console.log(type);
      var new_elems = document.getElementsByTagName(type);
      for(
      console.log(new_elems.length);
      elems = elems.concat(new_elems);
      console.log(elems.length);
    }
    console.log("Found " + elems.length + " potential elems");
    for(var i=0; i < elems.length; i++) {
      //console.log(elems[i]);
      //elems[i].innerHTML = elems[i].innerHTML.replace(regex,'<a style="color: #1c00c6; text-decoration:underline;border-bottom: 1px dotted #1c00c6" href=\'javascript:CL_doit(document,"$&")\'>$&</a>');
    }
    */
  }
}

function regex_paragraph_builder(dom)
{
  var bodies = dom.getElementsByTagName('body');
  if (bodies.length == 0) {
    alert('The Cruxlux Bookmarklet cannot find any content to work with.  You may be on a site that is using frames (that\'s so 1998).  Try opening one of the frames in its own window.');
    return "";
  }
  var rp = bodies[0].innerHTML;

  // Do this for multiline regex match.  Make sure to convert back at the end
  rp = rp.replace(/\n/g,'\uffff');
  rp = rp.replace(/<script.*?<\/script>/ig,'');
  rp = rp.replace(/<style.*?<\/style>/ig,'');
  rp = rp.replace(/<object.*?<\/object>/ig,'');
  rp = rp.replace(/<select.*?<\/select>/ig,'');
  rp = rp.replace(/<noscript.*?<\/noscript>/ig,'');
  //console.log("Remove Inlines:"+ rp);
  rp = rp.replace(/<\/?((b)|(strong)|(i)(em))[ ]*>/ig,'');
  rp = rp.replace(/<\/?((span)|(b)|(strong)|(i)|(a)|(font)|(em))[^>]*>/ig,'');
  rp = rp.replace(/<br\/?[^>]*>/ig,'. ')
  rp = rp.replace(/(<([^>]+)>)/g,'. ');
  rp = rp.replace(/[)(]/g,'');
  rp = rp.replace(/\s+/g,' ');
  rp = rp.replace(/\|/g,' ');
  rp = rp.replace(/&amp;/ig,'&');
  rp = rp.replace(/\uffff/g,'\n');
  return rp.substr(0,10000);
}

function get_defined_keywords()
{
  if (eval("typeof CL_keywords") == "undefined") {
    return [];
  } else {
    return CL_keywords;
  }
}

function is_defined(keyword)
{
  if (eval("typeof " + keyword) == "undefined") {
    return false;
  } else {
    return true;
  }
}

/* If the word ends in a comma, then we consider that a tuple ender.  There
 * can probably be more of these in the future
 */
function tuple_ender(word)
{
  var length = word.length;
  var last_char = word.charCodeAt(length- 1);
  if (last_char == 44) {
    return word.substr(0,length -1);
  } else {
    return undefined;
  }
}

/*
 * Find tuples inside a sentence
 * - We need to do something smart here with the ngram
 */
function parse_sentence(tuple_freq_map,ngrams,sentence)
{
  var words = sentence.split(/\s+/);
  var tuple = [];
  var tlist = [];
  if (words.length < 4) {
    //console.log('Bailing out of ' + sentence);
    return;
  }
  //console.log('Parsing: ' + sentence);
  for(var i=1; i < words.length; i++) {
    var word = words[i];
    var word_look_ahead = words[i+1];
    var first_char = word.charCodeAt(0);
    var look_ahead_first_char = 0;
    if (word_look_ahead) {
      look_ahead_first_char = word_look_ahead.charCodeAt(0);
    }
    if ((first_char > 64 && first_char < 91) || first_char == 38 || (word == 'of' && tuple.length > 0 && look_ahead_first_char < 91 && look_ahead_first_char > 64)) {
      word = word.replace(/[\u2019']s/g,'');
      var last_of_tuple = tuple_ender(word);
      if (last_of_tuple) {
        tuple.push(last_of_tuple);
        tlist.push(tuple);
        tuple = [];
      } else {
        tuple.push(word);
      }
    } else {
      if (tuple.length > 0) {
        tlist.push(tuple);
      }
      tuple = [];
    }
  }
  if (tuple.length > 0) {
    tlist.push(tuple);
  }
  for(var i=0; i < tlist.length; i++) {
    var tuple = tlist[i];
    if (tuple != undefined && tuple.length > 0) {
      var tuple_str = tuple.join(" ");
      var tuple_len = tuple.length;
      if (tuple_len >= 2) {
        ngrams[tuple[tuple_len- 1]] = tuple_str;
      }
      if (tuple_freq_map[tuple_str] == undefined) {
        tuple_freq_map[tuple_str] = 1;
      } else {
        tuple_freq_map[tuple_str]++;
      }
    }
  }
}

/* This function we pass in a word to see if it should be a sentence ender.
 * Essentially if it is an acronym we say no.*/
function sentence_ender(word)
{
  var period_count = 0;
  var length = word.length;
  for(var i=0; i < length; i++) {
    var ch = word.charCodeAt(i);
    if (ch == 46) {
      period_count++;
    }
  }
  var last_char = word.charCodeAt(length- 1);
  if (last_char == 46) {
    if (period_count * 2 == length) {
      return undefined;
    } else {
      return word.substr(0,length -1);
    }
  } else if (last_char == 33 || last_char == 63 || last_char == 58 || last_char == 59 || last_char == 124) {
    return word.substr(0,length -1);
  } else {
    return undefined;
  }
}


/* 
 * Break the paragraph down into sentences using a more advanced tokenizing.
 * If there is word that ends in a period, that marks the end of a sentence,
 * unless it is a one letter word other an I.
 *
 * char code of period: 46
 */ 
function parse_paragraph(tuple_freq_map,ngrams,paragraph) 
{
  paragraph = paragraph.replace(/["]/g,'').replace(/\.\.\./g,',');
  //console.log('Parsing Paragraph:' + paragraph);
  var sentences = []
  var words = paragraph.split(/\s+/);
  var cur_sentence = [];
  var ender = undefined;
  for(var i=0; i < words.length; i++) {
    var word = words[i];
    if((ender = sentence_ender(word)) != undefined) {
      cur_sentence.push(ender);
      sentences.push(cur_sentence.join(' '));
      cur_sentence = [];
    } else {
      cur_sentence.push(word);
    }
  }
  if (cur_sentence.length > 0) {
    sentences.push(cur_sentence.join(' '));
  }
  for(var i=0; i < sentences.length; i++) {
    var sentence = sentences[i];
    sentence = sentence.replace(/^[^a-zA-Z0-9']+/,'').replace(/\s+$/,'').replace(/[\[\]]/g,'');
    //console.log("Parsing Sentence:'" + sentence + "'");
    parse_sentence(tuple_freq_map,ngrams,sentence);
  }
}

function filter_tuples(tuple_freq_map,ngrams)
{
  var tuples = []
  for(var tuple in tuple_freq_map) {
    if (tuple && tuple.length > 0 && tuple_freq_map[tuple] > 0) {
      var ngram = ngrams[tuple];
      if (ngram) {
        //console.log("Found ngram for " + tuple);
        tuple_freq_map[ngram] += tuple_freq_map[tuple];
        tuple_freq_map[tuple] = 0;
      } else {
        tuples.push(tuple);
      }
    }
  }

  tuples = tuples.sort(function(a,b) {return tuple_freq_map[b] - tuple_freq_map[a]});
  var stops = ['not','about', 'adblock', 'adblock plus', 'add', 'added', 'advertise', 'alert', 'alerts', 'and', 'another', 'apr', 'april', 'article', 'aug', 'august', 'author', 'blog', 'blogs', 'but', 'cached', 'category', 'choose', 'close', 'comment', 'comments', 'contact', 'copyright', 'create', 'dec', 'december', 'default', 'diary', 'discuss', 'edt', 'email', 'error', 'est', 'faq', 'favorites', 'feb', 'february', 'filed', 'find', 'firefox', 'focus', 'fri', 'friday', 'get', 'gmt', 'got', 'help', 'here', 'hide', 'home', 'home page', 'how', 'i',"i'm", 'images', 'isbn', 'its', 'jan', 'january','jul', 'july', 'jump', 'jun', 'june', 'license', 'link', 'links', 'loading..', 'log', 'login', 'mar', 'march', 'marked', 'may', 'maybe', 'mon', 'monday', 'more', 'new', 'news', 'next', 'nov', 'november', 'object', 'oct', 'october', 'ok', 'op-ed', 'or', 'original', 'pageview', 'permalink', 'photo', 'photos', 'play', 'poll', 'post', 'posted', 'posts', 'preferences', 'prev', 'previous', 'privacy','est','pst', 'publisher', 're', 'read', 'recent', 'recommended', 'references', 'register', 'related', 'rep', 'reply', 'review', 'reviews', 'rss', 'sat', 'saturday', 'score', 'search', 'see', 'sen', 'sep', 'september', 'share', 'favorite', 'more...', 'days', 'week', 'weeks', 'years', 'months', 'toolbar', 'sharethis', 'show', 'sign', 'similar', 'there', 'shes', 'hes', 'skip', 'source', 'stories', 'story', 'submit', 'submitted', 'subscribe', 'sun', 'sunday', 'tag', 'tags', 'terms', 'that', 'thats', 'the', 'these', 'this', 'thu', 'thursday', 'today', 'tools', 'top', 'tue', 'tuesday', 'united states', 'u.s.', 'usa', 'update', 'user', 'video','videos','news', 'view', 'views', 'want', 'wed', 'wednesday', 'what', 'when', 'where', 'why', 'wiki', 'yahoo', 'yes', 'yesterday', 'you', 'pm','et','no','from','it','were','for','is','he','we','with','in','dr','mr',"i'd","i've","i'll","am","pm","should",'terms of service','site map','privacy policy','slideshow','try','now','day','nation','life','free','they','seriously','know','thanks','forced','apps','pictures','said','back','yahoo! news','yahoo news','press','im','i’m','changes','highlights']; 
  var blocks = new Array();    
  for(var j = 0; j < stops.length; j++) {
    blocks[stops[j]] = 1;
  }

  var tuples_limited = [];
  var counter = 0;
  for(var i = 0; i < tuples.length; i++) {
    var tuple = tuples[i];
    if (tuple.length > 2) {
      if(blocks[tuple.toLowerCase()]) {
        //console.log('Skipping:' + tuples[i]);
      } else if (/=/.test(tuple)) {
        //console.log('Skipping ' + tuple);
      }else {
        if (tuple == 'Senate') { tuple = 'U.S. Senate'; }
        if (tuple == 'House') { tuple = 'U.S. House of Representatives'; }
        else if (tuple == 'Congress') { tuple = 'U.S. Congress'; }
        else if (tuple == 'Pentagon') { tuple = 'The Pentagon'; }
        else if (tuple == 'Senator') { tuple = 'U.S. Senator'; }
        tuples_limited.push(tuple);
        counter++;
      }
    }
    if (counter > 100) {
      break;
    }
  }
  return tuples_limited;
}

/*
 * Top level function that puts all the leaf nodes and parsing together
 */
function representative_tuples(dom) {
  //bench_start('rp');
  var text_blocks = regex_paragraph_builder(dom);
  var tuple_freq_map = new Array();
  var ngrams = new Array();
  parse_paragraph(tuple_freq_map,ngrams,text_blocks);
  var filtered_tuples = filter_tuples(tuple_freq_map,ngrams);

  // Add user specified keywords
  var user_defined_keywords = get_defined_keywords(); 
  filtered_tuples = user_defined_keywords.concat(filtered_tuples);

  // Add title of page
  var titles = dom.getElementsByTagName('title');
  if (titles.length > 0) {
    var title_text = (titles[0].firstChild ? titles[0].firstChild.nodeValue : titles[0].innerHTML);
    if (title_text) {
      //tuples_limited.push(title_text.replace(/\n/g,""));
      filtered_tuples.unshift(title_text.replace(/\n/g,""));
    }
  }
  return filtered_tuples;
}

function CL_destroy() {
  /*
  var d = document.getElementById('CRUXLUX_l');
  if (d) {
    d.parentNode.removeChild(d);
  }
  */
  var d = document.getElementById('CRUXLUX_c');
  if (d) {
    d.parentNode.removeChild(d);
  }
  d = document.getElementById('CRUXLUX_gp');
  if (d) {
    d.parentNode.removeChild(d);
  }
}

function CL_closeup() {
  /*
  var d = document.getElementById('CRUXLUX_l');
  d.style.display = 'none';
  */
  var d = document.getElementById('CRUXLUX_c');
  d.style.display = 'none';
  document.getElementById('CRUXLUX_gp').style.display = 'none';
}

function CL_restore() {
  document.getElementById('CRUXLUX_gp').style.display = 'block';
  document.getElementById('CRUXLUX_c').style.display = 'block';
}

function CL_open() {
  /*
  var d = document.getElementById('CRUXLUX_l');
  if (d) {
    d.style.display = 'block';
    d = document.getElementById('CRUXLUX_c');
    if (d) {
      d.style.display = 'block';
    }
  }
  */
  var d = document.getElementById('CRUXLUX_c');
  if (d) {
    d.style.display = 'block';
  }
}

function CL_dsm(w) {
  CL_sm(da_CL_links[w]);
}

function CL_back() {
  if (CL_hist > 0) {
    frames["CRUXLUX_ifn"].history.back();
    CL_hist-=2;
  } else {
    CL_closeup();
  }
}

function CL_sm(l) {
  var num = 0;
  var pos = 'fixed';
  var wh; //window height
  if (window.innerHeight) { // all except Explorer
    wh = window.innerHeight;
  } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
    wh = document.documentElement.clientHeight;
  } else if (document.body) { // other Explorers
    wh = document.body.clientHeight;
  } else {
    wh = 500;
  }
  var whi = wh - 75; //popup height
  var isIE = (navigator.appName=='Microsoft Internet Explorer');
  if (isIE && parseFloat((new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})")).exec(navigator.userAgent)[1]) >= 7 && document.compatMode == 'CSS1Compat') {
    isIE = 0; // IE7 in standards mode is pretty normal and supports fixed position
  }
  if (wh < 500 || isIE) {
    pos = 'absolute';
    num = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
    if (window.innerHeight && window.scrollMaxY) {  
      scrollh = window.innerHeight + window.scrollMaxY;
    } else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
      scrollh = document.body.scrollHeight;
    } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
      scrollh = document.body.offsetHeight;
    }
    if (whi < 360) {
      whi = 360;
    }
    if (scrollh > wh) {
      wh = scrollh;
    }
  }

  // Build Sandbox
  var sandbox = document.createElement('div');
  sandbox.setAttribute('id','CL_sandbox');
  sandbox.style.cssText = 'margin:0';
  document.body.appendChild(sandbox);
  
  var collapsed = document.createElement('div');
  collapsed.style.cssText = 'position:'+pos+';top:10px;right:0;z-index:2147483646;cursor:pointer';
  collapsed.innerHTML = "<div style='padding:0px' onclick='CL_restore()'><img src='http://assets.cruxlux.com/images/cruxlux_tab.v2.png'/></div>"
  sandbox.appendChild(collapsed);

  var gapper = document.createElement('iframe'); // to try to block Flash from showing through
  gapper.id = 'CRUXLUX_gp';
  gapper.style.cssText = 'position:'+pos+';visible:none;z-index:2147483645; right:0; width:487px; height:' + whi+ 'px; top:15px; background-color:#FFF';
  gapper.frameBorder = '0';
  gapper.scrolling = 'no';
  sandbox.appendChild(gapper);
  gapper.style.visible = 'block';
  /*
  var m_layer = document.createElement('div');
  m_layer.style.cssText = 'background-color:#CCCCCC; position:'+pos+'; opacity:0.8; -moz-opacity:0.8; filter:alpha(opacity=80); z-index:2147483646; width:100%; height:' + wh+ 'px; top:0; left:0';
  m_layer.id = 'CRUXLUX_l';
  CL_ae(m_layer,'click',function() {CL_closeup();});
  */


  var co = document.createElement('div');
  co.id = 'CRUXLUX_c';
  co.style.cssText = 'position:'+pos+'; top:'+(num)+'px; right:0; margin: 0; padding: 0; width:495px; z-index:2147483647; background-color:#ffffff; border-left:1px solid black; color: #111'; 

  var bg_table = document.createElement('div');
  bg_table.style.cssText = "position: absolute; left:0px; top:0px;"
  //bg_table.innerHTML = "<tr></tr>";
  bg_table.innerHTML = "<table><tr><td style='background: transparent url(http://assets.cruxlux.com/images/rnd.png) no-repeat scroll left top; width: 15px; height: 31px;'></td><td style='background: transparent url(http://assets.cruxlux.com/images/rnd_v.png) repeat-x scroll center top; width: 480px; height: 31px'></td> </tr> <tr> <td style='background: transparent url(http://assets.cruxlux.com/images/rnd_h.png) repeat-y scroll left center; width: 15px; height:" + whi + "px'></td> <td style='background: #fff; width: 480px'></td> </tr> <tr> <td style='background: transparent url(http://assets.cruxlux.com/images/rnd.png) repeat-y scroll left bottom; width: 15px; height:26px'></td> <td style='background: transparent url(http://assets.cruxlux.com/images/rnd_v.png) repeat-x scroll center bottom; width: 480px; height: 26px'></td></tr></table>"; 
  co.appendChild(bg_table);
  var cl = document.createElement('div');
  //cl.style.cssText = 'width:100%; margin:0; height: 24px; padding-right: 0px; color: #FFF;background: transparent url(http://assets.cruxlux.com/images/grey_vertical_gradient.gif) repeat-x scroll 0 0';
  cl.style.cssText = 'position: absolute; left: 15px; top: 7px; width: 480px; margin:0; height: 24px; padding-right: 0px; color: #FFF;';
  cl.innerHTML = "<div style='display: block; float:right; padding-top: 3px; padding-right: 3px; vertical-align:middle;height:24px; cursor: pointer;'><a style='cursor:pointer' href='javascript:CL_closeup()'><img style='display:block;cursor:pointer' src='http://assets.cruxlux.com/images/close_small.png' alt='Close'/></a></div> <img align='absmiddle' style='display:inline; float:left' src='http://assets.cruxlux.com/images/tiny_swords.png' alt=''/><div style='overflow:hidden;font-family:Verdana;font-size:15px;padding-top:3px;'>Cruxlux Connections</div>";
  co.appendChild(cl);
  cl.id = 'CRUXLUX_c1';
  CL_hist = -1;
  var ifr = document.createElement('iframe');
  ifr.id = 'CRUXLUX_if';
  //ifr.style.cssText= 'margin:0;padding:0; top: 31px; position: absolute';
  ifr.name = 'CRUXLUX_ifn';
  ifr.frameBorder = 0;
  ifr.marginheight = 0;
  ifr.marginwidth = 0;
  ifr.scrolling = 'no';
  CL_ae(ifr,'load',CL_sf);
  ifr.style.cssText = 'border: 0; width: 480px; background: #fff; clear:both; height:'+(whi)+'px; left: 13px; top: 31px; position: absolute;';// border-top:1px solid #000'; 
  //ifr.style.display = 'none';
  ifr.src = l;
  co.appendChild(ifr);
  var fo = document.createElement('div');
  fo.style.cssText = 'position: absolute; width:100%; margin:0; left: 13px; top:' + (whi + 28) + 'px;padding-top:2px';
  fo.innerHTML = (CL_subdomain=='embed' ? "<a style='color:#000;font-size:12px;font-family:Verdana' href='http://assets.cruxlux.com/' target='_blank'>Install the Bookmarklet</a>" : "<a style='color:#000;font-size:12px;font-family:Verdana' href='http://assets.cruxlux.com/widget_demo' target='_blank'>Embed the Widget on Your Site</a>");
  co.appendChild(fo);
  sandbox.appendChild(co);
}

function parse_selection(selection) {
  var snippets = [];
  selection = selection.replace(/["]/g,'').replace(/\.\.\./g,',').replace(/[\n]/g,' ');
  //console.log('Parsing Selection:' + selection);
  var sentences = []
  var words = selection.split(/\s+/);
  var cur_sentence = [];
  var ender = undefined;
  for(var i=0; i < words.length; i++) {
    var word = words[i];
    if((ender = sentence_ender(word)) != undefined) {
      cur_sentence.push(ender);
      sentences.push(cur_sentence.join(' '));
      cur_sentence = [];
    } else {
      cur_sentence.push(word);
    }
  }
  if (cur_sentence.length > 0) {
    sentences.push(cur_sentence.join(' '));
  }
  for(var i=0; i < sentences.length; i++) {
    var sentence = sentences[i];
    sentence = sentence.replace(/^[^a-zA-Z0-9']+/,'').replace(/\s+$/,'').replace(/[\[\]]/g,'');
    //console.log("Parsing Sentence:'" + sentence + "'");
    //parse_sentence(tuple_freq_map,ngrams,sentence);
  }
  return CL_safe_encodeURIComponent(selection);
}

function CL_rf(s) {
  var ifr = document.getElementById('CRUXLUX_if');
  ifr.src = s;
}

function CL_sf() {
  CL_hist++;
}

function CL_ae(obj, evType, fn) {
  if (obj.addEventListener) {
    obj.addEventListener(evType, fn, false);
    return true;
  }
  else if (obj.attachEvent){
    var r = obj.attachEvent("on"+evType, fn);
    return r;
  }
  else {
    return false;
  }
}

CL_v_tuples_str = null;
CL_v_tuples_str_from_full = null;
function CL_doit(content_dom,selected) {   
  CL_destroy();
  //var u = escape(window.location.hostname).replace(/\\+/g,'%2b');    
  var cl_head = document.getElementsByTagName('head')[0];
  var rc_host = 'http://'+CL_subdomain+'.cruxlux.com/rc/';

  // Hacky style injection!
  var cl_style = document.createElement("style");
  var style_string = "#CL_sandbox,#CL_sandbox ABBR,#CL_sandbox ACRONYM,#CL_sandbox ADDRESS,#CL_sandbox B,#CL_sandbox BIG,#CL_sandbox BLOCKQUOTE,#CL_sandbox CAPTION,#CL_sandbox CENTER,#CL_sandbox CITE,#CL_sandbox CODE,#CL_sandbox DD,#CL_sandbox DIV,#CL_sandbox DL,#CL_sandbox DT,#CL_sandbox EM,#CL_sandbox EMBED,#CL_sandbox FONT,#CL_sandbox FORM,#CL_sandbox H1,#CL_sandbox H2,#CL_sandbox H3,#CL_sandbox H4,#CL_sandbox H5,#CL_sandbox H6,#CL_sandbox I,#CL_sandbox IFRAME,#CL_sandbox IMG,#CL_sandbox LABEL,#CL_sandbox LEGEND,#CL_sandbox LI,#CL_sandbox MAP,#CL_sandbox OBJECT,#CL_sandbox OL,#CL_sandbox P,#CL_sandbox PRE,#CL_sandbox SMALL,#CL_sandbox SPAN,#CL_sandbox STRIKE,#CL_sandbox STRONG,#CL_sandbox SUB,#CL_sandbox SUP,#CL_sandbox TABLE,#CL_sandbox TBODY,#CL_sandbox TD,#CL_sandbox TFOOT,#CL_sandbox TH,#CL_sandbox THEAD,#CL_sandbox TR,#CL_sandbox TT,#CL_sandbox U,#CL_sandbox UL,#CL_sandbox a,#CL_sandbox a:link,#CL_sandbox a:hover,#CL_sandbox a:visited,#CL_sandbox a:active{border:0px;background:transparent none;color:black;padding:0px;text-align:left;font:normal medium serif}div#CL_sandbox,#CL_sandbox DIV,#CL_sandbox TABLE,#CL_sandbox TR,#CL_sandbox TH,#CL_sandbox TD{height:auto;width:auto; }#CL_sandbox,#CL_sandbox *{border-collapse:collapse;margin:0px;font:normal normal normal 12px/normal;text-transform:none;text-decoration:none;clear:none;cursor:auto;float:none;outline:none;letter-spacing:normal;word-spacing:normal;text-indent:0px;white-space:normal;vertical-align:baseline}#CL_sandbox TD{vertical-align:bottom}#CL_sandbox span,#CL_sandbox img{display:inline}#CL_sandbox p,#CL_sandbox div{display:block}#CL_sandbox ul,#CL_sandbox ol{padding-left:20px}#CL_sandbox a,#CL_sandbox a:link,#CL_sandbox a:hover,#CL_sandbox a:visited,#CL_sandbox a:active{display:inline;color:blue;text-decoration:underline;cursor:pointer}#CL_sandbox a:visited{color:purple}#CL_sandbox a:active{color:red}#CL_sandbox input{width:auto;border:0px;background:transparent none} .CL_marked { background-color: #feffb4; } .CL_img { float: none; border: 0; display: inline;}";
  cl_style.type = "text/css";
  if (cl_style.styleSheet) {
    cl_style.styleSheet.cssText = style_string;
  } else {
    cl_style.appendChild(document.createTextNode(style_string));
  }
  cl_head.appendChild(cl_style);

  var selected_text = null;
  if (CL_subdomain == 'embed') {
    if (!CL_v_tuples_str) { //hasn't been cached earlier for collage
      var tuples = representative_tuples(content_dom);
      CL_v_tuples_str = CL_safe_encodeURIComponent(tuples.join('|'));
    }
  } else {
    if (!selected) {
      selected_text = get_selected_text();
    }
    if (selected_text && selected_text.length > 0) {
      CL_v_tuples_str = parse_selection(selected_text);
    } else if (is_defined("CL_override_keywords")) {
      selected_text = null;
      CL_v_tuples_str = CL_override_keywords.join("|");
    } else {
      if (!CL_v_tuples_str_from_full) { //hasn't been cached earlier for collage 
        var tuples = representative_tuples(content_dom);
        //highlight_tuples(tuples);
        CL_v_tuples_str_from_full = CL_safe_encodeURIComponent(tuples.join('|'));
      }
      CL_v_tuples_str = CL_v_tuples_str_from_full;
    }
  }

  var url = window.location.hostname;
  if (is_defined("CL_url")) {
    url = CL_url;
  }
  
  var related_link = rc_host + "authenticate?url=" + url + "&tuples="+CL_v_tuples_str;
  if (selected) { related_link += "&sel="+CL_safe_encodeURIComponent(selected); }
  if (CL_subdomain=='button' && selected_text != null) { related_link += "&hl="+selected_text.length; }
  var inbox_link = rc_host + "inbox?id=0&tuples="+CL_v_tuples_str;
  //console.log('Related:' + related_link);

  da_CL_links = new Array();
  da_CL_links['inbox'] = inbox_link.substr(0,2048);
  da_CL_links['related'] = related_link.substr(0,2048);
  CL_dsm("related");
}

function CL_safe_encodeURIComponent(str) {
  var enc = new String(encodeURIComponent(str));
  var st = 0;
  var ok_codes = [];
  while (1) {
    if (st > enc.length-3) { break; }
    var perc_ind = enc.indexOf('%', st);
    if (perc_ind < 0) { break; }
    var code = enc.substr(perc_ind, 3);
    try {
      if (!ok_codes[code]) {
        var dec = decodeURI(code);
        ok_codes[code] = 1;
      }
    } catch (e) {
      if (e instanceof URIError) {
        var r = new RegExp(code, 'g');
        enc = enc.replace(r, '%20');
      }
    }
    st = perc_ind + 3;
  }
  return enc;
}

function CL_embed_widget()
{
  if (CL_is_embedded) 
    return;
  CL_is_embedded = true;
  var tuples = [];
  if (is_defined("CL_override_keywords")) {
    tuples = CL_override_keywords;
    CL_v_tuples_str = CL_override_keywords.join("|");
  } else {
    tuples = representative_tuples(document);
    CL_v_tuples_str = CL_safe_encodeURIComponent(tuples.join('|'));
  }
  var pd = document.getElementById('CRUXLUX_ISH');
  var nd = document.createElement('div');
  nd.style.cssText = 'position:relative';
  pd.parentNode.insertBefore(nd, pd); // nd is where my stuff goes
  var lnk = 'http://www.cruxlux.com/rc/square?tuples='+CL_v_tuples_str;
  var dim_w = parseInt(pd.parentNode.offsetWidth);
  if (dim_w > 300) {
    dim_w = '300px'; 
  }
  else {
    dim_w = '100%';
  }
  var cd = document.createElement('div');
  cd.style.cssText = 'font-size:13px;width:'+dim_w+';text-align:center;z-index:2';
  cd.innerHTML = "<a href='javascript:CL_doit(document)'>Further explore the topics on this page, see what others are saying, and more...</a>";
  nd.appendChild(cd);
  var h = cd.offsetHeight + 80;
  nd.style.height = h+'px';
  cd.style.cssText += ';position:absolute;left:0;top:40px';
  var ifr = document.createElement('iframe');
  ifr.style.cssText = 'top:0;left:0;position:absolute;width:'+dim_w+';height:'+h+'px';
  ifr.scrolling = 'no';
  ifr.frameBorder = '0';
  ifr.src = lnk.substr(0,2048);
  nd.appendChild(ifr);
}

function setup_embed_callbacks()
{
  CL_is_embedded = false;
  CL_ready = false;
	if ( document.addEventListener ) {
		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", function(){
			document.removeEventListener( "DOMContentLoaded",arguments.callee, false );
      CL_ready = true;
      CL_embed_widget();
		}, false );

	// If IE event model is used
	} else if ( document.attachEvent ) {
		// ensure firing before onload,
		// maybe late but safe also for iframes
		document.attachEvent("onreadystatechange", function(){
			if ( document.readyState === "complete" ) {
				document.detachEvent( "onreadystatechange",arguments.callee);
        CL_ready = true;
        CL_embed_widget();
			}
		});

		// If IE and not an iframe
		// continually check to see if the document is ready
		if ( document.documentElement.doScroll) (function(){
      //alert('Here');
			if (CL_ready) return;

			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch( error ) {
				setTimeout( arguments.callee, 10);
				return;
			}

      CL_ready = true;
      CL_embed_widget();
		})();
	}
  CL_ae(window,'load',CL_embed_widget);
}

function set_resolved_tuples_and_do(content_dom) {
  var tuples = representative_tuples(content_dom);
  CL_v_tuples_str = CL_safe_encodeURIComponent(tuples.join('|'));
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.id = 'CL_sc_2_hi';
  s.src = "http://www.cruxlux.com/rc/resolve?tuples="+CL_v_tuples_str+"/>";
  document.getElementsByTagName('body')[0].appendChild(s);
}

(function() {
  if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
      for(var i=0; i<this.length; i++){
        if(this[i]==obj){
            return i;
        }
      }
      return -1;
    }
  }
  if (window.CL_dom != undefined) {
    CL_subdomain = 'button';
    if (document.getElementById('CL_sc_2_hi')) {
      CL_doit(CL_dom);
    } else {
      set_resolved_tuples_and_do(CL_dom);
    }
  } else {
    CL_subdomain = 'embed';
    setup_embed_callbacks();
  }
})();

