const TimeSyncPacket = function() {
    this.header = Buffer.alloc(2 + 2 + 4 + 4 + 4 + 16);
    this.header[0] = 0x21;
    this.header[1] = 0x31;

    for(let i=4; i<32; i++) {
        this.header[i] = 0xff;
    }

    this.header.writeUInt16BE(32, 2);
    //So basically the robot is syncing its time with itself..
    this.header.writeUInt32BE(Math.floor(Date.now() / 1000), 12);
};

module.exports = TimeSyncPacket;