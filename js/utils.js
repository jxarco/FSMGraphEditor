
function sortObject(o) {

    var sortable = [];
    for (var k in o) {
        sortable.push([k, o[k]]);
    }

    sortable.sort(function(a, b) {
        var x = a[0] < b[0] ? -1 : 1; 
        return x; 
    });

    var objSorted = {}
    sortable.forEach(function(item){
        objSorted[item[0]]=item[1]
    });

    return objSorted;
}

function getExtension(filename) {
    return LGraphCanvas.getFileExtension(filename);
}

function ObjectIsEmpty(o) {
    return Object.keys(o).length > 0;
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