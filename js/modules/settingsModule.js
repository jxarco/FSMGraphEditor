/*
*   Alex Rodriguez
*   @jxarco 
*/

class SettingsModule {

    constructor() {

        // graph canvas
        this.onlyAutoConnect            = true;
        this.render_connection_arrows   = true;
        this.render_link_name           = false;
        this.render_link_tooltip        = true;
        this.autocreate_node            = true;
        this.links_render_mode          = LiteGraph.SPLINE_LINK;

        // states
        // ...

        // exporter
        this.listVarTypes = ["int", "float", "bool", "string"]; //"Array"

        this.icon = "https://webglstudio.org/latest/imgs/tabicon-debug.png";
    }

    create() {

        var that = this;

        this.tab = LiteGUI.main_tabs.addTab( "Settings", {id:"settingstab", bigicon: this.icon, size: "full", content:"", 
			callback: function(tab_id) {

                temp_div.appendChild(  document.getElementById("mycanvas") );
                app.graph.resize();
            },
			callback_leave: function(tab_id) {}
		});

        window.settings = that = this;
        var area = Interface.settings_area;

        // split settings area
        area.split("horizontal",["40%",null]);

        var widgets = this.widgets = area.widgets = new LiteGUI.Inspector();
        widgets.root.style.padding = "12px";
        area.sections[0].add(widgets);

        var temp_div = this.sett_graph_area = document.createElement("div");
        temp_div.style.height = "100%";
        temp_div.style.width = "100%";
        temp_div.style.background = "rgb(34, 34, 34)";

        area.sections[1].add(temp_div);
        this.tab.add( area );
    }

    init() {

        if(app["graph"])
        app["graph"].resize();

        this.createSettingsUI();
    }

    refresh() {
        if(this.widgets)
            this.widgets.on_refresh();

        this.apply();
    }

    createSettingsUI() {

        var widgets = this.widgets, that = this;

        widgets.on_refresh = (function() {

            widgets.clear();

            that.createGraphSettings();
            that.createStateSettigs();
            that.createTransitionSettigs();

        }).bind(this);

        widgets.on_refresh();
    }

    createGraphSettings() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("Graph settings");
        widgets.addSeparator();
        widgets.widgets_per_row = 2;
        // widgets.addCheckbox("Autoconnect only", this.onlyAutoConnect, {name_width: "80%", callback: function(v){ that.onlyAutoConnect = v; that.apply(); }})
        widgets.addCheckbox("Connection names", this.render_link_name, {name_width: "80%", callback: function(v){ that.render_link_name = v; that.apply(); }})
        widgets.addCheckbox("Autocreate on drag", this.autocreate_node, {name_width: "80%", callback: function(v){ that.autocreate_node = v; that.apply(); }})
        widgets.addCheckbox("Connection arrows", this.render_connection_arrows, {name_width: "80%", callback: function(v){ that.render_connection_arrows = v; that.apply(); }})
        widgets.addCheckbox("Connection tooltip", this.render_link_tooltip, {name_width: "80%", callback: function(v){ that.render_link_tooltip = v; that.apply(); }})

