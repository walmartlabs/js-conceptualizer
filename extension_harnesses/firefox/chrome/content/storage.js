EverywhereLogger.log("storage 1");

var ExtensionStorage = function() {
  var getLocalDirectory  = function() {
    let directoryService =
      Cc["@mozilla.org/file/directory_service;1"].
        getService(Ci.nsIProperties);
    // this is a reference to the profile dir (ProfD) now.
    let localDir = directoryService.get("ProfD", Ci.nsIFile);

    localDir.append("Contextual");

    if (!localDir.exists() || !localDir.isDirectory()) {
      // read and write permissions to owner and group, read-only for others.
      localDir.create(Ci.nsIFile.DIRECTORY_TYPE, 0774);
    }

    return localDir;
  };

  EverywhereLogger.log("storage 2");

  var getExtensionStorageObject = function(filename) {
    let myFile = getLocalDirectory();
    myFile.append(filename);

    var data = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Components.interfaces.nsIFileInputStream);
    var cstream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].
                  createInstance(Components.interfaces.nsIConverterInputStream);

    var data_obj = {};
    try {
      fstream.init(myFile, -1, 0, 0);
      cstream.init(fstream, "UTF-8", 0, 0); // you can use another encoding here if you wish

      let (str = {}) {
        let read = 0;
        do {
          read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
          data += str.value;
        } while (read != 0);
      }
      cstream.close(); // this closes fstream

      data_obj = JSON.parse(data);
    } catch(e) {

    }

    return data_obj;
  };

  var write_internal = function(key, value, filename) {
    let myFile = getLocalDirectory();
    myFile.append(filename);

    data_obj = getExtensionStorageObject(filename);
    data_obj[key] = value;

    // file is nsIFile, data is a string
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].
                   createInstance(Components.interfaces.nsIFileOutputStream);

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(myFile, 0x02 | 0x08 | 0x20, 0666, 0);
    // write, create, truncate
    // In a c file operation, we have no need to set file mode with or operation,
    // directly using "r" or "w" usually.

    // if you are sure there will never ever be any non-ascii text in data you can
    // also call foStream.writeData directly
    var converter = Components.classes["@mozilla.org/intl/converter-output-stream;1"].
                    createInstance(Components.interfaces.nsIConverterOutputStream);
    converter.init(foStream, "UTF-8", 0, 0);
    converter.writeString(JSON.stringify(data_obj));
    converter.close();
  };

  EverywhereLogger.log("storage 3");

  EverywhereLogger.log("Before returning the ExtensionStorage object");

  return {
     write: function(key, value) {
       write_internal(key, value, "extension_data.txt");
     },

     read: function(key) {
       data_obj = getExtensionStorageObject("extension_data.txt");
       return data_obj[key];
     },

     read_remembered: function(key) {
       data_obj = getExtensionStorageObject("remembered_data.txt");
       EverywhereLogger.log("read_remembered data_obj");
       EverywhereLogger.log(data_obj);

       return data_obj[key];
     },

     write_remembered: function(key, value) {
       // append mode
       var last_value = ExtensionStorage.read_remembered(key);

       if(!last_value) {
         last_value = [];
       }

       last_value.push(value);
       write_internal(key, last_value, "remembered_data.txt");
     }

  };
}();


