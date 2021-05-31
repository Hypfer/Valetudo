/**
 * See comments for JS datatype which must be provided
 *
 * @enum {string}
 */
const DataType = Object.freeze({
    STRING: "string",  // string
    INTEGER: "integer", // number, will be rounded
    FLOAT: "float", // number
    BOOLEAN: "boolean", // boolean
    ENUM: "enum", // string, which will be checked against format for validity
    COLOR: "color", // string respecting the specification
    DATETIME: "datetime", // Date object
    DURATION: "duration", // number representing the number of seconds of the duration
});

module.exports = DataType;
