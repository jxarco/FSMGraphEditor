/*
*   Alex Rodriguez
*   @jxarco 
*/

// default state types for offline mode
var LStateTypes = [
    "",
    "move",
    "shake",
    "animation",
    "blend_animation"
];

var LStateProperties = {
    "duration": "float",
    "anim": "string",
    "amount": "float",
    "loop": "bool",
    "offset": "string",
    "root_motion": "bool",
    "blend_time": "float",
    "b_sample0": "string",
    "b_sample1": "string",
    "b_sample2": "string",
}

var LStateTypeData = {
    "move": ["duration", "offset"],
    "shake": ["amount"],
    "animation": ["anim", "loop", "root_motion"],
    "blend_animation": ["b_sample0", "b_sample1", "b_sample2", "blend_time", "root_motion"]
}

//node constructor class
function FSMState()
{
    this.addInput("In", "object");
    this.addOutput("Out","object");
    this.properties = { 
        type: ""
    };

    // make the first created node the initial state by default
    if(!FSMState.InitialState) FSMState.InitialState = this;
}

FSMState.prototype.getNumInputs = function()
{
    // no bidirectional inputs
    var numIns = 0;
    this.inputs.forEach(e => { if(e.link) ++numIns; });

    // get bidirectionals
    for(var i in FSMTransition.All) {
        var t = FSMTransition.All[i];
        if(t.target == this.title && t.link.origin_slot === null) ++numIns;
    }

    return numIns;
}

FSMState.prototype.getNumOutputs = function()
{
    // no bidirectional outputs
    var numOuts = 0;
    this.outputs.forEach(e => { if(e.links) numOuts += e.links.length; });

    // get bidirectionals
    for(var i in FSMTransition.All) {
        var t = FSMTransition.All[i];
        if(t.origin == this.title && t.link.origin_slot === null) ++numOuts;
    }

    return numOuts;
}

FSMState.title = "State";
FSMState.All = {};
FSMState.InitialState = null;
FSMState.GetByName = function(name) { return FSMState.All[name] }
FSMState.RemoveByName = function(name) { delete FSMState.All[name]; }
FSMState.Add = function(name, node) { FSMState.All[name] = node; }
FSMState.ClearAll = function() { FSMState.All = {}; }

//register in the system
LiteGraph.registerNodeType("states/default", FSMState );

function FSMEntryState()
{
    this.addOutput("Out","object");
    this.properties = { 
        type: "default"
    };

    var stateColor = LGraphCanvas.node_colors["green"];

    this.color = stateColor.color;
    this.bgcolor = stateColor.bgcolor;
}

FSMEntryState.title = "Entry";
LiteGraph.registerNodeType("states/entry", FSMEntryState );