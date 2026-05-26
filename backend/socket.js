let io = null;

function setIo(newIo) {
    io = newIo;
}

function getIo() {
    return io;
}

module.exports = {
    setIo,
    getIo,
};