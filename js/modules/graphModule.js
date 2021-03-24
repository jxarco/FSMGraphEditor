/*
*   Alex Rodriguez
*   @jxarco 
*/

class GraphModule {

    constructor() {

        var that = this;
        this.icon = "https://webglstudio.org/latest/imgs/tabicon-graph.png";

        var graph = this.graph = new LGraph();
        window.graph = graph;

        this.graph.onNodeConnectionChange = function() {
            that.updateTransitions();
        }

        this.canvas = new LGraphCanvas("#mycanvas", graph);

        // custom canvas properties
        this.canvas.onlyAutoConnect     = true;
        this.canvas.render_link_name    = true;
        this.canvas.autocreate_node     = true;

        var inspectingTransition = false;

        this.canvas.onEscapeKey = function(e) {
            if(!Interface) return;
            Interface.showVariables();
        }

        this.canvas.onNewVariable = function(e) {
            FSMVariable.All.push(new FSMVariable());
            Interface.showVariables();
        }

        this.canvas.onNewNode = function(e) {

           that.addState(null, e);
        }

        this.canvas.onConnectionCreated = function(node, slot, pos) {

            var new_node = that.addState(null, pos);
            node.connect(slot, new_node, 0 );
        }

        this.canvas.onNodeSelected = function(node) {

            if(!Interface) return;
            Interface.onInspectNode(node);
        }

        this.canvas.onNodeDeselected = function(node) {

            if(!Interface || inspectingTransition) {
                inspectingTransition = false;
                return;
            }
            Interface.onInspectNode();
        }

        this.canvas.beforeNodeRemoved = function(node) {

            that.processNodeToRemove(node);
        }

        this.canvas.onSetInitialState = function(node) {

            if(node)
                FSMState.InitialState = node;
        }

        this.canvas.onGetTransitionInfo = function(link_name, link_id) {

            if(Interface) {
                Interface.showTransitions(link_name);
                inspectingTransition = true;
            }
        }

        this.canvas.onTransitionBidirectional = function(link, value) {
            if(link) {
                var t = that.setBidirectionalLink(link.id, !value);
                if(Interface && t) Interface.showTransitions(t.name);
            } 
        }

        this.canvas.onRenameTransition = function(link, event) {

            var t = FSMTransition.GetById(link.id);
            if(!t) return;
    
            that.canvas.prompt("Name", "", function(v){

                t.name = v; 
                t.link._data.text = v;

                if(Interface)
                    Interface.showTransitions();
                
                that.redraw();

            }, event);
        }

        this.canvas.onRenameNode = function(node, value) {

           that.processStateRenamed(node, value);
        }

        this.canvas.onGetLinkName = function(id) {

            var t = FSMTransition.GetById(id);
            if(!t) return;

            return t.name;
        }

        this.canvas.onAutoConnectNode = function(GCanvas, slot, nodeSrc, nodeDst) {

            // cant connect to Entry
            if(nodeDst.type == "states/entry") {
                console.warn("can't connect to Entry input!");
                return;
            }

            // cant connect to itself
            if(nodeSrc.id === nodeDst.id) {
                console.warn("destination node is src node!");
                return;
            }

            if(nodeSrc.inputs && nodeDst.outputs) {

                var bidirectional = false;

                nodeSrc.inputs.forEach(input => {

                    if(!input.link) return;

                    for(var i = 0; i < nodeDst.outputs.length; ++i) {

                        var output = nodeDst.outputs[i];

                        if(!output.links)
                        return;

                        if(output.links.find(e => e == input.link)) {

                            that.setBidirectionalLink(input.link, true);
                            bidirectional = true;
                            return;
                        }
                    }
                });

                if(bidirectional) return;
            }

            // check if already connected to that node
            if(nodeDst.inputs) {

                var connection_repeated = false;

                nodeDst.inputs.forEach(input => {

                    if(!input.link) return;

                    for(var i = 0; i < nodeSrc.outputs.length; ++i) {

                        var output = nodeSrc.outputs[i];

                        if(!output.links)
                        return;

                        if(output.links.find(e => e == input.link)) {
                            console.warn("already connected");
                            connection_repeated = true;
                            return;
                        }
                    }
                });

                if(connection_repeated) return;
            }

            var inputs = nodeDst.inputs;
            
            // node has no inputs: create one and connect at 0
            if(!inputs) {
                nodeDst.addInput("In", "object");
                nodeSrc.connect(slot, nodeDst, 0);
            }
            else {

                var i_slot = 0;
                for(; i_slot < inputs.length; ++i_slot) {

                    var input = inputs[i_slot];

                    // node has a free input
                    if(!input.link)  {
                        nodeSrc.connect(slot, nodeDst, i_slot);
                        return;
                    } 
                }

                // at this point, there is no free input, create one and connect
                nodeDst.addInput("In", "object");
                nodeSrc.connect(slot, nodeDst, i_slot);
            }
        }
    }

    create() {

        this.tab = LiteGUI.main_tabs.addTab( "Graph", {id:"graphtab", bigicon: this.icon, size: "full", content:"", 
			callback: function(tab_id) {
                var canvas = document.getElementById("mycanvas");
                if(!canvas) return;
                Interface.canvas_area.add( canvas );
                var graphModule = app["graph"];
                if(graphModule)
                    graphModule.resize();
            },
			callback_leave: function(tab_id) {}
		});

        this.tab.content.style.background = "rgb(34, 34, 34)";
        this.tab.add( Interface.canvas_area );

        var canvas = document.getElementById("mycanvas");
        LiteGUI.createDropArea( canvas, function(e){

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            for (var i = 0; i < e.dataTransfer.files.length; i++) {
                var file = e.dataTransfer.files[i];
                app["drive"].onDropFile(file);
            }

            app["drive"].tab.click();
        });
    }

