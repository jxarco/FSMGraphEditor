/*
*   Alex Rodriguez
*   @jxarco 
*/

var app = {
    
    modules: {},

    begin() {

        // dont manage online mode yet
        this.init();
        return;

        var that = this;
        var online = (document.location.href.substr(0, 4) == "http");

        if(!online) {
            this.init();
            return;
        }

        LiteGUI.requestJSON("data/fsm.json", function(data){
            
            console.log(data);

            if(data.state_types)
                LStateTypes = data.state_types;
            
            that.init();
        });
    },

    init: function()
    {
        // init gui so each module has gui info at start
        Interface.init();

        // once here, modules are already registered
        for(var m in this.modules) {
            var module = this.modules[m];
            if(module.create) module.create();
        }

        for(var m in this.modules) {
            var module = this.modules[m];
            if(module.init) module.init();
        }

        // all modules loaded and instanced
        Interface.postInit();

        var graphModule = app["graph"];
        window.onresize = graphModule.resize.bind(graphModule);

        document.addEventListener("keydown", function(e){

            // keycode is depracated but support it anyway
            if(e.key == "s" || e.keyCode == 83)
            {
                if(!e.ctrlKey)
                return;

                e.preventDefault();
                e.stopPropagation();

                var drive = app["drive"];

                if(!drive)
                return;

                var exportFsm = !e.shiftKey;

                var selectedFilename = drive.lastFileLoaded ? drive.lastFileLoaded.split(".").shift() : "unnamed";
                var extension = exportFsm ? ".fsm" : ".fsmgraph";
                drive.exportFile(selectedFilename + extension, exportFsm);
            }
        });
    }
}

function REGISTER_MODULE(name, class_name)
{
    var module = app.modules[name];

    if(!module) {
        app[name] = app.modules[name] = new class_name();
    }
}
