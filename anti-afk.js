let badusb = require("badusb");
let notify = require("notification");
let eventLoop = require("event_loop");
let gui = require("gui");
let dialog = require("gui/dialog");
let math = require("math");

let views = {
    dialog: dialog.makeWith({
        header: "BadUSB anti-AFK",
        text: "Press OK to start",
        center: "Start",
    }),
};

function randomUInt16() {
	return math.floor(math.random() * 0xFFFF);
}

const randomVid = randomUInt16();
const randomPid = randomUInt16();

badusb.setup({
    vid: randomVid,
    pid: randomPid,
    mfrName: "Unknown",
    prodName: "Unknown",
    layoutPath: "/ext/badusb/assets/layouts/fr-FR.kl" // Change to en-EN.kl for QWERTY keyboards
});

function onPeriodic(_subscription, _item, eventLoop) {
	badusb.print("a");
}

function onInput(_sub, button, eventLoop, gui, hasStarted) {
    if (button !== "center")
        return [false];
	
	if (hasStarted === true)
		return [hasStarted];

    gui.viewDispatcher.sendTo("back");
	
	if (!badusb.isConnected()) {
		print("USB not connected");
        notify.error();
		badusb.quit();
		eventLoop.stop();
		return [false];
	}
	
	print("USB is connected");
	
	const timerSec = 30000; // 30 seconds
	let timer = eventLoop.timer("periodic", timerSec);
	
	eventLoop.subscribe(
		timer, 
		onPeriodic,
		eventLoop
	);
	return [true];
}

function onNav(_sub, _item, eventLoop) {
	notify.success();
	badusb.quit();
	eventLoop.stop();
}

eventLoop.subscribe(
	views.dialog.input, 
	onInput, 
	eventLoop, 
	gui,
	false
);


eventLoop.subscribe(
	gui.viewDispatcher.navigation, 
	onNav, 
	eventLoop
);

gui.viewDispatcher.switchTo(views.dialog);
eventLoop.run();
