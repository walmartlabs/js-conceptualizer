var ConceptualizerEverywhereTransport = function() {
  var CONCEPT_EVENT = "ConceptualizerEverywhereConceptEvent";
  var CONCEPT_EVENT_ELEM = CONCEPT_EVENT + "Elem";
  var CONCEPT_EVENT_CALLBACK = CONCEPT_EVENT + "Callback";
  return {
    concepts: function(dom,tags) {
      EverywhereLogger.log('Getting Concepts for: ' + tags);
      var eventElem = document.createElement(CONCEPT_EVENT);
      eventElem.setAttribute('tags',tags.join('|'));
      eventElem.setAttribute('url',dom.location.href);
      eventElem.setAttribute('title',dom.title);
      eventElem.setAttribute('sver', ConceptualizerEverywhereVersion);
      document.documentElement.appendChild(eventElem);
      eventElem.addEventListener(CONCEPT_EVENT_CALLBACK,function(event) {
        var tgt = event.target;
        var res = tgt.getAttribute('result');
        EverywhereLogger.log('Retrieved Payload from CONCEPT_EVENT:' + res);
        try { 
          var parsedRes = JSON.parse(res);
          EverywhereLogger.log('Calling Render from Concept Event Callback');
          EverywhereLogger.log(parsedRes.payload);
          EverywhereLogger.log("Blocks");
          EverywhereLogger.log(ConceptualizerEverywhereZoner.blocks);
          EverywhereRenderer.render(document,parsedRes.payload,ConceptualizerEverywhereZoner.blocks);
        } catch (ex) {
        }
      },false);

      var ev = document.createEvent("Events");
      ev.initEvent(CONCEPT_EVENT,true,false);
      eventElem.dispatchEvent(ev);
      EverywhereLogger.log('Done Dispatching CONCEPT_EVENT');
    }
  }
}();
