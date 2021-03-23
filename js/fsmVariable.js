/*
*   Alex Rodriguez
*   @jxarco 
*/

// LVariableTypes = {
//     "int": "Number",
//     "float": "Number",
//     "bool": "Boolean",
//     "string": "String"
// };

LVariableTypes = [
    "int",
    "float",
    "bool",
    "string"
];

class FSMVariable {
    
    constructor(name, value, type) {

        this.name = name || "var" + FSMVariable.numVars++;
        this.type = type || "string";
        this.value = value !== undefined ? value : "default";
    }

    serialize() {

        // check possible invalid type/value

        var value = this.value;

        switch(this.type) {

            case "int":

                var fraction = getDecimalFraction(this.value);

                // convert value to int
                if(Math.abs(fraction[1]) > 0) {
                    value = fraction[0];
                    console.warn("Variable " + this.name + " converted to integer (" + this.value + " to " + value + ")");
                }

                break;
            // ...
        }

        return   {
            name: this.name,
            type: this.type,
            default_value: value
        };
    }
}

FSMVariable.numVars = 0;

FSMVariable.All = [];
FSMVariable.GetByName = FSMVariable.Exists = function(name) { return FSMVariable.All.find(e => e.name === name ); };
FSMVariable.RemoveByName = function(name) { 
    const index = FSMVariable.All.findIndex(e => e.name == name);
    if (index > -1) FSMVariable.All.splice(index, 1);
};
FSMVariable.ClearAll = function() { FSMVariable.All.forEach(e => { delete e; }); FSMVariable.All.length = 0; };

// testing
FSMVariable.All.push( new FSMVariable("speed", 0.5, "float") );
FSMVariable.All.push( new FSMVariable("enabled", false, "bool") );