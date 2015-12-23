interface IVec2 {
	x: number;
	y: number;
}

class Xmas {
	static FlakeChars: string = "❄❅❆"
	static StarChars: string = "★☆✡✰";
	static BaseStarHeight: number = 30;
	static BaseFlakeHeight: number = 50;
	static WindowWidth: number = window.innerWidth;
	static WindowHeight: number = window.innerHeight;
	static FPS = 30;
	static Greetings: Array<string> = ["Happy Holidays", "Merry Christmas", "God Jul", "Feliz Navidad", "Wesołych Świąt", "Frohe Weihnachten", "Feliz Natal"];
	static GreetTimeout: number = 2000;

	css: string = `#thepanel {position:absolute; width:100%; height:100%; z-index:100000; top:0; left:0; background-color:#000; opacity:0.6;}\n
	.flake {z-index: 1; position:absolute; top:0; left:0; font-size:` + (Xmas.BaseFlakeHeight / 1.3) + `px; width:` + Xmas.BaseFlakeHeight + `px; height:` + Xmas.BaseFlakeHeight + `px; color: #ffffff; opacity: 1.0; text-align: center;}\n
	.star {z-index: 1; position:absolute; top:0; left:0; font-size:` + (Xmas.BaseStarHeight / 1.3) + `px; width:` + Xmas.BaseStarHeight + `px; height:` + Xmas.BaseStarHeight + `px; color: #ffffff; opacity: 0.6; text-align: center;}\n
	#thegreeting {font-family: "Comic Sans MS", cursive, sans-serif; z-index: 2; position:absolute; top:0; left:0; right:0; bottom:0; margin:auto; height:300px; width: 100%; font-size:180px; line-height:normal; background-color:transparent; color: #f00000; vertical-align:middle; text-align:center; white-space: nowrap;} 
	@-webkit-keyframes twinkle { 0% { opacity: 0.6; } 90% { opacity: 0.6; } 95% { opacity: 1.0; }} 
	@keyframes twinkle { 0% { opacity: 0.6; } 90% { opacity: 0.6; } 95% { opacity: 1.0; }}
	.star {-webkit-animation: twinkle 5s infinite; animation: twinkle 5s infinite;} 
	`
	FlakeTemplate: string = "<div id=\"{$id}\" class=\"flake\">{Xmas.getRandomFlake()}</div>"
	StarTemplate: string = "<div id=\"{$id}\" class=\"star\">{Xmas.getRandomStar()}</div>"
	GreetingTemplate: string = "<div id=\"thegreeting\">{this.getMessage()}</div>"
	Greeting: HTMLElement = null;
	Panel: HTMLElement = null;
	Style: HTMLStyleElement = null;
	flakes: Array<HTMLElement> = [];
	stars: Array<HTMLElement> = [];
	flakePos: Array<IVec2> = [];
	starPos: Array<IVec2> = [];
	flakeSpeed: Array<number> = [];
	flakeScale: Array<number> = [];
	flakeRotation: Array<number> = [];
	flakeRotationSpeed: Array<number> = [];
	starCount: number = 30;
	flakeCount: number = 100;
	time: number = 0;
	oldTime: number = 0;
	timeSpent: number = 0;
	running: boolean = false;
	msPerFrame: number = 0;
	greetTime: number = 0;
	greetPos: number = 0;
	timeToGreet: boolean = false;

	static toArray = function(a: ArrayLike<any>) {
		return Array.prototype.slice.call(a);
	}
	static randomInt(size: number): number {
		return (Math.random() * size) | 0;
	}
	static randomFloat(s: number, e: number): number {
		return (Math.random() * (e - s)) + s;
	}
	static createElement(inner: string, tagHint: string = ""): HTMLElement {
		var holder = document.createElement("div");
		var tag: HTMLElement;
		switch (tagHint) {
			case "style":
				tag = document.createElement(tagHint);
				tag.innerHTML = inner;
				holder.appendChild(tag);
				break;
			default:
				holder.innerHTML = inner;
		}
		return <HTMLElement>holder.children[0];
	}
	static getRandomChar(chars: string): string {
		var num = Xmas.randomInt(chars.length);
		return chars[num];
	}
	static getRandomFlake(): string {
		return Xmas.getRandomChar(Xmas.FlakeChars);
	}
	static getRandomStar(): string {
		return Xmas.getRandomChar(Xmas.StarChars);
	}
	static drawTemplate(template: string, parent: HTMLElement, id?: string, context?: any): HTMLElement {
		var templateParts: Array<string> = [];
		var pos = 0;
		var s: number = 0, e: number = 0;
		var expr: string = "";
		var obj: any = {};
		while (pos < template.length) {
			s = template.indexOf("{", pos)
			if (s === -1) {
				templateParts.push(template.substring(pos));
				break;
			}
			templateParts.push(template.substring(pos, s));
			s++;
			e = template.indexOf("}", s);
			if (e === -1) {
				throw ("DUDE! your template sucks");
			}
			expr = "return " + template.substring(s, e);
			if (id !== undefined && expr.indexOf("$id") !== -1) {
				expr = expr.replace("$id", "\"id\"");
			}
			var fn = new Function(expr);
			templateParts.push(fn.call(context || this));
			pos = ++e;
		}
		template = templateParts.join("");

		var el = Xmas.createElement(template);
		var existing: HTMLElement;
		if (existing = <HTMLElement>parent.querySelector("#" + id)) {
			parent.replaceChild(el, existing);
		} else {
			parent.appendChild(el);
		}
		return el;
	}