        var values = [ "STRAIGHT", "LINEAR", "SPLINE"];
        widgets.addCombo("Connections as", values[this.links_render_mode], {values: values, name_width: "50%", callback: function(v){ 
            v = values.indexOf(v);
            that.links_render_mode = v > -1 ? v : LiteGraph.SPLINE_LINK; 
            if(v == 0) {
                that.render_connection_arrows = false;
            }else {
                that.render_connection_arrows = true;
            }
            widgets.on_refresh();
            that.apply(); 
        }});
        widgets.widgets_per_row = 1;
        widgets.addSpace(7);
    }

    createStateSettigs() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("States");
        widgets.addSeparator();

        this.createSet(LStateTypes, LStateProperties);        
        widgets.addSpace(7);
    }

    createTransitionSettigs() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("Transitions");
        widgets.addSeparator();

        this.createSet(LTransitionTypes, LTransitionProperties, true);
    }

    createSet(types_list, properties_list, is_transition) {
        
        var widgets = this.widgets, that = this;

        // types
        widgets.widgets_per_row = 2;
        var newType = "";
        var addTypeWidget = widgets.addString(null, "", {placeHolder: "Add new type", width: "80%", name_width: "30%", callback: function(v){ 
            newType = v;
        }});

        function registerType() {
            if(newType.length) {
                newType = newType.toLowerCase();
                const index = types_list.indexOf(newType);
                if(index > 0) return;
                types_list.push( newType );
                newType = "";
                widgets.on_refresh();
                if(!is_transition)
                    Interface.onInspectNode(app["graph"].canvas.current_node);
                else
                    Interface.showTransitions(null, true);
            }
        }

        widgets.addButton(null, "Add", {width: "20%", callback: function(v){ 
            registerType();
        }})

        // hacky to get input of element
        addTypeWidget.lastElementChild.lastElementChild.lastElementChild.addEventListener("keyup", function(e){
            if(e.keyCode === 13) {
                e.stopPropagation(); registerType();
            }
        });
        
        widgets.widgets_per_row = 1;
        var selectedRegisteredType = null;
        var list = widgets.addList("Registered types (" + types_list.length + ")", types_list, {name_width: "60.5%", height: 90, callback: function(v){
            selectedRegisteredType = v;
        }});
        
        list.addEventListener("contextmenu", function(e){

            e.preventDefault();
            if(!selectedRegisteredType) return;

            new LiteGraph.ContextMenu( [
                {title: selectedRegisteredType, disabled: true}, null,
                {title: "Delete", callback: function(){
                    // delete from list
                    const index = types_list.indexOf(selectedRegisteredType);
                    if(index > 0) types_list.splice(index, 1);

                    // delete from everyone who has it
                    if(!is_transition) {
                        for(var i in FSMState.All) {
                            var s = FSMState.All[i];
                            if(s.properties.type == selectedRegisteredType) s.properties.type = "";
                        }
                    }else {
                        for(var i in FSMTransition.All) {
                            var t = FSMTransition.All[i];
                            if(t.properties.type == selectedRegisteredType) t.properties.type = "";
                        }
                    }

                    widgets.on_refresh();
                    if(!is_transition)
                        Interface.onInspectNode(app["graph"].canvas.current_node);
                    else
                        Interface.showTransitions(null, true);
                }}
            ], { event: e});
        });

        widgets.addSeparator();
        // properties

        var propertiesRegistered = Object.keys(properties_list);
        var regInfo = widgets.addInfo(null, "Registered properties (" + propertiesRegistered.length + ")");
        regInfo.style.fontWeight = "bold";
        widgets.addSpace(7);

        widgets.widgets_per_row = 3;
        var newProperty = "";
        var addPropertyWidget = widgets.addString(null, "", {placeHolder: "New property", width: "60%", name_width: "40%", callback: function(v){ 
            newProperty = v;
        }});

        var selectedVarType = this.listVarTypes[0];
        widgets.addCombo(null, selectedVarType, {width: "20%", name_width: "15%", values: this.listVarTypes, callback: function(v){
            selectedVarType = v;
        }});

        function registerProperty() {
            if(newProperty.length) {
                newProperty = newProperty.toLowerCase();
                if(properties_list[newProperty]) return;
                properties_list[newProperty] = selectedVarType;
                newProperty = "";
                widgets.on_refresh();
                if(!is_transition)
                    Interface.onInspectNode(app["graph"].canvas.current_node);
                else
                    Interface.showTransitions(null, true);
            }
        }

        widgets.addButton(null, "Add", {width: "20%", callback: function(v){ 
            registerProperty();
        }})

        // hacky to get input of element
        addPropertyWidget.lastElementChild.lastElementChild.lastElementChild.addEventListener("keyup", function(e){
            if(e.keyCode === 13) {
                e.stopPropagation(); registerProperty();
            }
        });

        widgets.widgets_per_row = 1;
        widgets.addSpace(7);
        widgets.widgets_per_row = 2;
        for(let p in properties_list) {
        
            var info = widgets.addInfo(p, "", {name_width: "100%"});
            info.querySelector(".wname").classList.add(properties_list[p]);

            info.addEventListener("contextmenu", function(e){

                e.preventDefault();
                if(!p) return;
    
                if(!is_transition) {
                    new LiteGraph.ContextMenu( [
                        {title: p, disabled: true}, null,
                        {title: "Add to selected", callback: function(){
                            var value;
                            switch(properties_list[p]) {
                                case "int":
                                case "float": value = 0; break;
                                case "string": value = "default"; break;
                                case "bool": value = false; break;
                                default: value = 0;
                            }
        
                            var canvas = app["graph"].canvas;
                            for(var i in canvas.selected_nodes) {
                                var s = canvas.selected_nodes[i];
                                if(s.properties[p]) return;
                                s.properties[p] = value; 
                            }
        
                            if(!is_transition)
                                Interface.onInspectNode(app["graph"].canvas.current_node);
                            else
                                Interface.showTransitions(null, true);
                        }},
                        {title: "Delete", callback: function(){
                            if(properties_list[p]) 
                                delete properties_list[p];
        
                            // delete from states
                            for(var i in FSMState.All) {
                                var s = FSMState.All[i];
                                delete s.properties[p];
                            }
        
                            widgets.on_refresh();
                            if(!is_transition)
                                Interface.onInspectNode(app["graph"].canvas.current_node);
                            else
                                Interface.showTransitions(null, true);
                        }}
                    ], { event: e});
                }else {
                    new LiteGraph.ContextMenu( [
                        {title: p, disabled: true}, null,
                        {title: "Add to all", callback: function(){
                            
                            var value;
                            switch(LTransitionProperties[p]) {
                                case "int":
                                case "float": value = 0; break;
                                case "string": value = "default"; break;
                                case "bool": value = false; break;
                                default: value = 0;
                            }

                            FSMTransition.All.forEach(t => { 
                                if(t.properties[p]) return;
                                t.properties[p] = value; 
                            });

                            Interface.showTransitions(null, true);
                        }},
                        {title: "Delete", callback: function(){
                            if(LTransitionProperties[p]) 
                                delete LTransitionProperties[p];
                            
                            // delete from transitions
                            FSMTransition.All.forEach(t => { 
                                delete t.properties[p];
                            });

                            widgets.on_refresh();
                            Interface.showTransitions(null, true);
                        }}
                    ], { event: e});
                }

                
            });
        }

        widgets.widgets_per_row = 1;
    }

    apply() {

        app["graph"].applySettings(this);
    }

    serialize() {
        
        return {
            onlyAutoConnect: this.onlyAutoConnect,
            render_connection_arrows: this.render_connection_arrows,
            links_render_mode: this.links_render_mode,
            render_link_name: this.render_link_name,
            autocreate_node: this.autocreate_node
        };
    }
}

REGISTER_MODULE("settings", SettingsModule)