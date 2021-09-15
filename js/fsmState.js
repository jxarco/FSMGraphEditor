/*
*   Alex Rodriguez
*   @jxarco 
*/

// default state types for offline mode
var LStateTypes = [
    "",
    "any",
    "animation",
    "blend_animation"
];

var LStateProperties = {
    "anim": "string",
    "loop": "bool",
    "root_motion": "bool",
    "root_yaw": "bool",
    "keep_action": "bool",
    "custom_start": "bool",
    "back_cycle": "string",
    "link_variable": "string",
    "blend_time": "float",
    "blend_out": "float",
    "blendspace": "group",
    "timings": "string",
    "cancel": "string",
    "callbacks": "string",
    "async": "group"
}

var LStatePropertyGroups = {
    "blendspace": {
        "bldspace_sample0": "string",
        "bldspace_sample1": "string",
        "bldspace_sample2": "string"
    },
    "async": {
        "async_name": "string",
        "async_blendIn": "float",
        "async_blendOut": "float",
        "async_interval": "float",
        "async_randomInterval": "bool",
        "async_restrictToBlendFactor": "bool",
        "async_blendFactorRestriction": "string"
    }
}

var LStateTypeData = {
    // "move": ["duration", "offset"],
    // "shake": ["amount"],
    "animation": ["anim", "loop", "root_motion", "root_yaw", "keep_action", "back_cycle", "blend_out"],
    "blend_animation": ["blendspace", "blend_time", "root_motion"]
}

//node constructor class
function FSMState()
{
    this.addInput("In", "object");
    this.addOutput("Out","object");
    this.properties = { 
        type: ""
    };

    this.useCustomType = false;

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

FSMState.prototype.setRelatedProperties = function(relatedProps, relations)
{
    for(var i in relatedProps) {
        var prop = relatedProps[i];

        // don't add if already has it
        if(this.properties[prop]) continue;

        var propType = relations[prop];

        var value;
        switch(propType) {
            case "int":
            case "float": value = 0; break;
            case "bool": value = false; break;
            case "string":  value = ""; break;
            case "group":  
                this.setGroupRelatedProperties(LStatePropertyGroups[prop]);
                // don't store any value here
                continue;
            default: value = 0;
        }

        this.properties[prop] = value;
    }
}

FSMState.prototype.setGroupRelatedProperties = function(group)
{
    for(var i in group) {

        // don't add if already has it
        if(this.properties[i]) continue;

        var propType = group[i];

        var value;
        switch(propType) {
            case "int":
            case "float": value = 0; break;
            case "bool": value = false; break;
            case "string":  value = ""; break;
            default: value = 0;
        }

        this.properties[i] = value;
    }
}

FSMState.prototype.addNewBlendSample = function()
{
    var nsample = 0;

    Object.keys(this.properties).forEach(function(v){
        if(isBlendSample(v))
        nsample++;
    });

    this.properties["bldspace_sample" + nsample] = "";
    this.properties = sortObject(this.properties, "type");
}

FSMState.prototype.getTitle = function()
{
    if(this.is_shortcut && this.shortcut_target) {
        return this.shortcut_target.title + " (Shortcut)";
    }else {
        return this.title;
    }
}

FSMState.prototype.getFinalState = function()
{
    if(this.is_shortcut && this.shortcut_target) {
        return this.shortcut_target;
    }else {
        return this;
    }
}

FSMState.prototype.getFirstFreeInputSlot = function() {

    if(!this.inputs) 
    return -1;

    for(var i in this.inputs) {
        var input = this.inputs[i];
        if(!input.link) return parseInt(i);
    }

    return -1;
}

FSMState.title = "State";
FSMState.All = {};
FSMState.InitialState = null;
FSMState.GetByName = function(name) { return FSMState.All[name] }
FSMState.RemoveByName = function(name) { delete FSMState.All[name]; }
FSMState.Add = function(name, node) { FSMState.All[name] = node; }
FSMState.ClearAll = function() { FSMState.All = {}; }
FSMState.GetGroupParent = function(p){
    for(var i in LStatePropertyGroups){
        for(var j in LStatePropertyGroups[i]){
            if(j == p) return i;
        }
    }
};

//register in the system
LiteGraph.registerNodeType("states/default", FSMState );
LiteGraph.registerNodeType("states/shortcut", FSMState );

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