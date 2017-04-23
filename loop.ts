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
var tile_bitmaps = new Array();
var museums = new Array();
var track_forward_mode : boolean = false;

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

function radians(degrees : number) : number
{
    return Math.PI*2*(degrees/360.0);
}

function translate_lonlat(lon, lat, gridX, gridY)
{
    // Offset
    //var offsetX = -2.74; var offsetY = 53.296; // Actual minimum of the map
    //var offsetX = -2.2352297; var offsetY = 53.451005; // Somewhere around Princess Parkway
    var offsetX = gridX*(1/60.0); var offsetY = (gridY)*(1/60.0);
    var general_scale = 1/60; // 1 minute of arc is about 1.1km at this lat
    var scaleX = 512/general_scale; // Output scale 0-512, input range 0.81;
    var scaleY = 512/general_scale; // Output scale 0-512, input range 0.31 but using 0.81 to make everything square;
    return [(lon - offsetX) * scaleX, (lat - offsetY) * scaleY];
}

function makeMap(gridX, gridY)
{
    var mapBitmap = document.createElement('canvas');
    mapBitmap.width = 512;
    mapBitmap.height = 512;
    tile_bitmaps[[gridX,gridY]] = mapBitmap;
}

function drawRoad(mapctx, way_nodes, width, colour, node_lon, node_lat, gridX, gridY)
{
    mapctx.beginPath();
    mapctx.lineWidth = width;
    mapctx.strokeStyle = colour;
    for (var n=0;n<way_nodes.length;n++) {
	var lon = node_lon[way_nodes[n]];
	var lat = node_lat[way_nodes[n]];
	var coords = translate_lonlat(lon, lat, gridX, gridY);
	mapctx.lineTo(coords[0],coords[1],4,0,2*Math.PI);
    }
    mapctx.stroke();
    mapctx.lineWidth = 1;
}


function drawMap(request, gridX, gridY) {
    makeMap(gridX, gridY);
    var mapctx = tile_bitmaps[[gridX, gridY]].getContext('2d');

    if(request.status != 200) {
	mapctx.fillStyle = "#404040";
	mapctx.fillRect(0,0,512,512);
	drawString(mapctx, "TILE MISSING "+gridX+","+gridY,32,200);
	return;
    }
    lineArray = request.responseText.split("\n");
    var way_lines : string[] = new Array();
    var node_lon = new Array();
    var node_lat = new Array();
    console.log("Map data loaded.");

    for(var l = 0;l< lineArray.length; l++) {
	line = lineArray[l];
	if(line[0] == "w") {
	    way_lines.push(line.substr(1));
	} else if(line[0] == "n") {
	    var idlonlat = line.substr(1).split(",");
	    node_lon[idlonlat[0]] = idlonlat[1];
	    node_lat[idlonlat[0]] = idlonlat[2];
	    var coords = translate_lonlat(idlonlat[1], idlonlat[2], gridX, gridY);
	    mapctx.fillStyle = "#ffffff";
	    mapctx.beginPath();
	    mapctx.arc(coords[0],coords[1],8,0,2*Math.PI);
	    mapctx.fill();
	}
    }
    for(var w=0;w<way_lines.length;w++) {
	var way_nodes = way_lines[w].split(",");
	drawRoad(mapctx, way_nodes, 16, "#ffffff", node_lon, node_lat, gridX, gridY);
    }
    for(var w=0;w<way_lines.length;w++) {
	var way_nodes = way_lines[w].split(",");
	drawRoad(mapctx, way_nodes, 8, "#7f7f7f", node_lon, node_lat, gridX, gridY);
    }
    for(var w=0;w<way_lines.length;w++) {
	var way_nodes = way_lines[w].split(",");
	drawRoad(mapctx, way_nodes, 2, "#ffffff", node_lon, node_lat, gridX, gridY);
    }
}


function resetGame()
{
    x = -2.23;
    y = 53.45;
    rot = 0.2;
}

function updateMuseums(request)
{
    lineArray = request.responseText.split("\n");
    for(var l=0;l<lineArray.length;l++) {
	var line : string = lineArray[l];
	var fields = line.split(",");
	fields.push(true); // 'Active' field
	museums.push(fields);
    }
}

function backgroundLoadTile(gridX, gridY)
{
    var request = new XMLHttpRequest();
    var prefix_lon = gridX < 0 ? "w" : "e";
    var prefix_lat = gridY < 0 ? "s" : "n";
    var map_reference_name = prefix_lon+Math.abs(gridX)+prefix_lat+Math.abs(gridY);
    request.open("GET", "maps/"+map_reference_name+".map", true);
    request.onload = function(oEvent) {
	drawMap(request,gridX,gridY);
    }
    request.send(null);

}

function backgroundLoadGoals()
{
    var request = new XMLHttpRequest();
    request.open("GET", "maps/museums.csv", true);
    request.onload = function(oEvent) {
	updateMuseums(request);
    }
    request.send(null);
}

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("car");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();

    backgroundLoadTile(-134,3207);
    backgroundLoadTile(-133,3207);
    backgroundLoadGoals();
    return true;
}