    init() {

        this.resize();
        this.applySettings( app["settings"] );
        this.graph.start();

        // var node1 = this.addState("states/entry", [300, 300]);
        var node1 = this.addState("Idle", [300, 300]);
        var node2 = this.addState("Move", [800, 300]);

        node1.connect(0, node2, 0);
    }

    addState(name, e) {

        var type = "states/default";
        var title = name;

        // is type
        if(name && name.includes("/")) {
            type = name;
            title = null;
        }

        var node = LiteGraph.createNode(type);
        node.title = title || node.title;

        if(e.constructor == Array)
            node.pos = e;
        else
            node.pos = [e.localX - node.size[0]*0.5, e.localY];
        
        // check name
        if( FSMState.GetByName(node.title) )
        node.title += "-" + getUid();

        FSMState.Add(node.title, node);

        this.graph.add(node);

        // in case anyone wants it
        return node;
    }

    redraw() {
        this.canvas.dirty_canvas = true;
        this.canvas.dirty_bgcanvas = true;
        this.canvas.dirty_area = null;
    }

    setBidirectionalLink(id, value) {

        var links = this.graph.links;

        for(var i in links) {

            let link = links[i];
            if(link.id == id) {

                if(!link._data) link._data = {};

                var t = null;

                // make opposite transition
                if(value) {
                    // set slots to null, we dont have to render them
                    var new_link = new LiteGraph.LLink(
                        ++this.graph.last_link_id,
                        link.type,
                        link.target_id,
                        null,
                        link.origin_id,
                        null
                    );
                        
                    this.graph.links[new_link.id] = new_link;
                    new_link._data = {};
                    new_link._data["bidirectional"] = true;
                    t = new FSMTransition(new_link);
                    FSMTransition.All.push( t );

                    // set current as bidirectional also
                    link._data["bidirectional"] = true;
                    link._data["related_link"] = new_link.id;
                }
                // remove related transition
                else {
                    delete links[link._data.related_link];
                    link._data = {};
                    
                    FSMTransition.UpdateLinkById(link.id, link);
                    this.updateTransitions();
                }

                this.redraw();
                return FSMTransition.GetById(id);
            }
        }
    }

    processStateRenamed(node, value) {

        // node exists with same name
        var tmp_node = FSMState.GetByName(value);
        if(tmp_node) {
            LiteGUI.alert("Invalid name. State " + tmp_node.id + " has same name", {title: "Error"});
            return;
        }

        node.title = value;

        // search for links using this node
        for( var i in FSMTransition.All ) {

            var t = FSMTransition.All[i];

            // node is used as origin
            if(t.link.origin_id == node.id) {
                t.name = t.name.replace(t.origin.toLowerCase(), value.toLowerCase());
                t.origin = value;
                t.link._data.text = t.name;
            } 
            // node used as target
            else if(t.link.target_id == node.id) {
                t.name = t.name.replace(t.target.toLowerCase(), value.toLowerCase());
                t.link._data.text = t.name;
                t.target = value;
            }else 
                continue;
        }

        this.redraw();
    }

    setLinkData(id, data, value) {

        var links = this.graph.links;

        for(var i in links) {

            let link = links[i];
            if(link.id == id) {

                if(!link._data) link._data = {};

                link._data[data] = value;
                this.redraw();
                return;
            }
        }
    }

    updateTransitions() {

        var links = this.graph.links;

        // remove transitions that no longer exist
        for(var i in FSMTransition.All) {
            var t = FSMTransition.All[i];
            if(!links[t.id]) FSMTransition.RemoveById(t.id);
        }

        // update or create new ones
        for(var i in links) {

            let link = links[i];
            var id = link.id;
            var t = FSMTransition.GetById(id);

            // new transition
            if(!t) {
                FSMTransition.All.push( new FSMTransition(link) );
            }else {
                // update transition keeping name and properties
                t.configure(link, true);
            }
        }

        if(Interface)
            Interface.showTransitions();
    }

    processNodeToRemove(node) {

        // console.log(node);
        FSMState.RemoveByName(node.title);

        // deleting target bidirectionality
        if(node.inputs) {
            for(var i in node.inputs) {
                var link_id = node.inputs[i].link;
                this.setBidirectionalLink(link_id, false);
            }
        }

        // deleting src bidirectionality
        if(node.outputs) {
            for(var i in node.outputs) {

                let output = node.outputs[i];
                if(!output.links) continue;

                for(var j in output.links) {
                    var link_id = output.links[j];
                    this.setBidirectionalLink(link_id, false);
                }
            }
        }
    }

    applySettings(settings) {

        for(var k in settings)
        {
            if(this.canvas[k] !== undefined)
            this.canvas[k] = settings[k];
        }

        this.redraw();
    }

    reset() {

        this.canvas.clear();
        this.graph.clear();

        FSMState.ClearAll();
        FSMTransition.ClearAll();
        FSMVariable.ClearAll();
        this.updateTransitions();
        Interface.showVariables();
    }

    resize() {

        var graph_area = document.getElementById("mycanvas").parentElement;

        if(!graph_area)
            return;

        this.canvas.resize(graph_area.offsetWidth, graph_area.offsetHeight);
    }
}

REGISTER_MODULE("graph", GraphModule)