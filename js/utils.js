function getUid( large ){
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+ (large ? "-"+S4()+"-"+S4()+"-"+S4() : "") );
}

function sortAlphabetically(a) {

    if(a[0].constructor !== String) 
        return a;

    var array = [].concat(a);
    array.sort(function(a, b) {
        var x = a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0); 
        if(!x) x = a[1] < b[1] ? -1 : 1; 
        return x; 
    });

    return array;
}

function sortObject(o, exclude) {

    var sortable = [];
    for (var k in o) {
        if(k == exclude) continue;
        sortable.push([k, o[k]]);
    }

    sortable.sort(function(a, b) {
        var x = a[0] < b[0] ? -1 : 1; 
        return x; 
    });

    var objSorted = {}

    if(exclude) objSorted[exclude] = o[exclude];

    sortable.forEach(function(item){
        objSorted[item[0]]=item[1]
    });

    return objSorted;
}

function getExtension(filename) {
    return LGraphCanvas.getFileExtension(filename);
}

function ObjectIsEmpty(o) {
    if(!o) return true;
    return Object.keys(o).length > 0;
}

function ObjectSize(o) {
    if(!o) return 0;
    return Object.keys(o).length;
}

function getObjectClassName(obj) {
    if (!obj)
        return;

    if(obj.constructor.fullname) //this is to overwrite the common name "Prefab" for a global name "ONE.Prefab"
        return obj.constructor.fullname;

    if(obj.constructor.name)
        return obj.constructor.name;

    var arr = obj.constructor.toString().match(
        /function\s*(\w+)/);

    if (arr && arr.length == 2) {
        return arr[1];
    }
}

function getDecimalFraction(x) {

    var int_part = Math.trunc(x);
    return [int_part, Number((x-int_part).toFixed(4))];
}

function isBlendSample(str) {
    return str.includes("sample");
}

function updateContainer(old, current)
{
    if(old.constructor != current.constructor)
        throw("BAD CONTAINER UPDATE");

    if(old.constructor == Array)
    {
        var new_container = [].concat(old);

        for(var i = 0; i < current.length; ++i)
        {
            var index = old.indexOf(current[i]);
            if(index < 0)
            {
                new_container.push(current[i]);
            }else
            {
                new_container[index] = current[i];
            }
        }
    }
    else
    {
        Object.assign(old, current);
    }
}

function setNodeColor(node, c) {

    if(!node)
    return;

    var stateColor = LGraphCanvas.node_colors[c];
    if(!stateColor){
        console.warn("can't apply color: ", c)
        return;
    }

    node.color = stateColor.color;
    node.bgcolor = stateColor.bgcolor;
    node.fontcolor = stateColor.fontcolor;
}