function draw() {
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);
    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }
    ctx.fillStyle = "#00c000";
    ctx.save();

    // Invert the screen, since positive latitude should be negative Y
    ctx.scale(1,-1);
    ctx.translate(0,-480);
    
    if(track_forward_mode) {
	ctx.translate(320,240);
	ctx.rotate(-rot+Math.PI/2);
	ctx.translate(-320,-240);
    }
    var gridX = Math.floor(x * 60.0);
    var gridY = Math.floor(y * 60.0);

    var coords = translate_lonlat(x, y, gridX, gridY);
    var paint_offset_x = Math.floor(-coords[0]+320);
    var paint_offset_y = Math.floor(-coords[1]+240);
    ctx.fillStyle = "#ff00ff";
    for(var px = gridX - 3; px < gridX + 3; px++) {
	for(var py = gridY - 3; py < gridY + 3; py++) {
	    var bitmap = tile_bitmaps[[px,py]];
	    if(bitmap == undefined) {
		ctx.fillRect(paint_offset_x+(px-gridX)*512,paint_offset_y+(py-gridY)*512, 512, 512);
	    } else {
		ctx.drawImage(bitmap, paint_offset_x+(px-gridX)*512,paint_offset_y+(py-gridY)*512);
	    }
	}
    }

    // Museums
    for(var m:number=0;m<museums.length;m++) {
	if(!museums[m][3]) { continue; }
	var mx = museums[m][1];
	var my = museums[m][2];
	var museum_coords = translate_lonlat(mx, my, gridX, gridY);
	ctx.beginPath();
	ctx.fillStyle = "#00ff00";
	var px = mx - x;
	var py = my - y;
	var angle = Math.atan2(py,px);
	var dist_sq = px*px+py*py;
	var threshold = 0.5/60.0;
	if(dist_sq > threshold*threshold) {
	    ctx.beginPath();
	    ctx.fillStyle = "#ffff00";
	    var arrowWidth = 0.02;
	    ctx.moveTo(320+180*Math.cos(angle-arrowWidth), 240+180*Math.sin(angle-arrowWidth));
	    ctx.lineTo(320+180*Math.cos(angle+arrowWidth), 240+180*Math.sin(angle+arrowWidth));
	    ctx.lineTo(320+192*Math.cos(angle), 240+192*Math.sin(angle));
	    ctx.fill();
	}
	
	ctx.beginPath();
	ctx.fillStyle = "#00ff00";
	ctx.arc(paint_offset_x+museum_coords[0], paint_offset_y+museum_coords[1], 10, 0, Math.PI*2);
	ctx.fill();
    }

    ctx.restore();
    
    // Actual player
    ctx.save();
    ctx.translate(320,240);
    if(!track_forward_mode) {
	ctx.rotate(-rot+Math.PI/2);
    }
    ctx.drawImage(playerImage, -16,-16);
    ctx.restore();
    
    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function int(x)
{
    return Math.floor(x);
}

function loadMoreMaps() : void
{
    var gridX = Math.floor(x * 60.0);
    var gridY = Math.floor(y * 60.0);
    for(var px = gridX - 3; px < gridX + 3; px++) {
	for(var py = gridY - 3; py < gridY + 3; py++) {
	    var bitmap = tile_bitmaps[[px,py]];
	    if(bitmap == undefined) {
		backgroundLoadTile(px,py);
	    }
	}
    }
}

function movePlayer()
{
    // Which grid are we in?
    var gridX = Math.floor(x * 60.0);
    var gridY = Math.floor(y * 60.0);
    var tilebitmap = tile_bitmaps[[gridX,gridY]];
    speed = 0.00005;
    if(tilebitmap != undefined) {
	var mapctx = tile_bitmaps[[gridX,gridY]].getContext('2d');
	var coords = translate_lonlat(x, y, gridX, gridY);
	var pixel = mapctx.getImageData(int(coords[0]), int(coords[1]), 1, 1);
	if(pixel.data[0] > 0) {
	    speed = 4*speed;
	} else {
	    speed = 1*speed;
	}
    }
    x += speed* Math.cos(rot);
    y += speed* Math.sin(rot);

    // Check and load maps if necessary
    loadMoreMaps();

    // Collect targets?
    for(var m:number=0;m<museums.length;m++) {
	var mx = museums[m][1];
	var my = museums[m][2];
	var dist_sq : number = (x-mx)*(x-mx)+(y-my)*(y-my);
	var threshold_metres = 50;
	var threshold_degrees = threshold_metres*0.001/60.0;
	if(dist_sq < threshold_degrees*threshold_degrees) {
	    console.log("Visited "+museums[m][0]);
	    museums[m][2] = -1;
	    museums[m][3] = false;
	}
    }

}

function processKeys() {
    if(keysDown[37] || keysDown[65]) rot += 0.05;
    if(keysDown[39] || keysDown[68]) rot -= 0.05;
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
	console.log("Key down: "+c);
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
	if(c==77) {
	    track_forward_mode = !track_forward_mode;
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
