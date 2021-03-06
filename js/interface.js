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
        this.settings_area.content.style.height = "calc(100% - 30px)";
        this.settings_area.content.style.overflowY = "scroll";

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

        var that = this;

        //create menubar
		LiteGUI.createMenubar(null,{sort_entries: false});

        LiteGUI.menubar.add("File/New", { callback: app["graph"].reset.bind(app["graph"])  });
        // LiteGUI.menubar.add("Engine tools/Skeleton exporter", { callback: that.openSkeletonFileExporter.bind(that)});
        LiteGUI.menubar.add("Shortcuts/Save (Ctrl S)", { disabled: true });
        LiteGUI.menubar.add("Shortcuts/Export FSM (Ctrl E)", { disabled: true });
        LiteGUI.menubar.add("Shortcuts/Export Graph (LShift + Ctrl E)", { disabled: true });
        LiteGUI.menubar.add("About/Author: @jxarco", { disabled: true });
        LiteGUI.menubar.add("About/Using litegraph.js and litegui.js (@jagenjo)", { disabled: true });
        LiteGUI.menubar.add("|", { disabled: true });
        LiteGUI.menubar.add("", { disabled: true });
        LiteGUI.menubar.add("Last time saved: Never", { disabled: true });

        // Configs
        LiteGUI.menubar.menu[5].element.classList.add("menubar-right");
    },

    updateMenu() {

        LiteGUI.menubar.updateMenu();
        LiteGUI.menubar.menu[5].element.classList.add("menubar-right");
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

        if(node.is_shortcut){
            this.onInspectShortcut(node);
            return;
        }

        widgets.addSection("State");
        widgets.widgets_per_row = 1;
        widgets.addString("Name", node.title, {name_width: "50%", callback: function(v){ 
            if(app["graph"]) 
                app["graph"].processStateRenamed(node, v);
            that.onInspectNode(node);
        }} );
        // widgets.addString("ID", node.id, {width: "30%", name_width: "30%", disabled: true} );
        widgets.widgets_per_row = 1;
        widgets.addCheckbox("Export custom type", node.useCustomType, {name_width: "50%", callback: function(v){
            node.useCustomType = v;
            node.customType = node.title.toLowerCase();
            that.onInspectNode(node);
        }});
        if(node.useCustomType) {
            widgets.addString(null, node.customType, {name_width: "50%", callback: function(v){
                node.customType = v;
            }});
        }
        widgets.addSeparator();
        widgets.addVector2("Position", node.pos, {callback: function(v){ 
            node.pos = v; 
            if(app["graph"]) app["graph"].redraw();
        }});

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

            let t = FSMTransition.All[i];
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

    onInspectShortcut(node){

        var widgets = this.inspector;
        var that = this;

        widgets.addSection("Shortcut");
        widgets.widgets_per_row = 1;
        widgets.addString("Name", node.title, {name_width: "50%", disabled: true});
        widgets.widgets_per_row = 1;
        widgets.addSeparator();
        widgets.addVector2("Position", node.pos, {callback: function(v){ 
            node.pos = v; 
            if(app["graph"]) app["graph"].redraw();
        }});

        widgets.addTitle("Data");

        var graph_nodes = [""].concat(
            app.modules.graph.graph._nodes.filter(e => !e.is_shortcut)
        );

        widgets.addCombo("Target", node.shortcut_target || "", {values: graph_nodes, disabled: node.shortcut_set, callback: function(v){
            node.shortcut_target = v;
            node.shortcut_set = true;
            that.onInspectNode(node);
        }});

        if(node.shortcut_set) {
            widgets.addButton(null, "Reset shortcut", {callback: function(){
                if(app["graph"])
                    that.onInspectNode(app["graph"].cloneAndRemove(node));
            }});    
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
                if(app["graph"]) 
                    app["graph"].processTransitionRenamed(t.id, null, v);
            }});
            var sourceState = widgets.addString("Source", t.origin, {disabled: true});
            sourceState.addEventListener("contextmenu", function(e){
                e.preventDefault();

                var nodes = [{title: "Select origin (Beta)", disabled: true}, null];

                for(var n in FSMState.All) {
                    if(n == t.origin) continue;
                    nodes.push({
                        title: n,
                        callback: function(option, e){
                            // remove previous
                            FSMTransition.RemoveById(t.id);
                            var oldSrc = FSMState.GetByName(t.origin);
                            oldSrc.disconnectOutput(t.link.origin_slot);
                            // connect new
                            var nodeSrc = FSMState.GetByName(option.title);
                            var nodeDst = FSMState.GetByName(t.target);
                            app["graph"].canvas.onAutoConnectNode(nodeSrc.getFirstFreeInputSlot(), nodeSrc, nodeDst, t.link.target_slot);
                        }
                    });
                }

                new LiteGraph.ContextMenu( nodes, { event: e});
            });
            var targetState = widgets.addString("Target", t.target, {disabled: true});
            targetState.addEventListener("contextmenu", function(e){
                e.preventDefault();

                var nodes = [{title: "Select target (Beta)", disabled: true}, null];

                for(var n in FSMState.All) {
                    if(n == t.target) continue;
                    nodes.push({
                        title: n,
                        callback: function(option, e){
                            // remove previous
                            FSMTransition.RemoveById(t.id);
                            var oldTarget = FSMState.GetByName(t.target);
                            oldTarget.disconnectInput(t.link.target_slot);
                            // connect new
                            var nodeSrc = FSMState.GetByName(t.origin);
                            var nodeDst = FSMState.GetByName(option.title);
                            app["graph"].canvas.onAutoConnectNode(t.link.origin_slot, nodeSrc, nodeDst);
                        }
                    });
                }

                new LiteGraph.ContextMenu( nodes, { event: e});
            });

            that.showProperties(t, LTransitionProperties, LTransitionTypes, filter, true);
            
            widgets.endCurrentSection();

            if(t.isBidirectional()) {

                var id = t.link._data.related_link;
                let bt = FSMTransition.GetById(id);

                // discard bidirectional target states
                if(!bt) return;

                widgets.widgets_per_row = 1;
                widgets.addSection("Link: " + bt.name);
                widgets.addString("Name", bt.name, {callback: function(v){ 
                    if(app["graph"]) 
                        app["graph"].processTransitionRenamed(bt.id, null, v);
                }});
                widgets.addString("Source", bt.origin, {disabled: true});
                widgets.addString("Target", bt.target, {disabled: true});

                that.showProperties(bt, LTransitionProperties, LTransitionTypes, filter, true);
            }
        }
    },

    showProperties(t, list, type_list, filter, is_transition) {

        var that = this;
        var widgets = this.inspector;
        var propsTitle = widgets.addTitle("Properties");

        // t.properties = sortObject(t.properties, "type");

        for(let p in t.properties) {
        
            var value = t.properties[p];
            var func = null;

            switch(value.constructor)
            {
            case Number:
                func = widgets.addNumber.bind(widgets);
                break;
            case String:
                if(p == "cancel") {
                    var cancel_list = ["DEFAULT", "ON HIT", "ON DECISION", "ON ANY"];
                    func = cancel_list;
                }
                else if(p == "type") {
                    widgets.addCombo(p, value, {values: type_list, name_width: "40%", callback: function(v){
                        var lastBlendTime = t.properties["blend_time"];
                        t.properties = {
                            type: v
                        };

                        // transitions always have blend_time
                        if(lastBlendTime) t.properties["blend_time"] = lastBlendTime;

                        // check if there's any type related property to add
                        var typeData = is_transition ? LTransitionTypeData : LStateTypeData;
                        var relatedProps = typeData[v];
                        if(!relatedProps) relatedProps = [];

                        // every state or transition have this
                        t.setRelatedProperties(relatedProps, list);

                        if(is_transition)
                            that.showTransitions(filter);
                        else
                            that.onInspectNode(t);

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

                var var_type = list[p];
                var string_name_width = "35%";
                var prop_name = "<b>" + p + "</b>";

                if(!var_type) {
                    var gparent = FSMState.GetGroupParent(p);

                    if(isBlendSample(p))
                    {
                        var_type = "string";
                    }else
                    {
                        var_type = LStatePropertyGroups[gparent][p];
                    }

                    string_name_width = "50%";
                    prop_name = p;
                }

                var precision = var_type == "float" ? 3 : 0;
                var is_string = var_type == "string";

                var propWidget = null;

                // COMBOS
                if(func.constructor == Array)
                {
                    propWidget = widgets.addCombo("cancel mode", value, {values: cancel_list, name_width: "40%", callback: function(v){
                        t.properties[p] = v;
                    }});
                }
                else
                {
                    propWidget = func(prop_name, value, {precision: precision, name_width: is_string ? string_name_width : "70%", callback: function(v){

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
                }

                propWidget.querySelector(".wname").classList.add(var_type);
                propWidget.addEventListener("contextmenu", function(e){

                    e.preventDefault();
        
                    new LiteGraph.ContextMenu( [
                        {title: p, disabled: true}, null,
                        {title: "Delete", callback: function(){
                            delete t.properties[p];
                            if(is_transition)
                                that.showTransitions(filter);
                            else
                                that.onInspectNode(t);
                        }}
                    ], { event: e});
                });
            }
        }
            
        var addButton = widgets.addButton(null, "+", {title: "Add new property", micro: true, callback: function(value, e){
            
            e.preventDefault();

            var options = [
                {title: "Properties", disabled: true}, null
            ];

            function inner_add(p, _list){
                var value;
                switch(_list[p]) {
                    case "int":
                    case "float": value = 0; break;
                    case "bool": value = false; break;
                    case "string":  value = ""; break;
                    case "group":  
                    for(var gp in LStatePropertyGroups[p]){
                        inner_add(gp, LStatePropertyGroups[p]);
                    }
                    return; // exit now
                    default: value = 0;
                }

                if(p == "cancel") value = "DEFAULT";
                t.properties[p] = value;

                if(is_transition)
                    that.showTransitions(filter);
                else
                    that.onInspectNode(t);
            }

            for(let i in list) {

                // transition already has property
                if(t.properties[i] !== undefined) 
                continue;

                var option = {
                    title: i
                }

                if(list[i] == "group")
                {
                    option.has_submenu = true;
                    option.submenu = {
                        options: []
                    };

                    if(i == "blendspace")
                    {
                        option.submenu.options.push({
                            title: "Add new sample",
                            callback: function(){
                                t.addNewBlendSample();
                                that.onInspectNode(t);
                            }
                        }, null);
                    }

                    option.submenu.options.push({
                        title: "All",
                        callback: function(){
                            inner_add(i, list);
                        }
                    }, null);

                    for(let gp in LStatePropertyGroups[i]){
                      option.submenu.options.push({
                        title: gp,
                        callback: function() {
                            inner_add(gp, LStatePropertyGroups[i]);
                        }
                      });
                    }
                }else{
                    option.callback = function(){
                        inner_add(i, list);
                    }
                }

                options.push(option);
            }

            new LiteGraph.ContextMenu(options, {event: e});
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
            var types = LVariableTypes;

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
            let is_large = variable.type == "string" || variable.type == "vec2"
                            || variable.type == "vec3";

            if(!variable.name.includes(filter)) continue;

            var el = widgets.addString(null, variable.name, {width: is_large ? "40%" : "70%", callback: function(v) {
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
                                {title: "string"},
                                {title: "vec2"},
                                {title: "vec3"}
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
                    case "vec2": variable.value = new Float32Array(2); break;
                    case "vec3": variable.value = new Float32Array(3); break;
                    default: variable.value = 0;
                }

                that.showVariables(filter);
            }

            var value = variable.value;

            switch(value.constructor)
            {
                case Float32Array:
                    var precision = 2;

                    if(value.length == 2)
                    {
                        func = widgets.addVector2(null, value, {precision: precision, width: "60%", callback: function(v){
                            variable.value = v;
                        }});
                    }else if(value.length == 3)
                    {
                        func = widgets.addVector3(null, value, {precision: precision, width: "60%", callback: function(v){
                            variable.value = v;
                        }});
                    }
                    break;
                case Number:
                    var precision = variable.type == "float" ? 2 : 0;
                    func = widgets.addNumber(null, value, {precision: precision, width: "30%", callback: function(v){
                        variable.value = v;
                    }});
                    break;
                case String:
                    func = widgets.addString(null, value, {width: "60%", callback: function(v){
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
    },

    openSkeletonFileExporter() {
        
        var that = this;
        var w = 450;
        var title = "Skeleton file exporter";
        var dialog_id = title.replace(/\s/g, "").toLowerCase();
        document.querySelectorAll( "#" + dialog_id ).forEach( e => e.remove() );
        var dialog = new LiteGUI.Dialog( {id: dialog_id, parent: "body", title: title, close: true, width: w, draggable: true });
        var widgets = new LiteGUI.Inspector();
        
        var skeleton_name = "";
        var animations = "";
        var meshes = "";

        var material_name = "";
        var supported_textures = ["albedo", "normal", "roughness", "metallic", "emissive"];
        var textures = {"albedo": true};
        var uses_skin = true;

        widgets.on_refresh = function(){
            widgets.clear();
            widgets.widgets_per_row = 1;
            widgets.addTitle("Skeleton");
            widgets.addString("Name", skeleton_name, {placeHolder: "skeleton name", callback: function(v){
                skeleton_name = v;
            }});
            widgets.addSeparator();
            widgets.addInfo(null, "No folder, only animation and mesh names! (one by line)");
            widgets.addTextarea("Animations", animations, {height: "60px", callback: function(v){
                animations = v;
            }});
            widgets.addTextarea("Meshes", meshes, {height: "60px", callback: function(v){
                meshes = v;
            }});
            widgets.addSeparator();
            widgets.addTitle("Materials");
            widgets.widgets_per_row = 2;
            widgets.addString("Name", material_name, {width: "70%", placeHolder: "material name", callback: function(v){
                material_name = v;
            }});
            widgets.addButton(null, "add texture", {width: "30%", callback: function(v, e){
                e.preventDefault();
    
                var options = [];
    
                for(let i in supported_textures){
    
                    if(!textures[supported_textures[i]])
                        options.push({
                            title: supported_textures[i],
                            callback: function(){
                                textures[supported_textures[i]] = true;
                                widgets.on_refresh();
                            }
                        });
                }
    
                if(options.length)
                    new LiteGraph.ContextMenu( options, { event: e});
                else
                    new LiteGraph.ContextMenu( [{
                        title: "No supported textures",
                        disabled: true
                    }], { event: e});
            }});
            widgets.widgets_per_row = 1;
            widgets.addCheckbox("Uses skin", uses_skin, {callback: function(v){
                uses_skin = v;
            }});
            widgets.addSeparator();
            widgets.addInfo(null, "'folder/name' don't write extension")
            widgets.addInfo(null, "ex: 'eon/eonhood' exports: 'data/textures/eon/eonhood.dds'")
            for(let t in textures){
                var tex_name = textures[t];
                if(tex_name == true) tex_name = "";
                widgets.addString(t, tex_name, {placeHolder: "texture name", callback: function(v){
                    textures[t] = v;
                }});
            }
            widgets.addSeparator();
            widgets.widgets_per_row = 2;
            widgets.addButton(null, "Export material", {callback: function(){
    
                var foo = {};
                
                for(let t in textures){
                    if(textures[t] == true) // unnamed
                    {
                        LiteGUI.alert("Texture " + t + " needs a name", {title: "error"});
                        return;
                    }
                    foo[t] = "data/textures/" + textures[t] + ".dds";
                }
    
                if(uses_skin)
                    foo["uses_skin"] = true;

                if(!material_name.length) material_name = "unnamed";
                LiteGUI.downloadFile(material_name + ".mat", JSON.stringify(foo, null, 4));
            }});
            widgets.addButton(null, "Export skeleton", {callback: function(){
    
                var mesh_list = [];
                var animation_list = [];

                // Parse meshes
                {
                    var tkns = meshes.split("\n");
                    for(var t in tkns) {
                        mesh_list.push( tkns[t].replace(/\s/g, "") );
                    }
                }

                // Parse animations
                {
                    var tkns = animations.split("\n");
                    for(var t in tkns) {
                        animation_list.push( tkns[t].replace(/\s/g, "") );
                    }
                }
                
                var foo = {
                    "name": skeleton_name,
                    "anims": [],
                    "meshes": mesh_list
                };
    
                for(var a in animation_list) {
                    foo["anims"].push( {
                        "name": animation_list[a]
                    } );
                }
    
                if(!skeleton_name.length) skeleton_name = "unnamed";
                LiteGUI.downloadFile(skeleton_name + ".skeleton", JSON.stringify(foo, null, 4));
            }});
            widgets.addSeparator();   
        }
        
        widgets.on_refresh();
        dialog.add(widgets);
        dialog.makeModal('fade');
        dialog.setPosition(window.innerWidth/2 - w/2, 150);
    }
}