var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;

// Game variables
var x : number, y:number;
var rot :number;

function getImage(name)
{
    image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function translate_lonlat(lon, lat)
{
    // Offset
    var offsetX = -2.74;
    var offsetY = 53.296;
    var general_scale = Math.max(0.81,0.31);
    var general_scale = 0.5; // For testing
    var scaleX = 512/general_scale; // Output scale 0-512, input range 0.81;
    var scaleY = 512/general_scale; // Output scale 0-512, input range 0.31 but using 0.81 to make everything square;
    
    return [(lon - offsetX) * scaleX, (lat - offsetY) * scaleY];
}

function makeMap()
{
    mapBitmap = document.createElement('canvas');
    mapBitmap.width = 512;
    mapBitmap.height = 512;
    mapctx = mapBitmap.getContext('2d');
}

function drawMap(request) {
    lineArray = request.responseText.split("\n");
    var way_lines : string[] = new Array();
    var node_lon = new Array();
    var node_lat = new Array();
    console.log("Map data loaded.");
    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
	if(line[0] == "w") {
	    way_lines.push(line);
	} else if(line[0] == "n") {
	    var idlonlat = line.substr(1).split(",");
	    node_lon[idlonlat[0]] = idlonlat[1];
	    node_lat[idlonlat[0]] = idlonlat[2];
	    var coords = translate_lonlat(idlonlat[1], idlonlat[2]);
	    mapctx.strokeStyle = "#ffffff";
	    mapctx.beginPath();
	    mapctx.arc(coords[0],coords[1],4,0,2*Math.PI);
	    mapctx.stroke();
	}
    }
}


function resetGame()
{
    x = 128;
    y = 128;
    rot = 0;
}

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("player");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();

    makeMap();
    var request = new XMLHttpRequest();
    request.open("GET", "maps/manchester.map", true); // Blocking, todo
    request.onload = function(oEvent) {
	console.log("Data onLoad called");
	drawMap(request);
    }
    console.log("Requested map data.");
    request.send(null);
    
    return true;
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    ctx.drawImage(mapBitmap, 0,0);
    ctx.strokeStyle = "#ff00ff";
    ctx.beginPath();
    ctx.arc(x, y,8,0,2*Math.PI);
    ctx.moveTo(x,y);
    ctx.lineTo(x+16*Math.cos(rot), y+16*Math.sin(rot))
    ctx.stroke();
    
    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function int(x)
{
    return Math.floor(x);
}

function movePlayer()
{
    var pixel = mapctx.getImageData(int(x), int(y), 1, 1);
    if(pixel.data[0] == 255) {
	speed = 4;
    } else {
	speed = 1;
    }
    x += speed* Math.cos(rot);
    y += speed* Math.sin(rot);
}

function processKeys() {
    if(keysDown[37] || keysDown[65]) rot -= 0.1;
    if(keysDown[39] || keysDown[68]) rot += 0.1;
    if(x < 0) x = 0;
    if(x > SCREENWIDTH - playerImage.width)  x = SCREENHEIGHT - playerImage.width;
    if(y < 0) y = 0;
    if(y > SCREENWIDTH - playerImage.height) y = SCREENHEIGHT - playerImage.height;
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
    }

    if(mode == MODE_PLAY) {
	movePlayer();
    }
    draw();
   
    if(!stopRunloop) setTimeout('drawRepeat()',20);
}

function press(c) {
    console.log("press "+c);
    if(c==32) {
	if(mode == MODE_TITLE) {
	    resetGame();
	    mode = MODE_PLAY;
	}
    } else {
	keysDown[c] = 1;
    }
}

function unpress(c) {
    console.log("unpress "+c);
    keysDown[c] = 0;
}


if (canvas.getContext('2d')) {
    stopRunloop = false;
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
        keysDown[c] = 1;
	if(c == 81) {
	    stopRunloop=true;
	}
	if(c == 32) {
	    if(mode == MODE_TITLE) {
		resetGame();
		mode = MODE_PLAY;
	    }
	}
	if(c == 82) {
	    if(mode == MODE_WIN) {
		mode = MODE_TITLE;
	    }
	}
    };


    
    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    if(init()) {      
      drawRepeat();
    }
}
