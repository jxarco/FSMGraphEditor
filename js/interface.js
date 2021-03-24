/*
*   Alex Rodriguez
*   @jxarco 
*/

var Interface = {

    init()
    {
        LiteGUI.init();

        this.createMenuBar();
        
        var mainarea = this.mainarea = new LiteGUI.Area({id :"mainarea", content_id:"main-area", autoresize: true, inmediateResize: true});
        mainarea.split("horizontal",[null,325], true);
        LiteGUI.add( mainarea );
        
        var main_tabs = new LiteGUI.Tabs( { id: "worktabs", width: "full", mode: "vertical", autoswitch: true });
		this.mainarea.getSection(0).add( main_tabs );
		LiteGUI.main_tabs = main_tabs;

        this.createSidePanel();

        // fill tabs
        this.canvas_area = canvas_area = new LiteGUI.Area({id :"canvasarea", content_id:"canvas-area", autoresize: true, inmediateResize: true});;
        canvas_area.add( document.getElementById("mycanvas") );

        // settings
        this.settings_area = new LiteGUI.Area({id :"settingsarea", content_id:"settings-area", autoresize: true, inmediateResize: true});
        this.settings_area.content.style.fontSize = "17px";

        // drive
        this.drive_area = new LiteGUI.Area({id :"drivearea", content_id:"drive-area", autoresize: true, inmediateResize: true});
        this.drive_area.content.style.fontSize = "17px";

        LiteGUI.bind( mainarea, "split_moved", function(e){
            
            var graphModule = app["graph"];
            if(graphModule)
                graphModule.resize();
		});
    },

    postInit() {

        this.showVariables();
    },

    createMenuBar() {

        //create menubar
		LiteGUI.createMenubar(null,{sort_entries: false});

        LiteGUI.menubar.add("File/New", { callback: app["graph"].reset.bind(app["graph"])  });
        LiteGUI.menubar.add("About/Author: @jxarco", { disabled: true });
        LiteGUI.menubar.add("About/Using litegraph.js and litegui.js (@jagenjo)", { disabled: true });
    },

    createSidePanel() {
        // Side panel
        var sidepanel = this.mainarea.getSection(1);
        this.inspector_area = new LiteGUI.Area({id :"inspectorarea", content_id:"inspector-area", autoresize: true, inmediateResize: true});;
        this.inspector_area.content.style.fontSize = "15px";

        var docked = new LiteGUI.Panel("side_panel");
        this.sidepanel = docked;
        sidepanel.add(docked);

        // INSPECTOR
        this.inspector = new LiteGUI.Inspector({id:"edit-inspector"});
        this.inspector_area.add(this.inspector);
        docked.add(this.inspector_area);
    },

    onInspectNode(node) {

        var widgets = this.inspector;
        var that = this;

        if(!node) {
            this.showVariables();
            return;
        } 
        
        widgets.clear();
        widgets.addTitle("State");
        widgets.widgets_per_row = 2;
        widgets.addString("Name", node.title, {width: "65%", name_width: "40%", callback: function(v){ 
            if(app["graph"]) 
                app["graph"].processStateRenamed(node, v);
        }} );
        widgets.addString("ID", node.id, {width: "30%", name_width: "30%", disabled: true} );
        widgets.widgets_per_row = 1;
        widgets.addVector2("Position", node.pos, {callback: function(v){ 
            node.pos = v; 
            if(app["graph"]) app["graph"].redraw();
        }});
        widgets.addSeparator();

        widgets.addTitle("Properties");
        for(let p in node.properties) {
            
            var value = node.properties[p];
            var func = null;

            switch(value.constructor)
            {
                case Number:
                    func = widgets.addNumber.bind(widgets);
                    break;
                case String:
                    if(p == "type") {
                        widgets.addCombo(p, value, {values: LStateTypes, name_width: "40%", callback: function(v){
                            node.properties[p] = v;
                        }});
                    }else {
                        func = widgets.addString.bind(widgets);
                    }
                    break;
                case Boolean:
                    func = widgets.addCheckbox.bind(widgets);
                    break;
            }

            if(func)
                func(p, value, {name_width: "40%", callback: function(v){
                    node.properties[p] = v;
                }});
        }

        if(Object.keys(node.properties).length)
            widgets.addSeparator();

        var allProperties = Object.keys(LStateProperties);
        var selection = allProperties.length ? allProperties[0] : null;
        widgets.addList(null, allProperties, {height: Math.min(allProperties.length * 30, 120), callback: function(v){
            selection = v;
        }});
        widgets.addButton(null, "Add", {callback: function(){
            
            if(node.properties[selection])
            return;

            var value;
            switch(LStateProperties[selection]) {
                case "String": value = ""; break;
                case "Number": value = 0; break;
                case "Array": value = [0, 0]; break;
                case "Boolean": value = false; break;
                default: value = 0;
            }
            node.properties[selection] = value;
            // node.properties = sortObject(t.properties);
            that.onInspectNode(node);
        }});

        var outs = {};

        if(node.outputs) {
            widgets.addSeparator();
            widgets.addTitle("Transitions");

            for(var i = 0; i < node.outputs.length; ++i) {
    
                var output = node.outputs[i];
    
                if(!output.links)
                break;
    
                for(var j in output.links) {
    
                    var link = output.links[j];
                    let t = FSMTransition.GetById(link);
                    outs[link] = t;

                    widgets.widgets_per_row = 2;
                    widgets.addInfo(null, t.name, {width: "80%", name_width: "35%"});
                    widgets.addButton(null, "Edit", {width: "20%", callback: function(){
                        that.showTransitions(t.name);
                    }});
                }    
            }

           widgets.widgets_per_row = 1;
        }

        // show also bidirectional transitions
        for(var i in FSMTransition.All) {

            var t = FSMTransition.All[i];
            var link_id = t.link.id;

            // transition is bidirectional and node is target, not shown before
            if(t.origin == node.title && !outs[link_id]) {
                outs[link_id] = t;
                widgets.widgets_per_row = 2;
                widgets.addInfo(null, t.name, {width: "80%", name_width: "35%"});
                widgets.addButton(null, "Edit", {width: "20%", callback: function(){
                    that.showTransitions(t.name);
                }});
            }
        }
    },

    showTransitions(filter, use_previous_filter) {

        var that = this;
        var widgets = this.inspector;
        widgets.clear();

        if(use_previous_filter)
            filter = this.filter;

        filter = filter || "";
        this.filter = filter;

        widgets.addTitle("Transition");

        for(var i in FSMTransition.All) {

            let t = FSMTransition.All[i];

            if(t.name !== filter) continue;

            widgets.widgets_per_row = 1;
            widgets.addSection("Link: " + t.name);
            widgets.addString("Name", t.name, {callback: function(v){ 
                t.name = v;  
                t.link._data.text = v;
                if(app["graph"]) app["graph"].redraw();
                that.showTransitions(filter);
            }});
            widgets.addString("Source", t.origin, {disabled: true});
            widgets.addString("Target", t.target, {disabled: true});

            // source state manages bidirectionality (show this or make it only by clocking the link?)
            if(0 && t.link.origin_slot != null && t.link.target_slot != null) {
                
                widgets.addSeparator();
                widgets.addCheckbox("Bidirectional", t.link._data && t.link._data.bidirectional, {callback: function(v) {
                    t.bidirectional = v;
                    app["graph"].setBidirectionalLink(t.id, v);
                    that.showTransitions(filter);
                }});
            }
            
            widgets.addTitle("Properties");

            for(let p in t.properties) {
            
                var value = t.properties[p];
                var func = null;
    
                switch(value.constructor)
                {
                    case Number:
                        func = widgets.addNumber.bind(widgets);
                        break;
                    case String:
                        if(p == "type") {
                            widgets.addCombo(p, value, {values: LTransitionTypes, name_width: "40%", callback: function(v){
                                t.properties[p] = v;
                            }});
                        }else {
                            func = widgets.addString.bind(widgets);
                        }
                        break;
                    case Boolean:
                        func = widgets.addCheckbox.bind(widgets);
                        break;
                }
    
                if(func)
                    func(p, value, {name_width: "40%", callback: function(v){

                        // check it first side if a valid variable
                        if(p == "condition") {
                            var tkns = v.split(" ");
                            var variable = tkns[0];
                            var that = this;

                            if(FSMVariable.Exists(variable)) t.properties[p] = v;
                            else {
                                LiteGUI.alert("Variable \"" + variable + "\" not found", {
                                    title: "Error", 
                                    noclose: true,
                                    on_close: function(){
                                        that.lastElementChild.lastElementChild.lastElementChild.value = value;
                                    }
                                });
                            }
                        }
                        else {
                            t.properties[p] = v;
                        }
                    }});
            }

            if(Object.keys(t.properties).length)
                widgets.addSeparator();

            var allProperties = Object.keys(LTransitionProperties);
            var selection = allProperties.length ? allProperties[0] : null;
            widgets.addList(null, allProperties, {height: Math.min(allProperties.length * 30, 120), callback: function(v){
                selection = v;
            }});
            widgets.addButton(null, "Add", {callback: function(){
                
                if(t.properties[selection])
                return;

                var value;
                switch(LTransitionProperties[selection]) {
                    case "String": value = ""; break;
                    case "Number": value = 0; break;
                    case "Array": value = [0, 0]; break;
                    case "Boolean": value = false; break;
                    default: value = 0;
                }
                t.properties[selection] = value;

                // t.properties = sortObject(t.properties);
                that.showTransitions(filter);
            }});
            widgets.endCurrentSection();
        }
    },

    showVariables(filter) {

        var that = this;
        var widgets = this.inspector;
        widgets.clear();

        filter = filter || "";

        widgets.addTitle("Variables (" + FSMVariable.All.length + ")");
        widgets.widgets_per_row = 2;
        widgets.addString(null, filter, {width: "85%", placeHolder: "Search", callback: function(v) { filter = v; that.showVariables(filter); }});
        widgets.addButton(null, "+", {width: "15%", micro: true, callback: function() { 
            FSMVariable.All.push(new FSMVariable());
            that.showVariables(); 
        }});
        widgets.addSeparator();
        // widgets.widgets_per_row = 1;

        for(var i in FSMVariable.All) {

            let variable = FSMVariable.All[i];
            let is_bool = variable.type == "bool";

            if(!variable.name.includes(filter)) continue;

            var el = widgets.addString(null, variable.name, {width: is_bool ? "80%" : "50%", callback: function(v) {
                variable.name = v; 
                that.showVariables(filter); 
            }});

            el.classList.add("variable");

            el.addEventListener("contextmenu", function(e){

                e.preventDefault();
    
                new LiteGraph.ContextMenu( [
                    {title: "Edit", disabled: true}, null,
                    {
                        title: "Union", 
                        has_submenu: true,
                        submenu: {
                            callback: changeUnionType,
                            options: [
                                {title: "int"},
                                {title: "float"},
                                {title: "bool"},
                                {title: "string"}
                            ]
                        }
                    },
                    {title: "Delete", callback: function(){
                        FSMVariable.RemoveByName(variable.name);
                        that.showVariables(filter);
                    }}
                ], { event: e});
            });

            function changeUnionType(){
                
                var type = variable.type = this.innerText;

                switch(type) {
                    case "int":
                    case "float": variable.value = 0; break;
                    case "bool": variable.value = false; break;
                    case "string": variable.value = ""; break;
                    default: variable.value = 0;
                }

                that.showVariables(filter);
            }

            var value = variable.value;

            switch(value.constructor)
            {
                case Number:
                    func = widgets.addNumber(null, value, {width: "50%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
                case String:
                    func = widgets.addString(null, value, {width: "50%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
                case Boolean:
                    func = widgets.addCheckbox(null, value, {width: "20%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
            }
        }
    }
}