/*
*   Alex Rodriguez
*   @jxarco 
*/

LVariableTypes = [
    "int",
    "float",
    "bool",
    "string",
    "vec2",
    "vec3"
];

class FSMVariable {
    
    constructor(name, type, value) {

        this.name = name || "var" + FSMVariable.numVars++;
        this.type = type || "string";
        this.value = value;

        if(this.value !== undefined && value !== null)
            this.checkValue();
        else
        {
            switch(this.type) {
                case "int":
                case "float": this.value = 0; break;
                case "bool": this.value = false; break;
                case "string": this.value = ""; break;
                case "vec2": this.value = new Float32Array(2); break;
                case "vec3": this.value = new Float32Array(3); break;
                default: this.value = 0;
            }
        }
    }

    checkValue() {

        switch(this.type) {
            case "int":
            case "float": if(this.value.constructor !== Number) this.value = null; break;
            case "bool": if(this.value.constructor !== Boolean) this.value = null; break;
            case "string": if(this.value.constructor !== String) this.value = null; break;
            case "vec2": 
                if(this.value.constructor !== String) {
                    this.value = null; break;
                }
                this.fillVECN(this.value, 2);
                break;
            case "vec3": 
                if(this.value.constructor !== String) {
                    this.value = null; break;
                }
                this.fillVECN(this.value, 3);
                break;
        }
    }

    fillVECN(str, n) {
        this.value = new Float32Array(n);
        var tkns = str.split(" ");
        for(var i = 0; i < n; ++i)
        this.value[i] = parseFloat(tkns[i]);
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
            case "vec2":
            case "vec3":
                // stringify vector: [1, 2, 3] -> "1 2 3"
                var string = "";
                for(var i in value){
                    string += " " + value[i];
                }

                value = string.substr(1);
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
FSMVariable.sort = 1;

FSMVariable.All = [];
FSMVariable.GetByName = FSMVariable.Exists = function(name) { return FSMVariable.All.find(e => e.name === name ); };
FSMVariable.RemoveByName = function(name) { 
    const index = FSMVariable.All.findIndex(e => e.name == name);
    if (index > -1) FSMVariable.All.splice(index, 1);
};
FSMVariable.ClearAll = function() { FSMVariable.All.forEach(e => { delete e; }); FSMVariable.All.length = 0; };
FSMVariable.Sort = function(p) {
    FSMVariable.All.sort((a, b) => (a[p] > b[p] ? this.sort : -this.sort));
    this.sort = -this.sort;
}

// by default variables
FSMVariable.All.push( new FSMVariable("enabled", "bool", false) );