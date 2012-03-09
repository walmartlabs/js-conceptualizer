var ConceptualizerEverywhereInit = function() {
  EverywhereLogger.log('Version: 1.1 Initing');

  var blocks = ConceptualizerEverywhereZoner.zone(document.location.href,document);
  var text = ConceptualizerEverywhereZoner.text_from_blocks(ConceptualizerEverywhereZoner.blocks);
  var tags = ConceptualizerEverywhereTagger.tag(window,text);
  ConceptualizerEverywhereTransport.concepts(document,tags);

  EverywhereLogger.log('Version: 1.1 Complete');
}();
