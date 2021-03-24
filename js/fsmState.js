/*
*   Alex Rodriguez
*   @jxarco 
*/

// default state types for offline mode
var LStateTypes = [
    "",
    "move",
    "shake"
];

var LStateProperties = {
    "duration": "Number",
    "offset": "String"
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