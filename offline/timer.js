function Timer(callback, delay) {
    var timerId, start, remaining = delay,running=false;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
		running=false;
    };
	this.On = function()
	{
		return running;
	}
    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining)
		running=true;
    };

    this.resume();
}

/*
var timer = new Timer(function() {
    alert("Done!");
}, 1000);
timer.pause();
// Do some stuff...
timer.resume();f
*/
