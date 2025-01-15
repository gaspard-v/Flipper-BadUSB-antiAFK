let badusb = require("badusb");
let notify = require("notification");
let eventLoop = require("event_loop");
let gui = require("gui");
let submenuView = require("gui/submenu");
let math = require("math");
let textBoxView = require("gui/text_box");

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
    textBox: textBoxView.makeWith({
        text: "None",
    }),
    menu: submenuView.makeWith({
        items: ["Start", "Exit app"],
    }),
};

badusb.setup({
    vid: randomVid,
    pid: randomPid,
    mfrName: "USB",
    prodName: "USB",
    layoutPath: layoutPath,
});

let START = false;

function createRandOneshot(eventLoop, func) {
    let randNum = getRandInterval(randInterval);
    let randNumSec = math.trunc(randNum / 1000);
    print("next in", randNumSec, "seconds");
    let timer = eventLoop.timer("oneshot", randNum);
    eventLoop.subscribe(timer, func, eventLoop);
}

function onOneshot(_subscription, _item, eventLoop) {
    if (START === false) return;
    badusb.print(characters);
    notify.blink("blue", "long");
    createRandOneshot(eventLoop, onOneshot);
}

function onChosen(_sub, index, eventLoop, gui, views) {
    if (index === 1) {
        notify.success();
        badusb.quit();
        eventLoop.stop();
        return;
    }

    if (!badusb.isConnected()) {
        notify.error();
        views.textBox.set("text", "USB not connected");
        gui.viewDispatcher.switchTo(views.textBox);
        return;
    }
    views.textBox.set("text", "Anti AFK is running ...");
    gui.viewDispatcher.switchTo(views.textBox);
    START = true;
    createRandOneshot(eventLoop, onOneshot);
}

function onNav(_sub, _item, gui, views) {
    START = false;
    gui.viewDispatcher.switchTo(views.menu);
}

eventLoop.subscribe(views.menu.chosen, onChosen, eventLoop, gui, views);

eventLoop.subscribe(gui.viewDispatcher.navigation, onNav, gui, views);

gui.viewDispatcher.switchTo(views.menu);
eventLoop.run();
