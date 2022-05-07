const hacks = [
    require("./OSNetworkInterfacesMonkeyPatch")
];

module.exports = {
    apply: () => {
        hacks.forEach(hack => {
            hack.apply();
        });
    }
};
