/*
*   Alex Rodriguez
*   @jxarco 
*/

var LTransitionTypes = [
    "",
    "wait_time",
    "wait_state_finished",
    "check_variable"
];

var LTransitionProperties = {
    "time": "float",
    "condition": "string",
    "solo": "bool",
    "mute": "bool"
};

class FSMTransition {
    
    constructor(link) {
        
        if(!app["graph"] || !link) return;
        this.configure(link);
    }

    configure(link, keep_info) {
        
        var get = app["graph"].graph.getNodeById.bind(app["graph"].graph);
        
        this.link = link;
        
        this.id = link.id;
        this.origin = get(link.origin_id).title;
        this.target = get(link.target_id).title;

        if(!keep_info) {
            this.name = this.origin + "-to-" + this.target;
            this.name = this.name.toLowerCase();
    
            this.properties = {
                type: ""
            };
    
            if(!link._data) {
                link._data = {
                    text: this.name
                };
            }else
            {
                link._data.text = this.name;
            }
        }
    }

    isBidirectional() {
        return this.link._data && this.link._data.bidirectional;// && this.link._data.related_link !== undefined;
    }

    serialize() {
        return {
            id: this.id,
            origin: this.origin,
            target: this.target,
            name: this.name,
            properties: this.properties
        };
    }
}

// i don't want to create a transition manager to store this
FSMTransition.All = [];
FSMTransition.GetById = function(id) { return FSMTransition.All.find(e => e.id === id ); }
FSMTransition.GetByName = function(name) { return FSMTransition.All.find(e => e.name === name ); }
FSMTransition.RemoveById = function(id) { 
    const index = FSMTransition.All.findIndex(e => e.id == id);
    if (index > -1) FSMTransition.All.splice(index, 1);
}
FSMTransition.ClearAll = function() { FSMTransition.All.forEach(e => { delete e; }); FSMTransition.All.length = 0; }
FSMTransition.UpdateLinkById = function(id, link){ 
    var t = FSMTransition.All.find(e => e.id === id );
    t.link = link;
}
FSMTransition.UpdateProperty = function(id, property, value){ 
    if(id) { // only one transition
        var t = FSMTransition.All.find(e => e.id === id );
        if(t) t.properties[property] = value;
    } else {
        FSMTransition.All.forEach(e => e.properties[property] = value);
    }
}