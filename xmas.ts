interface IVec2 {
	x: number;
	y: number;
}
enum TemplateType {
	static = 0,
	general = 1,
	text = 2,
	attr = 3
}
interface ITemplatePart {
	part: string;
	templateType: TemplateType;
	forId: string;
}
type Template = Array<ITemplatePart>

interface IDictionary<T> {
	[index: string]: T;
}

function base64ToArrayBuffer(base64String: string): ArrayBuffer {
	var byteNumbers = new Array(base64String.length);
	for (var i = 0; i < base64String.length; i++) {
		byteNumbers[i] = base64String.charCodeAt(i);
	}
	var byteArray = new Uint8Array(byteNumbers);
	return byteArray.buffer;
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

	css: string = `#thepanel {transform:translateZ(0); position:absolute; overflow:hidden; width:100%; height:100%; z-index:100000; top:0; left:0; background-color:#000; opacity:0.6;}\n
	.flake {z-index: 1; position:absolute; top:0; left:0; font-size:` + (Xmas.BaseFlakeHeight / 1.3) + `px; width:` + Xmas.BaseFlakeHeight + `px; height:` + Xmas.BaseFlakeHeight + `px; color: #ffffff; opacity: 1.0; text-align: center;}\n
	.star {z-index: 1; position:absolute; top:0; left:0; font-size:` + (Xmas.BaseStarHeight / 1.3) + `px; width:` + Xmas.BaseStarHeight + `px; height:` + Xmas.BaseStarHeight + `px; color: #ffffff; opacity: 0.6; text-align: center;}\n
	#thegreeting {font-family: "Comic Sans MS", cursive, sans-serif; z-index: 2; position:absolute; top:0; left:0; right:0; bottom:0; margin:auto; height:300px; width: 100%; font-size:180px; line-height:normal; background-color:transparent; color: #f00000; vertical-align:middle; text-align:center; white-space: nowrap;} 
	@-webkit-keyframes twinkle { 0% { opacity: 0.6; } 90% { opacity: 0.6; } 95% { opacity: 1.0; }} 
	@keyframes twinkle { 0% { opacity: 0.6; } 90% { opacity: 0.6; } 95% { opacity: 1.0; }}
	.star {-webkit-animation: twinkle 5s infinite; animation: twinkle 5s infinite;} 
	`;
	FlakeTemplateString: string = "<div id=\"{$id}\" class=\"flake\">{:text for $id:Xmas.getRandomFlake()}</div>";
	StarTemplateString: string = "<div id=\"{$id}\" class=\"star\">{:text for $id:Xmas.getRandomStar()}</div>";
	GreetingTemplateString: string = "<div id=\"thegreeting\">{:text for thegreeting:this.getMessage()}</div>";
	FlakeTemplate: Template = null;
	StarTemplate: Template = null;
	GreetingTemplate: Template = null;
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
	mouse: IVec2 = { x: 0, y: 0 };

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
	static compileTemplate(template: string): Array<ITemplatePart> {
		var templateParts: Array<ITemplatePart> = [];
		var pos = 0;
		var s: number = 0;
		var expr: string = "";
		var next = 1;
		var templateType: TemplateType = TemplateType.static;
		var forId: string = null;
		while (pos < template.length) {
			switch (template[pos]) {
				case "\\":
					pos++;
					break;
				case "{":
					templateParts.push({
						part: template.substring(s, pos),
						templateType: templateType,
						forId: forId
					});
					next = pos + 1;
					if (template.indexOf(":text", next) === next) {
						//optimize text content replace
						templateType = TemplateType.text;
						pos += 5;
						if (template.indexOf(" for ", pos) === pos + 1) {
							s = pos += 5;
							pos = template.indexOf(":", pos);
							if (pos === -1) {
								throw "Malfomed template";
							}
							forId = template.substring(s, pos).trim();
						}
						pos = template.indexOf(":", pos);
						if (pos === -1) {
							throw "Malfomed template";
						}
					} else if (template.indexOf(":attr", next) === next) {
						//optimize text content replace
						templateType = TemplateType.attr;
						pos += 5;
						if (template.indexOf(" for ", pos) === pos + 1) {
							s = pos += 5;
							pos = template.indexOf(":", pos);
							if (pos === -1) {
								throw "Malfomed template";
							}
							forId = template.substring(s, pos).trim();
						} else {
							pos = template.indexOf(":", pos);
							if (pos === -1) {
								throw "Malfomed template";
							}
						}
					}
					s = pos + 1;
					break;
				case "}":
					if (pos > 1) {
						templateParts.push({
							part: template.substring(s, pos),
							templateType: templateType,
							forId: forId
						});
						s = pos + 1;
						templateType = TemplateType.static;
						forId = null;
					}
					break;
			}
			pos++;
		}
		if (s !== pos) {
			templateParts.push({
				part: template.substring(s, pos),
				templateType: templateType,
				forId: forId
			});
		}
		return templateParts;
	}
	static drawTemplate(template: Template, parent: HTMLElement, id?: string, context?: any): HTMLElement {
		var templateParts: Array<string> = [];
		var p = 0;
		var obj: any = {};
		var html = ""
		var el: HTMLElement = null;
		var existing: HTMLElement = id ? (el = <HTMLElement>parent.querySelector("#" + id)) : null;
		var expr = "";
		var fn: Function = null;
		for (p = 0; p < template.length; p++) {
			switch (template[p].templateType) {
				case TemplateType.text:
					expr = template[p].part.replace("$id", id);
					fn = new Function("return " + expr);
					expr = fn.call(context || this);
					if (existing) {
						parent.querySelector("#" + template[p].forId).textContent = expr;
					} else {
						templateParts.push(expr);
					}
					break;
				case TemplateType.attr:
					break;
				case TemplateType.general:
					break;
				default:
					//static
					if (!existing) {
						expr = template[p].part.replace("$id", id);
						templateParts.push(expr);
					}
					break;
			}
		}
		if (!existing) {
			html = templateParts.join("");

			el = Xmas.createElement(html);
			if (existing) {
				parent.replaceChild(el, existing);
			} else {
				parent.appendChild(el);
			}
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
	mousemove(event: MouseEvent): void {
		this.mouse.x = event.clientX;
		this.mouse.y = event.clientY;
	}
	start() {
		var i: number;
		var windowWidth = Xmas.WindowWidth = window.innerWidth;
		var windowHeight = Xmas.WindowHeight = window.innerHeight;
		var starSpan = windowHeight / 3.0;
		this.StarTemplate = Xmas.compileTemplate(this.StarTemplateString);
		this.FlakeTemplate = Xmas.compileTemplate(this.FlakeTemplateString);
		this.GreetingTemplate = Xmas.compileTemplate(this.GreetingTemplateString);
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
		this.Panel.addEventListener("click", this.destroy.bind(this));
		this.Panel.addEventListener("touchend", this.destroy.bind(this));
		this.Panel.addEventListener("pointerup", this.destroy.bind(this));
		this.Panel.addEventListener("mousemove", this.mousemove.bind(this));
		document.body.appendChild(this.Style);
		document.body.appendChild(this.Panel);
		/*
		AudioManager.loadSound("holiday", base64Music, true).then((id:string) => {
			AudioManager.playSound(id);
		});
		*/

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
		var flakeHit = false;
		if (greetDiff > Xmas.GreetTimeout) {
			this.timeToGreet = true;
			this.greetTime = this.time;
			this.greetPos = (this.greetPos + 1) % Xmas.Greetings.length;
		}
		for (i = 0; i < this.flakeCount; i++) {
			flakeHit = ((this.mouse.x >= this.flakePos[i].x) && (this.mouse.x - this.flakePos[i].x) < Xmas.BaseFlakeHeight * this.flakeScale[i]) &&
				((this.mouse.y >= this.flakePos[i].y) && (this.mouse.y - this.flakePos[i].y) < Xmas.BaseFlakeHeight * this.flakeScale[i]);
			if (flakeHit || this.flakePos[i].y > Xmas.WindowHeight) {
				this.flakePos[i].y -= (Xmas.WindowHeight + 100);
				this.flakePos[i].x = Xmas.randomInt(Xmas.WindowWidth);
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
			this.timeToGreet = false;
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