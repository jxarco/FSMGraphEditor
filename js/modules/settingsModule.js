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
        this.listVarTypes = ["String", "Number", "Boolean"]; //"Array"

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
    }

    createStateSettigs() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("State");
        widgets.addSeparator();

        // types

        widgets.widgets_per_row = 2;
        var newType = "";
        var addTypeWidget = widgets.addString("Add new type", "", {width: "90%", name_width: "30%", callback: function(v){ 
            newType = v;
        }});

        function registerType() {
            if(newType.length) {
                newType = newType.toLowerCase();
                const index = LStateTypes.indexOf(newType);
                if(index > 0) return;
                LStateTypes.push( newType );
                newType = "";
                widgets.on_refresh();
                Interface.onInspectNode(app["graph"].canvas.current_node);
            }
        }

        widgets.addButton(null, "Add", {width: "10%", callback: function(v){ 
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
        var list = widgets.addList("Registered types (" + LStateTypes.length + ")", LStateTypes, {name_width: "60.5%", height: 90, callback: function(v){
            selectedRegisteredType = v;
        }});
        
        list.addEventListener("contextmenu", function(e){

            e.preventDefault();
            if(!selectedRegisteredType) return;

            new LiteGraph.ContextMenu( [
                {title: selectedRegisteredType, disabled: true}, null,
                {title: "Delete", callback: function(){
                    const index = LStateTypes.indexOf(selectedRegisteredType);
                    if(index > 0) LStateTypes.splice(index, 1);
                    widgets.on_refresh();
                    Interface.onInspectNode(app["graph"].canvas.current_node);
                }}
            ], { event: e});
        });

        // properties

        widgets.widgets_per_row = 2;
        var newStateProperty = "";
        var addStatePropertyWidget = widgets.addString("New property", "", {width: "60%", name_width: "40%", callback: function(v){ 
            newStateProperty = v;
        }});

        var selectedVarType = this.listVarTypes[0];
        widgets.addCombo(null, selectedVarType, {width: "30%", name_width: "15%", values: this.listVarTypes, callback: function(v){
            selectedVarType = v;
        }});

        function registerStateProperty() {
            if(newStateProperty.length) {
                newStateProperty = newStateProperty.toLowerCase();
                if(LStateProperties[newStateProperty]) return;
                LStateProperties[newStateProperty] = selectedVarType;
                newStateProperty = "";
                widgets.on_refresh();
                Interface.onInspectNode(app["graph"].canvas.current_node);
            }
        }

        widgets.addButton(null, "Add", {width: "10%", callback: function(v){ 
            registerStateProperty();
        }})

        // hacky to get input of element
        addStatePropertyWidget.lastElementChild.lastElementChild.lastElementChild.addEventListener("keyup", function(e){
            if(e.keyCode === 13) {
                e.stopPropagation(); registerStateProperty();
            }
        });

        widgets.widgets_per_row = 1;
        var selectedStateProperty = null;
        var statePropertiesRegistered = Object.keys(LStateProperties);
        var list = widgets.addList("Registered properties (" + statePropertiesRegistered.length + ")", statePropertiesRegistered, {name_width: "60.5%", height: 90, callback: function(v){
            selectedStateProperty = v;
        }});
        
        list.addEventListener("contextmenu", function(e){

            e.preventDefault();
            if(!selectedStateProperty) return;

            new LiteGraph.ContextMenu( [
                {title: selectedStateProperty, disabled: true}, null,
                {title: "Add to selected", callback: function(){
                    var value;
                    switch(LStateProperties[selectedStateProperty]) {
                        case "String": value = "default"; break;
                        case "Number": value = 0; break;
                        // case "Array": value = [0, 0]; break;
                        case "Boolean": value = false; break;
                        default: value = 0;
                    }

                    var canvas = app["graph"].canvas;
                    for(var i in canvas.selected_nodes) {
                        var s = canvas.selected_nodes[i];
                        if(s.properties[selectedStateProperty]) return;
                        s.properties[selectedStateProperty] = value; 
                    }

                    Interface.onInspectNode(app["graph"].canvas.current_node);
                }},
                {title: "Delete", callback: function(){
                    if(LStateProperties[selectedStateProperty]) 
                        delete LStateProperties[selectedStateProperty];

                    // delete from states
                    for(var i in FSMState.All) {
                        var s = FSMState.All[i];
                        delete s.properties[selectedStateProperty];
                    }

                    widgets.on_refresh();
                    Interface.onInspectNode(app["graph"].canvas.current_node);
                }}
            ], { event: e});
        });
    }

    createTransitionSettigs() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("Transitions");
        widgets.addSeparator();

        // types

        widgets.widgets_per_row = 2;
        var newType = "";
        var addTypeWidget = widgets.addString("Add new type", "", {width: "90%", name_width: "30%", callback: function(v){ 
            newType = v;
        }});

        function registerType() {
            if(newType.length) {
                newType = newType.toLowerCase();
                const index = LTransitionTypes.indexOf(newType);
                if(index > 0) return;
                LTransitionTypes.push( newType );
                newType = "";
                widgets.on_refresh();
                Interface.showTransitions(null, true);
            }
        }

        widgets.addButton(null, "Add", {width: "10%", callback: function(v){ 
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
        var list = widgets.addList("Registered types (" + LTransitionTypes.length + ")", LTransitionTypes, {name_width: "60.5%", height: 90, callback: function(v){
            selectedRegisteredType = v;
        }});
        
        list.addEventListener("contextmenu", function(e){

            e.preventDefault();
            if(!selectedRegisteredType) return;

            new LiteGraph.ContextMenu( [
                {title: selectedRegisteredType, disabled: true}, null,
                {title: "Delete", callback: function(){
                    const index = LTransitionTypes.indexOf(selectedRegisteredType);
                    if(index > 0) LTransitionTypes.splice(index, 1);
                    widgets.on_refresh();
                    Interface.showTransitions(null, true);
                }}
            ], { event: e});
        });

        // properties

        widgets.widgets_per_row = 2;
        var newTransitionProperty = "";
        var addTransitionWidget = widgets.addString("New property", "", {width: "60%", name_width: "40%", callback: function(v){ 
            newTransitionProperty = v;
        }});

        var selectedVarType = this.listVarTypes[0];
        widgets.addCombo(null, selectedVarType, {width: "30%", name_width: "15%", values: this.listVarTypes, callback: function(v){
            selectedVarType = v;
        }});

        function registerTransitionProperty() {
            if(newTransitionProperty.length) {
                newTransitionProperty = newTransitionProperty.toLowerCase();
                if(LTransitionProperties[newTransitionProperty]) return;
                LTransitionProperties[newTransitionProperty] = selectedVarType;
                newTransitionProperty = "";
                widgets.on_refresh();
                Interface.showTransitions(null, true);
            }
        }

        widgets.addButton(null, "Add", {width: "10%", callback: function(v){ 
            registerTransitionProperty();
        }})

        // hacky to get input of element
        addTransitionWidget.lastElementChild.lastElementChild.lastElementChild.addEventListener("keyup", function(e){
            if(e.keyCode === 13) {
                e.stopPropagation(); registerTransitionProperty();
            }
        });

        widgets.widgets_per_row = 1;
        var selectedTransitionProperty = null;
        var transitionPropertiesRegistered = Object.keys(LTransitionProperties);
        var list = widgets.addList("Registered properties (" + transitionPropertiesRegistered.length + ")", transitionPropertiesRegistered, {name_width: "60.5%", height: 90, callback: function(v){
            selectedTransitionProperty = v;
        }});
        
        list.addEventListener("contextmenu", function(e){

            e.preventDefault();
            if(!selectedTransitionProperty) return;

            new LiteGraph.ContextMenu( [
                {title: selectedTransitionProperty, disabled: true}, null,
                {title: "Add to all", callback: function(){
                    
                    var value;
                    switch(LTransitionProperties[selectedTransitionProperty]) {
                        case "String": value = "default"; break;
                        case "Number": value = 0; break;
                        // case "Array": value = [0, 0]; break;
                        case "Boolean": value = false; break;
                        default: value = 0;
                    }

                    FSMTransition.All.forEach(t => { 
                        if(t.properties[selectedTransitionProperty]) return;
                        t.properties[selectedTransitionProperty] = value; 
                    });

                    Interface.showTransitions(null, true);
                }},
                {title: "Delete", callback: function(){
                    if(LTransitionProperties[selectedTransitionProperty]) 
                        delete LTransitionProperties[selectedTransitionProperty];
                    
                    // delete from transitions
                    FSMTransition.All.forEach(t => { 
                        delete t.properties[selectedTransitionProperty];
                    });

                    widgets.on_refresh();
                    Interface.showTransitions(null, true);
                }}
            ], { event: e});
        });
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