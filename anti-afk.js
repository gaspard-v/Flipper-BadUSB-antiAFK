let badusb = require("badusb");
let notify = require("notification");
let eventLoop = require("event_loop");
let gui = require("gui");
let dialog = require("gui/dialog");
let math = require("math");

function getRandUInt16() {
    return math.floor(math.random() * 0xffff);
}

function getRandInterval(interval) {
    let lower = interval[0];
    let upper = interval[1];
    if (upper < lower) lower = upper;
    let randomNumber = math.random() * (upper - lower);
    randomNumber = math.floor(randomNumber);
    return randomNumber + lower;
}

let randomVid = getRandUInt16();
let randomPid = getRandUInt16();
let randInterval = [30000, 60000];
let characters = "a";
let layoutPath = "/ext/badusb/assets/layouts/fr-FR.kl";
// Change to en-EN.kl for QWERTY keyboards

let views = {
    dialog: dialog.makeWith({
        header: "BadUSB anti-AFK",
        text: "Press OK to start",
        center: "Start",
    }),
};

badusb.setup({
    vid: randomVid,
    pid: randomPid,
    mfrName: "Unknown",
    prodName: "Unknown",
    layoutPath: layoutPath,
});

function createRandOneshot(eventLoop, func) {
    let randNum = getRandInterval(randInterval);
    let randNumSec = math.trunc(randNum / 1000);
    print("next in", randNumSec, "seconds");
    let timer = eventLoop.timer("oneshot", randNum);
    eventLoop.subscribe(timer, func, eventLoop);
}

function onOneshot(_subscription, _item, eventLoop) {
    badusb.print(characters);
    notify.blink("blue", "long");
    createRandOneshot(eventLoop, onOneshot);
}

function onInput(_sub, button, eventLoop, gui, hasStarted) {
    if (button !== "center") return [false];

    if (hasStarted === true) return [hasStarted];

    gui.viewDispatcher.sendTo("back");

    if (!badusb.isConnected()) {
        print("USB not connected");
        notify.error();
        badusb.quit();
        eventLoop.stop();
        return [false];
    }

    print("USB is connected");
    createRandOneshot(eventLoop, onOneshot);
    return [true];
}

function onNav(_sub, _item, eventLoop) {
    notify.success();
    badusb.quit();
    eventLoop.stop();
}

eventLoop.subscribe(views.dialog.input, onInput, eventLoop, gui, false);

eventLoop.subscribe(gui.viewDispatcher.navigation, onNav, eventLoop);

gui.viewDispatcher.switchTo(views.dialog);
eventLoop.run();
