var ConceptualizerDeveloper = function() {
  return {
    bespin_env: null,
    editor: null,
    current_filename: null,
    init: function() {
      var developer = (localStorage.hasOwnProperty('developer')) ? JSON.parse(localStorage['developer']) : null;
      if (!developer) {
        // Initialize the filesystem
        developer = {};
        developer.files = {};
        ConceptualizerDeveloper.loadFileFromURI('js/myfirstapp.js', function(res) {
          var file = {filename: 'hello_world.js', content: res.body};
          developer.files['hello_world.js'] = file;
          developer.current_filename = 'hello_world.js';
          localStorage['developer'] = JSON.stringify(developer);
          ConceptualizerDeveloper.current_filename = developer.current_filename;
          ConceptualizerDeveloper.initializeEditor(res.body);
        });
      } else {
        if (developer.current_filename) {
          var content = "";
          var file = developer.files[developer.current_filename];
          if (file) {
            content = file.content;
            ConceptualizerDeveloper.current_filename = file.filename;
          }
          ConceptualizerDeveloper.initializeEditor(content);
        } else {
          ConceptualizerDeveloper.initializeEditor("");
        }
      }
    },

    initializeEditor: function(content) {
      bespin.useBespin('editor', {stealFocus: true, syntax: "js"}).then(function(env) {
        var editor = env.editor;
        env.settings.set('tabstop',2);
        ConceptualizerDeveloper.bespin_env = env;
        ConceptualizerDeveloper.editor = env.editor
        ConceptualizerDeveloper.editor.value = content;
      }, function(error) {
        throw new Error("Launch Failed:", + error);
      });
    },

    loadFileFromURI: function(filename,callback) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          var res = new Object();
          res.status = req.status;
          res.body = req.responseText;
          callback(res);
        } 
      };
      req.open("GET",filename, true);
      req.send(null);
    },

    getFileFromFS: function(developer,filename) {
      console.log('Calling fileExists');
      if (developer && developer.files) {
        var file = developer.files[filename];
        return file;
      }
      return null;
    },

    enabledFiles: function() {
      var files = ConceptualizerDeveloper.files();
      var enabledFiles = [];
      for(var i=0; i < files.length; i++) {
        if (files[i].enabled) {
          enabledFiles.push(files[i]);
        }
      }
      return enabledFiles;
    },

    newFile: function(filename) {
      console.log('Called newfile');
      if (filename && filename.length > 0) {
        developer = localStorage['developer'];
        if (developer) {
          developer = JSON.parse(developer);
          var existingFile = null;
          if (existingFile = ConceptualizerDeveloper.getFileFromFS(developer,filename)) {
            throw new Error(filename + " already exists.  Either <b>rm</b> it or pick a new filename");
          }
          if (!developer.files) {
            developer.files = {};
          }
        } else {
          developer = {};
          developer.files = {};
        }
        developer.files[filename] = {filename: filename,content: "", enabled: false}
        ConceptualizerDeveloper.editor.value = "";
        ConceptualizerDeveloper.current_filename = filename;
        developer.current_filename = filename;
        localStorage['developer'] = JSON.stringify(developer);
      } else {
        throw new Error('Please specify a filename');
      }
    },
    
    /* Load a file from the fake filesystem */
    load: function(filename) {
      console.log('Calling Load');
      if (filename) {
        var developer = localStorage['developer'];
        var file = null;
        if (developer) {
          developer = JSON.parse(developer);
          if (!developer.files) {
            throw new Error('No files to load yet, use the <b>new</b> command to create a file');
          } else {
            var file = developer.files[filename];
            if (file) {
              ConceptualizerDeveloper.current_filename = file.filename;
              developer.current_filename = file.filename;
              ConceptualizerDeveloper.editor.value = file.content;
            } else {
              throw new Error('No files found by that filename');
            }
          }
        } else {
          throw new Error('No files to load yet, use the <b>new</b> command to create a file');
        }
      } else {
        throw new Error('Please specify a filename');
      }
    },

    enable: function(filename) {
      var developer = (localStorage.hasOwnProperty('developer')) ? JSON.parse(localStorage['developer']) : null;
      if (developer && developer.files) {
        var file = developer.files[filename];
        if (file) {
          file.enabled = true;
          localStorage['developer'] = JSON.stringify(developer);
          return;
        }
      }
      throw new Error('Please specify a valid filename to enable');
    },

    cp: function(source,destination) {
      if (!source || !destination) {
        throw new ('cp usage: cp <source_file> <destination_file>');
      }

      var developer = (localStorage.hasOwnProperty('developer')) ? JSON.parse(localStorage['developer']) : null;
      if (developer) {
        var source_file = developer.files[source];
        if (source_file) {
          if (source == destination) {
            throw new Error('Source and Destination are the same file. No operation');
          }

          var dest_file = {filename: destination, content: source_file.content}
          developer.files[destination] = dest_file;
          localStorage['developer'] = JSON.stringify(developer);
          return "";
        } else {
          throw new Error('Source file does not exist');
        }
      } 
      throw new Error('No files to copy');
    },

    disable: function(filename) {
      var developer = (localStorage.hasOwnProperty('developer')) ? JSON.parse(localStorage['developer']) : null;
      if (developer && developer.files) {
        var file = developer.files[filename];
        if (file) {
          file.enabled = false;
          localStorage['developer'] = JSON.stringify(developer);
          return;
        }
      }
      throw new Error('Please specify a valid filename to disable');
    },

    files: function() {
      developer = localStorage['developer'];
      var files = []
      if (developer) {
        developer = JSON.parse(developer);
        if (developer.files) {
          for (var filename in developer.files) {
            files.push(developer.files[filename]);
          }
        }
      }
      return files;
    },

    filenames: function() {
      developer = localStorage['developer'];
      var filenames = []
      if (developer) {
        developer = JSON.parse(developer);
        if (developer.files) {
          for (var filename in developer.files) {
            filenames.push(filename);
          }
        }
      }
      return filenames;
    },

    ls: function() {
      console.log('Calling ls');
      var html = document.createElement('div');
      var files = ConceptualizerDeveloper.files();
      for(var i=0; i < files.length; i++) {
        var p = document.createElement('p');
        if (files[i].enabled) {
          p.innerHTML = "[<span style='font-weight:bold;color:#00FF00'>&times;</span>] " + files[i].filename;
        } else {
          p.innerHTML = '[ ] ' + files[i].filename;
        }
        html.appendChild(p);
      }
      console.log(html);
      return html.innerHTML;
    },

    save: function(filename) {
      console.log("Calling Save");
      if (filename && filename.length > 0) {
        var content = this.editor.value;
        var developer = localStorage['developer'];
        if (developer) {
          developer = JSON.parse(developer);
          if (!developer.files) {
            developer.files = {};
          }
        } else {
          developer = {}
          developer.files = {};
        }
        var file = developer.files[filename];
        if (file) {
          file.content = content;
        } else {
          file = {filename:filename, content: content, enabled: false}
        }
        developer.files[filename] = file;
        localStorage['developer'] = JSON.stringify(developer);
      } else {
        if (ConceptualizerDeveloper.current_filename) {
          ConceptualizerDeveloper.save(ConceptualizerDeveloper.current_filename);
        } else {
          throw new Error('Please specify a filename or load a file first');
        }
      }
    },

    rm: function(filename) {
      console.log('Calling rm');
      if (filename) {
        var developer = localStorage['developer'];
        var file = null;
        if (developer) {
          developer = JSON.parse(developer);
          if (!developer.files) {
            throw new Error('No files to rm yet, use the <b>new</b> command to create a file');
          } else {
            delete developer.files[filename];
            if (developer.current_filename == filename) {
              developer.current_filename = null;
              ConceptualizerDeveloper.current_filename = null;
            }
            localStorage['developer'] = JSON.stringify(developer);
          }
        } else {
          throw new Error('No files to rm yet, use the <b>new</b> command to create a file');
        }
      } else {
        throw new Error('Please specify a filename');
      }
    }
  }
}();
