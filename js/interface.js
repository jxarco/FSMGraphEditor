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
        widgets.addSection("State");
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

        that.showProperties(node, LStateProperties, LStateTypes);

        var outs = {};

        if(node.outputs) {
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

        widgets.endCurrentSection();
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
            
            that.showProperties(t, LTransitionProperties, LTransitionTypes, filter, true);

            widgets.endCurrentSection();
        }
    },

    showProperties(t, list, type_list, filter, is_transition) {

        var that = this;
        var widgets = this.inspector;
        var propsTitle = widgets.addTitle("Properties");

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
                        widgets.addCombo(p, value, {values: type_list, name_width: "40%", callback: function(v){
                            t.properties[p] = v;
                        }});
                        widgets.addSeparator();
                    }else {
                        func = widgets.addString.bind(widgets);
                    }
                    break;
                case Boolean:
                    func = widgets.addCheckbox.bind(widgets);
                    break;
            }

            if(func) {
                var precision = list[p] == "float" ? 3 : 0;
                var is_string = list[p] == "string";
                var propWidget = func(p, value, {precision: precision, name_width: is_string ? "30%" : "70%", callback: function(v){

                    // check it first side if a valid variable
                    if(is_transition && p == "condition") {
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

                propWidget.querySelector(".wname").classList.add(list[p])
            }
        }
            
        var addButton = widgets.addButton(null, "+", {micro: true, callback: function(value, e){
            
            e.preventDefault();

            var options = [
                {title: "Properties", disabled: true}, null
            ];

            for(let i in list) {

                // transition already has property
                if(t.properties[i] !== undefined) continue;

                options.push({
                    title: i,
                    callback: function(){
                        var value;
                        switch(list[i]) {
                            case "int":
                            case "float": value = 0; break;
                            case "bool": value = false; break;
                            case "string":  value = ""; break;
                            default: value = 0;
                        }
                        t.properties[i] = value;

                        if(is_transition)
                        that.showTransitions(filter);
                        else
                        that.onInspectNode(t);
                    }
                });
            }

            new LiteGraph.ContextMenu( options, { event: e});
        }});
        
        propsTitle.children[0].appendChild( addButton.content );
        addButton.content.style.display = "contents";
        addButton.content.querySelector(".micro").style.float = "right";
        addButton.content.querySelector(".micro").style.marginRight = "15px";
        addButton.content.querySelector(".micro").style.padding = "0px";
        // remove empty container
        addButton.remove();
    },

    showVariables(filter) {

        var that = this;
        var widgets = this.inspector;
        widgets.clear();

        filter = filter || "";

        widgets.addTitle("Variables (" + FSMVariable.All.length + ")");
        widgets.widgets_per_row = 3;
        widgets.addString(null, filter, {width: "76%", placeHolder: "Search", callback: function(v) { filter = v; that.showVariables(filter); }});
        widgets.addButton(null, "+", {title: "Add variable", width: "12%", micro: true, callback: function(value, e) { 
            
            e.preventDefault();

            var options = [];
            var types = ["int", "float", "bool", "string"];

            for(let i in types) {
                options.push({
                    title: types[i],
                    callback: function(){
                        FSMVariable.All.push(new FSMVariable(null, types[i]));
                        that.showVariables(); 
                    }
                });
            }

            new LiteGraph.ContextMenu( options, { event: e});
        }});
        var sortBtn = widgets.addButton(null, "&#8798;", {title: "Sort", width: "12%", micro: true, callback: function(value, e) { 
            
            e.preventDefault();

            var options = [];
            var types = ["name", "type"];

            for(let i in types) {
                options.push({
                    title: types[i],
                    callback: function(){
                        FSMVariable.Sort(types[i]);
                        that.showVariables(); 
                    }
                });
            }
            new LiteGraph.ContextMenu( options, { event: e});
        }});

        sortBtn.style.marginLeft = "-15px";
        widgets.addSeparator();

        for(var i in FSMVariable.All) {

            let variable = FSMVariable.All[i];
            let is_string = variable.type == "string";

            if(!variable.name.includes(filter)) continue;

            var el = widgets.addString(null, variable.name, {width: is_string ? "30%" : "70%", callback: function(v) {
                variable.name = v; 
                that.showVariables(filter); 
            }});

            el.classList.add("variable");
            el.classList.add(variable.type);

            el.addEventListener("contextmenu", function(e){

                e.preventDefault();
    
                new LiteGraph.ContextMenu( [
                    {title: variable.name, disabled: true}, null,
                    {
                        title: "Type", 
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
                    var precision = variable.type == "float" ? 3 : 0;
                    func = widgets.addNumber(null, value, {precision: precision, width: "30%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
                case String:
                    func = widgets.addString(null, value, {width: "70%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
                case Boolean:
                    func = widgets.addCheckbox(null, value, {width: "30%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
            }
        }
    }
}