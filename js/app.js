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
    }
}

function REGISTER_MODULE(name, class_name)
{
    var module = app.modules[name];

    if(!module) {
        app[name] = app.modules[name] = new class_name();
    }
}

function getUid( large ){
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+ (large ? "-"+S4()+"-"+S4()+"-"+S4() : "") );
}