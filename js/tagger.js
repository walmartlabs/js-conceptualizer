/*
 * The Tagger takes in zoned text and returns back the useful tags to send up
 * to the server.
 */
var ConceptualizerEverywhereTagger = function() {

  /* 
   * If the word ends in a comma, then we consider that a tuple ender.  There
   * can probably be more of these in the future
   */
  function concept_ender(word)
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
   * This function we pass in a word to see if it should be a sentence ender.
   * Essentially if it is an acronym we say no.
   */
  var sentence_ender = function(word) {
    var period_count = 0;
    var length = word.length;
    for(var i=0; i < length; i++) {
      var ch = word.charCodeAt(i);
      if (ch == 46) {
        period_count++;
      }
    }


    // Special casing of certain phrases with periods that mess up sentence enders
    if (word == 'Mrs.' || word == 'Mr.')
      return undefined;

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
  };

  /*
   * This takes in a big chunk of text and tries to give back an array of
   * sentence strings, since those are a reasonable division of labor for the
   * tagging.
   */
  var document_to_sentences = function(text) {
    var sentences = [];
    var words = text.split(/\s+/);
    var cur_sentence = [];
    for(var i=0; i < words.length; i++) {
      var word = words[i];
      if((ender = sentence_ender(word)) != undefined) {
        cur_sentence.push(ender);
        EverywhereLogger.log('Pushing Sentence:' + JSON.stringify(cur_sentence));
        sentences.push(cur_sentence);
        cur_sentence = [];
      } else {
        cur_sentence.push(word);
      }
    }
    if (cur_sentence.length > 0) {
      sentences.push(cur_sentence);
    }
    return sentences;
  }

  var sentences_to_tags = function(sentences) {
    var tuple_list = [];
    var tuple = [];
    for(var i=0; i < sentences.length; i++) {
      EverywhereLogger.log("Working on Sentence:" + JSON.stringify(sentences[i]));
      var words = sentences[i];
      if (words.length < 4) {
        EverywhereLogger.log('Bailing out of Short Sentence');
        continue;
      }

      // We start at 1 because using the beginning of the sentence introduces
      // too much noise
      for(var j=1; j < words.length; j++) {
        var word = words[j];
        var word_look_ahead = words[j+1];
        var first_char = word.charCodeAt(0);
        var look_ahead_first_char = 0;
        if (word_look_ahead) {
          look_ahead_first_char = word_look_ahead.charCodeAt(0);
        }
        if ((first_char > 64 && first_char < 91) || first_char == 38 || (word == 'of' && tuple.length > 0 && look_ahead_first_char < 91 && look_ahead_first_char > 64)) {
          word = word.replace(/[\u2019']s/g,'');
          var last_of_tuple = concept_ender(word);
          if (last_of_tuple) {
            tuple.push(last_of_tuple);
            tuple_list.push(tuple);
            tuple = [];
          } else {
            tuple.push(word);
          }
        } else {
          if (tuple.length > 0) {
            tuple_list.push(tuple);
          }
          tuple = [];
        }
      }
      if (tuple.length > 0) {
        tuple_list.push(tuple);
      }
    }

    var tuple_map = {};
    var last_name_map = {};

    // This block puts each tuple str into a map (so it uniquifies it), but it
    // also does some fun with regards to last names.  For example, if we see
    // Steve Jobs somewhere in an article, then we see Jobs later, it will use
    // antecedent reference.
    for(var i=0; i < tuple_list.length; i++) {
      var tuple = tuple_list[i];
      var tuple_str = tuple.join(" ");
      var tuple_len = tuple.length;
      tuple_map[tuple_str] = 1;
      if (tuple_len > 1) {
        last_name_map[tuple[tuple_len-1]] = tuple_str;
      }
    }

    var tags = [];
    // Filter for last names
    for(var tuple_str in tuple_map) {
      var full_tuple_str = last_name_map[tuple_str];
      if (!full_tuple_str) {
        tags.push(tuple_str);
      }
    }
    return tags;
  };

  return {
    /*
     * This function takes some zoned text and returns back an array of
     * snippets that it thinks are reasonable tuples (mainly via capitalization
     * and sentence location) 
     */
    tag: function(win,zoned_text) {
      EverywhereLogger.bench_start('ConceptualizerEverywhereTagger.tag');

      var sentences = document_to_sentences(zoned_text);
      var tags = sentences_to_tags(sentences);

      EverywhereLogger.bench_finish('ConceptualizerEverywhereTagger.tag');
      return tags;
    }
  }
}();
