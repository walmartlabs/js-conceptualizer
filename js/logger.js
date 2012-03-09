var EverywhereLogger = function() {
  var BENCH = [];

  return {
    log: function(args) {
      if (typeof(console) != 'undefined') {
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
