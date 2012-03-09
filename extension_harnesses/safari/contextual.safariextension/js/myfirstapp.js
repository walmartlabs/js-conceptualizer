/*
 * This is a "Hello World" application for doing contextual apps in the Conceptualizer
 * Contextual Platform 
 *
 * onResolve is a method that you can listen to that will
 * give you back the concepts Conceptualizer finds on the page you are reading
 */
ConceptualizerHarness.onResolve(function(concepts) {
  var emblems = [];
  for(var i=0; i < concepts.length; i++) {
    emblems.push({
      match: concepts[i].concept,
      icon: 'http://local.kiva.com:8888/kiva.png', 
      concept: concepts[i],
      hover: function(emblem) {
        ConceptualizerHarness.popup('myfirstapp', emblem, 'Title for ' + emblem.match, function(content) {

        });
      }
    });
  }

  ConceptualizerHarness.render(emblems);
});
