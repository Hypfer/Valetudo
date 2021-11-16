const fs = require("fs");
const path = require("path");

module.exports = {
    iis: fs.readFileSync(path.join(__dirname, "iis.html")).toString(),
    oracle: fs.readFileSync(path.join(__dirname, "oracle.html")).toString(),
    tomcat: fs.readFileSync(path.join(__dirname, "tomcat.html")).toString()
};