	constructor() {
		this.Panel = Xmas.createElement("<div id=\"thepanel\"></div>");
		this.Style = <HTMLStyleElement>Xmas.createElement(this.css, "style");
		setTimeout(this.start.bind(this));
	}
	getMessage(): string {
		return Xmas.Greetings[this.greetPos];
	}
	start() {
		var i: number;
		var windowWidth = Xmas.WindowWidth = window.innerWidth;
		var windowHeight = Xmas.WindowHeight = window.innerHeight;
		var starSpan = windowHeight / 3.0;
		this.Greeting = Xmas.drawTemplate(this.GreetingTemplate, this.Panel, "thegreeting", this);
		for (i = 0; i < this.starCount; i++) {
			this.stars.push(Xmas.drawTemplate(this.StarTemplate, this.Panel, "star" + i));
			this.starPos.push({ x: Xmas.randomInt(windowWidth), y: Xmas.randomInt(starSpan) });
			this.stars[i].style.transform = "translate(" + this.starPos[i].x + "px, " + this.starPos[i].y + "px) scale(" + Xmas.randomFloat(0.8, 1.3) + ")";
			this.stars[i].style.animationDelay = Xmas.randomFloat(0.0, 2.5) + "s";
		}
		for (i = 0; i < this.flakeCount; i++) {
			this.flakes.push(Xmas.drawTemplate(this.FlakeTemplate, this.Panel, "flake" + i));
			this.flakePos.push({ x: Xmas.randomInt(windowWidth), y: -100 });
			this.flakeSpeed.push(Xmas.randomFloat(0.01, 0.2));
			this.flakeScale.push(Xmas.randomFloat(0.3, 1.3));
			this.flakeRotation.push(Xmas.randomInt(360));
			this.flakeRotationSpeed.push(Xmas.randomFloat(8, 36.0) / Xmas.FPS);
			this.flakes[i].style.transform = "translate(" + this.flakePos[i].x + "px, " + this.flakePos[i].y + "px) scale(" + this.flakeSpeed[i] + ") rotateY(" + this.flakeRotation[i] + "deg)";
			this.flakes[i].style.zIndex = (this.flakeScale[i] < 1.0 ? 1 : 3).toString();
		}
		this.Panel.addEventListener("click", () => { this.destroy(); });
		this.Panel.addEventListener("touchend", () => { this.destroy(); });
		this.Panel.addEventListener("pointerup", () => { this.destroy(); });
		document.body.appendChild(this.Style);
		document.body.appendChild(this.Panel);
		this.msPerFrame = 1000.0 / Xmas.FPS;
		this.running = true;
		this.oldTime = window.performance.now();
		this.timeSpent = 0.0;
		this.update();
	}
	update() {
		if (!this.running) return;
		this.timeSpent = 0.0;
		this.time = window.performance.now();
		var i: number;
		var greetDiff = this.time - this.greetTime;
		if (greetDiff > Xmas.GreetTimeout) {
			this.timeToGreet = true;
			this.greetTime = this.time;
			this.greetPos = (this.greetPos + 1) % Xmas.Greetings.length;
		}
		for (i = 0; i < this.flakeCount; i++) {
			if (this.flakePos[i].y > Xmas.WindowHeight) {
				this.flakePos[i].y -= (Xmas.WindowHeight + 100);
			}
			this.flakePos[i].y += Xmas.WindowHeight * this.flakeSpeed[i] / Xmas.FPS;
			this.flakeRotation[i] = (this.flakeRotation[i] + this.flakeRotationSpeed[i]) % 360;
		}
		this.draw();
	}
	draw() {
		var i: number;
		if (this.timeToGreet) {
			this.Greeting = Xmas.drawTemplate(this.GreetingTemplate, this.Panel, "thegreeting", this);
		}
		for (i = 0; i < this.flakeCount; i++) {
			this.flakes[i].style.transform = "translate(" + this.flakePos[i].x + "px, " + this.flakePos[i].y + "px) scale(" + this.flakeScale[i] + ") rotateY(" + this.flakeRotation[i] + "deg)";
		}
		this.nextFrame();
	}
	nextFrame() {
		this.timeSpent += window.performance.now() - this.time;
		if (this.msPerFrame - this.timeSpent > 16.6) {
			window.requestAnimationFrame(this.nextFrame.bind(this));
		} else {
			window.requestAnimationFrame(this.update.bind(this));
		}
	}
	destroy() {
		this.running = false;
		var panel = this.Panel;
		if (this.Greeting.parentNode) this.Greeting.parentNode.removeChild(this.Greeting);
		if (panel.parentNode) panel.parentNode.removeChild(panel);
		if (this.Style.parentNode) this.Style.parentNode.removeChild(this.Style);
		while (panel.firstChild) {
			panel.removeChild(panel.firstChild);
		}
		this.stars.length = 0;
		this.flakes.length = 0;
		this.starPos.length = 0;
		this.flakePos.length = 0;
		this.flakeScale.length = 0;
	}
}
var xmas = new Xmas();