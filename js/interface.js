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
        LiteGUI.menubar.add("Tools/Material file exporter", { callback: that.openMaterialFileExporter.bind(that)});
        LiteGUI.menubar.add("Tools/Skeleton file exporter", { callback: that.openSkeletonFileExporter.bind(that)});
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
            widgets.addString("Source", t.origin, {disabled: true});
            widgets.addString("Target", t.target, {disabled: true});

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
                        widgets.addCombo("cancel mode", value, {values: cancel_list, name_width: "40%", callback: function(v){
                            t.properties[p] = v;
                        }});
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
                            
                            for(var i in relatedProps) {
                                var prop = relatedProps[i];

                                // don't add if already has it
                                if(t.properties[prop]) continue;

                                var propType = list[prop];

                                var value;
                                switch(propType) {
                                    case "int":
                                    case "float": value = 0; break;
                                    case "bool": value = false; break;
                                    case "string":  value = ""; break;
                                    default: value = 0;
                                }

                                t.properties[prop] = value;
                            }

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
                    var_type = LStatePropertyGroups[gparent][p];
                    string_name_width = "50%";
                    prop_name = p;
                }

                var precision = var_type == "float" ? 3 : 0;
                var is_string = var_type == "string";
                var propWidget = func(prop_name, value, {precision: precision, name_width: is_string ? string_name_width : "70%", callback: function(v){

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

            for(let i in list) {

                // transition already has property
                if(t.properties[i] !== undefined) continue;

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

                options.push({
                    title: i,
                    callback: function(){
                        inner_add(i, list);
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
            let is_large = variable.type == "string" || variable.type == "vec3";

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
                    func = widgets.addVector3(null, value, {precision: precision, width: "60%", callback: function(v){
                        variable.value = v;
                    }});
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

    openMaterialFileExporter() {
        
        var that = this;
        var w = 450;
        var title = "Material file exporter";
        var dialog_id = title.replace(/\s/g, "").toLowerCase();
        document.querySelectorAll( "#" + dialog_id ).forEach( e => e.remove() );
        var dialog = new LiteGUI.Dialog( {id: dialog_id, parent: "body", title: title, close: true, width: w, draggable: true });
        var widgets = new LiteGUI.Inspector();
        
        var pipelines = ["BASIC", "SKIN"];

        var name = "";
        var pipeline = "SKIN";

        var supported_textures = ["albedo", "normal", "roughness", "metallic"];
        var textures = {"albedo": true};

        widgets.on_refresh = function(){
            widgets.clear();
            widgets.widgets_per_row = 2;
            widgets.addString("Name", name, {width: "70%", placeHolder: "material name", callback: function(v){
                name = v;
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
    
            widgets.addCombo("Pipeline", pipeline, {values: pipelines, callback: function(v){
                pipeline = v;
            }});
            widgets.addSeparator();
            widgets.addButton(null, "Export", {callback: function(){
    
                var foo = {};
                
                for(let t in textures){
                    if(textures[t] == true) // unnamed
                    {
                        LiteGUI.alert("Texture " + t + " needs a name",{title: "error"});
                        return;
                    }
                    foo[t] = "data/textures/" + textures[t] + ".dds";
                }

                var pexport = "";
                var skin = false;

                switch(pipeline){
                    case "SKIN": pexport = "objs_skin.pipeline"; skin = true; break;
                    case "BASIC": pexport = "objs.pipeline"; break;
                }

                foo["pipeline"] = pexport;

                if(skin) foo["uses_skin"] = true;
                if(!name.length) name = "unnamed";
                LiteGUI.downloadFile(name + ".mat", JSON.stringify(foo, null, 4));
            }});
            widgets.addSeparator();
        }

        widgets.on_refresh();
        dialog.add(widgets);
        dialog.makeModal('fade');
        dialog.setPosition(window.innerWidth/2 - w/2, 150);
    },

    openSkeletonFileExporter() {
        
        var that = this;
        var w = 450;
        var title = "Skeleton file exporter";
        var dialog_id = title.replace(/\s/g, "").toLowerCase();
        document.querySelectorAll( "#" + dialog_id ).forEach( e => e.remove() );
        var dialog = new LiteGUI.Dialog( {id: dialog_id, parent: "body", title: title, close: true, width: w, draggable: true });
        var widgets = new LiteGUI.Inspector();
        
        var name = "";
        var animations = [];
        var meshes = [];

        widgets.addString("Name", "", {placeHolder: "skeleton name", callback: function(v){
            name = v;
        }});
        widgets.addSeparator();
        widgets.addInfo(null, "No folder, only animation and mesh names!");
        widgets.addInfo(null, "Separated by lines");
        widgets.addTextarea("Animations", "", {height: "100px", callback: function(v){
            var tkns = v.split("\n");
            for(var t in tkns) {
                animations.push( tkns[t].replace(/\s/g, "") );
            }
        }});
        widgets.addTextarea("Meshes", "", {height: "100px", callback: function(v){
            var tkns = v.split("\n");
            for(var t in tkns) {
                meshes.push( tkns[t].replace(/\s/g, "") );
            }
        }});
        widgets.addSeparator();

        widgets.addButton(null, "Export", {callback: function(){

            var foo = {
                "name": name,
                "anims": [],
                "meshes": meshes
            };

            for(var a in animations) {
                foo["anims"].push( {
                    "name": animations[a]
                } );
            }

            if(!name.length) name = "unnamed";
            LiteGUI.downloadFile(name + ".skeleton", JSON.stringify(foo, null, 4));
        }});
        widgets.addSeparator();
        dialog.add(widgets);
        dialog.makeModal('fade');
        dialog.setPosition(window.innerWidth/2 - w/2, 150);
    }
}