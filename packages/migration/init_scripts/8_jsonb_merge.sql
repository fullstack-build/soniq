-- Thanks to @phillip-haydon https://gist.github.com/phillip-haydon/54871b746201793990a18717af8d70dc

CREATE OR REPLACE FUNCTION jsonb_merge(left JSONB, right JSONB) RETURNS JSONB AS $$

var mergeJSON = function (target, add) {
    function isObject(obj) {
        if (typeof obj == "object") {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return true; // search for first object prop
                }
            }
        }
        return false;
    }
    for (var key in add) {
        if (add.hasOwnProperty(key)) {
            if (target[key] && isObject(target[key]) && isObject(add[key])) {
                mergeJSON(target[key], add[key]);
            } else {
                target[key] = add[key];
            }
        }
    }
    return target;
};

return mergeJSON(left, right);

$$ LANGUAGE plv8;