const fs = require("fs");
const path = require("path");

module.exports = {
    gugl: fs.readFileSync(path.join(__dirname, "gugl.html")).toString(),
    iis: fs.readFileSync(path.join(__dirname, "iis.html")).toString(),
    oracle: fs.readFileSync(path.join(__dirname, "oracle.html")).toString(),
    tomcat: fs.readFileSync(path.join(__dirname, "tomcat.html")).toString()
};
