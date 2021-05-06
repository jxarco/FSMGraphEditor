/*
*   Alex Rodriguez
*   @jxarco 
*/

class DriveModule {

    constructor() {

        this.files = {};

        this.valid_extensions = ["fsmgraph"];
        this.dontShowFSMSaveTip = false;
        this.icon = "https://webglstudio.org/latest/imgs/tabicon-drive.png";
    }

    create() {

        this.tab = LiteGUI.main_tabs.addTab( "Drive", {id:"drivetab", bigicon: this.icon, size: "full", content:"", 
			callback: function(tab_id) {

                temp_div.appendChild(  document.getElementById("mycanvas") );
                app.graph.resize();
            },
			callback_leave: function(tab_id) {}
		});

        var that = this;
        var area = Interface.drive_area;

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

        window.drive = this;
    }

    init() {

        if(app["graph"])
            app["graph"].resize();
        this.createDriveUI();
    }

    createDriveUI() {

        var widgets = this.widgets, that = this;

        widgets.on_refresh = (function() {

            widgets.clear();
            that.createExportSettings();
            that.createFileSettings();

        }).bind(this);

        widgets.on_refresh();
    }
    
    createExportSettings() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("Export settings");
        widgets.addSeparator();
    
        var selectedFilename = this.lastFileLoaded ? this.lastFileLoaded.split(".").shift() : null;
        widgets.addString("File name", selectedFilename, {placeHolder: "without extension", callback: function(v){ selectedFilename = v; }});
        widgets.addSpace(5);
        widgets.widgets_per_row = 2;
        widgets.addButton(null, "Export scene (.fsmgraph)", {callback: function(){

            selectedFilename = selectedFilename || "unnamed";
            that.exportFile(selectedFilename + ".fsmgraph");
        }});
        widgets.addButton(null, "Export FSM (.fsm)", {callback: function(){

            selectedFilename = selectedFilename || "unnamed";
            that.exportFile(selectedFilename + ".fsm", true);

            if(that.dontShowFSMSaveTip) return;
            LiteGUI.choice(".fsm files can't be imported. Save also the scene graph!", ["Don't show again", "Close"], function(v){
                if(v != "Close") that.dontShowFSMSaveTip = true;
            }, {title: "Tip", width: 350});
        }});
        widgets.widgets_per_row = 1;
        widgets.addSpace(5);
    }

    createFileSettings() {

        var widgets = this.widgets, that = this;

        widgets.addTitle("Memory");
        widgets.addSeparator();

        var files_area = new LiteGUI.Area({id :"browserarea", content_id:"browser-area", autoresize: true, inmediateResize: true});

        this.browser_container = files_area.content;
        this.browser_container.classList.add("resources-panel-container");
        // this.browser_container.style.height = "700px";

        LiteGUI.createDropArea( this.browser_container, function(e){

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            for (var i = 0; i < e.dataTransfer.files.length; i++) {
                var file = e.dataTransfer.files[i];
                that.onDropFile(file);
            }
        });

        widgets.root.appendChild( this.browser_container );
        this.showInBrowserContent();
    }

    onDropFile(file) {

        var filename = file.name;

        var ext = getExtension(filename);
        if(this.valid_extensions.indexOf(ext) == -1) {
            LiteGUI.alert("invalid extension", {title: "Error importing file"});
            return;
        }

        this.files[filename] = file;
        this.lastFileLoaded = filename;

        // update files content
        this.createDriveUI();
        this.showInBrowserContent();
    }

    parseFile(filename) {

        var that = this;
        var reader = new FileReader();
        var file = this.files[filename];

        reader.onload = function(event){
            var result = event.target.result;
            var fsmData = JSON.parse(result);
            LiteGUI.confirm("Current FSM will be lost", function(v){
                if(v) that.importFile(fsmData);
            }, {title: "Load FSM" });
        }
        reader.readAsText( file );
    }

    exportFile(filename, exportFsm) {

        filename = filename || "export.graph";
        var jData;

        if(exportFsm) {

            jData = this.getFSM();
        }else {

            var graph = app["graph"].graph;
            if(!graph) return;
    
            var jFsm = this.serialize();
            var jGraph = graph.serialize();
            jData = {
                fsm: jFsm,
                graph: jGraph
            };
        }
       
        if(jData)
            LiteGUI.downloadFile(filename, JSON.stringify(jData, null, 4));
        else
        {
            LiteGUI.alert("Can't export file. Check console for more detail", {title: "error"});
        }
    }

    getFSM () {

        var error = false;

        var jFsm = {
            initial_state: FSMState.InitialState ? FSMState.InitialState.title : "",
            states: [],
            transitions: [],
            variables: []
        };

        for(var i in FSMState.All) {

            var state = FSMState.All[i];
            var jState = { name: state.title };
            
            error |= this.fillProperties(jState, state.properties);
            if(state.useCustomType) jState.type = state.customType;
            jFsm.states.push(jState);
        }

        for(var i in FSMTransition.All) {

            var transition = FSMTransition.All[i];
            var jTransition = {};
            
            // jTransition["name"] = transition.name;
            jTransition["source"] = transition.origin;
            jTransition["target"] = transition.target;

            for(var p in transition.properties) {
                jTransition[p] = transition.properties[p];
            }

            jFsm.transitions.push(jTransition);
        }

        for(var i in FSMVariable.All) {

            var variable = FSMVariable.All[i];
            var jVariable = variable.serialize();
            jFsm.variables.push(jVariable);
        }

        return error ? null : jFsm;
    }

    fillProperties(target, source) {

        function isBlendSample(str) {
            return str.includes("sample");
        }

        var blendSamples = null;

        for( var p in source ) {

            var prop = source[p];

            // check any special cases
            // its a group but i want to do it different for blending samples
            if(isBlendSample(p)) {
                if(!blendSamples) blendSamples = [];
                var info = prop.split(" ");
                if(info.length < 3 || info.length > 4) {

                    console.error("error exporting blend samples");
                    LiteGUI.alert("Blend sample has no blend factor value", {title: "error"});
                    return true;
                }else{

                    var anim_name = info.shift();
                    var bpoint = info.join(" ");

                    blendSamples.push({ name: anim_name, blend_point: bpoint });
                }
            }else if(p == "cancel"){
                var tkns = prop.toLowerCase().split(" ");
                target[p] = tkns.join("_");
            }else if(p == "callbacks"){
                var tkns = prop.replace(/\s/g, "").split(",");
                target[p] = [];
                for(var t in tkns){
                    target[p].push(tkns[t]);
                }
            }
            // it's a group
            else if(!LStateProperties[p] && p != "type"){
                var gparent = FSMState.GetGroupParent(p);
                // first time filling this
                if(target[gparent] == undefined) target[gparent] = {};
                // fill same way
                p = p.replace(gparent+"_", "");
                target[gparent][p] = prop;
            }else {
                target[p] = prop;
            }
        }

        if(blendSamples) {
            target["anim_samples"] = blendSamples;
        }

        return false;
    }

    serialize() {

        var fsm = {
            initial_state: FSMState.InitialState ? FSMState.InitialState.title : ""
        };

        // serialize transitions info
        // hace falta?
        fsm.transitions = [];
        for(var i = 0; i < FSMTransition.All.length; ++i) {
            var t = FSMTransition.All[i];
            fsm.transitions.push( t.serialize() );
        }

        fsm.variables = [];
        for(var i in FSMVariable.All) {

            var variable = FSMVariable.All[i];
            var jVariable = variable.serialize();
            fsm.variables.push(jVariable);
        }

        // state types and properties
        fsm.registered_state_types              = LStateTypes;
        fsm.registered_state_properties         = LStateProperties;
        fsm.registered_state_property_groups    = LStatePropertyGroups;
        fsm.registered_state_type_data          = LStateTypeData;

        // transition types and properties
        fsm.registered_transition_types = LTransitionTypes;
        fsm.registered_transition_properties = LTransitionProperties;
        fsm.registered_transition_type_data  = LTransitionTypeData;

        var settingshModule = app["settings"];
        fsm.settings = settingshModule.serialize();

        return fsm;
    }

    importFile(data) {

        var graphModule = app["graph"];
        var graph = graphModule.graph;
        if(!graph) return;

        var graph_data = data.graph;
        if(!graph_data) return;

        graphModule.reset();
        graph.configure(graph_data);

        // fill states
        for(var i = 0; i < graph._nodes_in_order.length; ++i) {
            var state = graph._nodes_in_order[i];
            if(state.type !== "states/default") continue;
            FSMState.All[state.title] = state;
        }

        // fill transitions from links to have new updated references
        for(var i in graph.links) {
            var link = graph.links[i];
            FSMTransition.All.push( new FSMTransition(link) );
        }

        var fsm_data = data.fsm;
        if(!fsm_data) return;

        FSMState.InitialState = FSMState.GetByName(fsm_data.initial_state);

        // update links info
        for(var i = 0; i < fsm_data.transitions.length; ++i) {
            var eTransition = fsm_data.transitions[i];
            var id = eTransition.id;
            var t = FSMTransition.GetById(id);
            if(!t) throw("invalid transition id");

            t.name = link._data.text = eTransition.name;
            t.properties = eTransition.properties;
        }

        // load variables

        for(var i in fsm_data.variables) {
            var v = fsm_data.variables[i];
            FSMVariable.All.push(new FSMVariable(v.name, v.type, v.default_value));
        }
        
        // fill registered state and transition types
        LStateTypes             = fsm_data.registered_state_types;
        LStateProperties        = fsm_data.registered_state_properties;
        LStatePropertyGroups    = fsm_data.registered_state_property_groups;
        LStateTypeData          = fsm_data.registered_state_type_data;

        // transition types and properties
        LTransitionTypes        = fsm_data.registered_transition_types;
        LTransitionProperties   = fsm_data.registered_transition_properties;
        LTransitionTypeData     = fsm_data.registered_transition_type_data;

        // other settings

        var settingshModule = app["settings"];
        var settings_data = data.fsm.settings;

        if(settings_data) {
            settingshModule.onlyAutoConnect = settings_data.onlyAutoConnect;
            settingshModule.render_connection_arrows = settings_data.render_connection_arrows;
            settingshModule.links_render_mode = settings_data.links_render_mode;
            settingshModule.render_link_name = settings_data.render_link_name;
            settingshModule.autocreate_node = settings_data.autocreate_node;
        }

        settingshModule.refresh();
        Interface.showVariables();
    }

    showInBrowserContent( options )
    {
        options = options || {};
        var parent = this.browser_container;
        parent.style.height = (160 + Math.trunc(ObjectSize(this.files) / 5) * 130) +  "px";

        // Clear resources panel
        parent.innerHTML = "";

        var title = document.createElement("div");
        title.className = "file-list-title";
        title.innerHTML = "local files";
        parent.appendChild( title );

        var root =  document.createElement("ul");
        root.className = "file-list";
        root.style.height = "calc( 100% - 24px )";
        parent.appendChild( root );

        var items = this.visible_resources = this.files;
        this._last_options = options;

        if(ObjectIsEmpty(items))
            for(var i in items)
            {
                if(i[0] == ":") //local resource
                    continue;
                var item = items[i];
                if(!item.name)
                    item.name = i;
                this.addItemToBrowser( item );
            }
        else
        {
            if(options.content)
                root.innerHTML = options.content;
            else if(options.info)
                root.innerHTML = "<div class='file-list-info'>"+options.info+"</div>";
            else
                root.innerHTML = "<div class='file-list-info'>No items (drag files here)</div>";
        }
    }

    // add a new file to the browser window
    addItemToBrowser( resource )
    {
        var that = this;
        var parent = this.browser_container.querySelector(".file-list");

        var element =  document.createElement("li");
        if(resource.id)
            element.dataset["id"] = resource.id;
        element.dataset["filename"] = resource.name;
        if(resource.fullpath)
            element.dataset["fullpath"] = resource.fullpath;

        var category = ""; //DriveModule.getResourceCategory( resource );

        var type = resource.object_class || resource.category || getObjectClassName( resource );
        /*if(type == "Object") //in server_side resources that dont have category
            type = LS.Formats.guessType( resource.fullpath || resource.filename );*/
        if(!type)
            type = "unknown";
        element.dataset["restype"] = type;
        element.dataset["category"] = category;

        element.className = "resource file-item resource-" + type;
        if(resource.id)
            element.className += " in-server";
        else
            element.className += " in-client";

        element.resource = resource;

        if(resource._modified)
            element.className += " modified";

        var filename = resource.name;
        if(!filename) 
            filename = resource.fullpath || "";

        element.title = type + ": " + resource.name;
        if(filename)
        {
            var clean_name = filename.split(".");
            clean_name = clean_name.shift();// + "<span class='extension'>." + clean_name.join(".") + "</span>";
            element.innerHTML = "<span class='title'>"+clean_name+"</span>";
        }

        var extension = getExtension( filename );
        var type_title = extension;
        if(!type_title || type_title.toUpperCase() == "JSON")
            type_title = type;
        else
            type_title = type_title.toUpperCase();
        

        // var preview = "https://webglstudio.org/projects/present/repository/files/" + folder_selected + "/thb/" + resource.filename.replace(extension, "png");
        // if(preview)
        // {
        //     if( typeof(preview) == "string") 
        //     {
        //         var img = new Image();
        //         img.src = preview;
        //         // img.style.width = "100%";
        //         img.style.height = "100%";
        //         img.style.maxWidth = 200;
        //         img.onerror = function() { this.parentNode.removeChild( this ); }
        //     }
        //     else
        //         img = preview;
        //     element.appendChild(img);
        // }
        
        var info = document.createElement("span");
        info.className = "info";
        info.innerHTML = "<span class='category'>" + category + "</span><span class='extension'>." + type_title.toLowerCase() + "</span>";
        element.appendChild(info);

        element.addEventListener("click", item_selected);
        element.addEventListener("dblclick", item_dblclick);

        parent.appendChild(element);

        //when the resources is clicked
        function item_selected(e)
        {
            var path = element.dataset["fullpath"] || element.dataset["filename"];

            var items = parent.querySelectorAll(".selected");
            for(var i = 0; i < items.length; ++i)
                items[i].classList.remove("selected");
            element.classList.add("selected");
            LiteGUI.trigger( that, "item_selected", element );
            LiteGUI.trigger( that, "resource_selected", path );
            that.selected_item = element;
        }

        function item_dblclick(e)
        {
            that.parseFile(filename);
        }

        element.addEventListener("contextmenu", function(e) { 
            if(e.button != 2) //right button
                return false;
            that.showItemContextMenu(this, e);
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault(); 
            return false;
        });
    }

    showItemContextMenu( item, event )
    {
        var that = this;
        var actions = ["Load", "Delete"];
    
        var menu = new LiteGUI.ContextMenu( actions, { ignore_item_callbacks: true, event: event, title: "Resource", callback: function(action, options, event) {
            var fullpath = item.dataset["fullpath"] || item.dataset["filename"];
            if(!fullpath)
                return;

            var filename = item.dataset["filename"];

            if(action == "Load")
            {
                that.parseFile(filename);
            }
            else if(action == "Delete")
            {
                delete that.files[filename];
                drive.showInBrowserContent();
            }
            else
                LiteGUI.alert("Unknown action");
        }});
    }
}

REGISTER_MODULE("drive", DriveModule)