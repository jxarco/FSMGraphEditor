/*
*   Alex Rodriguez
*   @jxarco 
*/

// default state types for offline mode
var LStateTypes = [
    "default",
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
        type: "default"
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

//function to call when the node is executed
FSMState.prototype.onExecute = function()
{

}

FSMState.prototype.onDblClick = function()
{
    
}

//register in the system
LiteGraph.registerNodeType("states/default", FSMState );