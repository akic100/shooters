$(document).ready(function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext("2d");
	var cw = canvas.width;
	var ch = canvas.height;
	var loop_count = 0;
	var bg = new Image();
	bg.src = "img/bg.png";
	var images = [];
	var leftKey, rightKey, upKey, downKey, spaceKey, spaceKeyUsed;
	var player_in_air, jumpable;
	var syb4;
	var mx, my;
	var shooting_angle;
	var fps, fps_avg, fps_prev;

	// Temp Variables
	var friction = 0.7;
	var show_debug = false;

	// Controls
	function keyDown(e) {
		if (e.keyCode == 68) rightKey = true;
		else if (e.keyCode == 65) leftKey = true;
		if (e.keyCode == 87) upKey = true;
		else if (e.keyCode == 83) downKey = true;
		if (e.keyCode == 32) spaceKey = true;

		// Reset
		if(e.keyCode == 82) {
			player.x = 500;
			player.y = 200;
			player.sy = 0;
		}

		// Toggle debug
		if(e.keyCode == 84) {
			show_debug = !show_debug;
		}
	}

	function keyUp(e) {
		if (e.keyCode == 68) rightKey = false;
		else if (e.keyCode == 65) leftKey = false;
		if (e.keyCode == 87) upKey = false;
		else if (e.keyCode == 83) downKey = false;
		if (e.keyCode == 32) {
			spaceKey = false;
			spaceKeyUsed = false;
		}
	}

	function mouse_move(e) {
		if(e.offsetX) {
			mx = e.offsetX;
			my = e.offsetY;
		}
		else if(e.layerX) {
			mx = e.layerX;
			my = e.layerY;
		}
	}

	document.addEventListener('keydown', keyDown, false);
	document.addEventListener('keyup', keyUp, false);
	canvas.addEventListener('mousemove', mouse_move, false)

	// Entities
	var entities = [];
	var entity_type = [];

	function entity(x, y, sx, sy, type, options) {
		this.x = x;
		this.y = y;
		this.sx = sx;
		this.sy = sy;
		this.w = entity_type[type].w;
		this.h = entity_type[type].h;
		this.type = type;
		this.acceleration = entity_type[type].acceleration;

		if(options)
		{
			$.each(options, function(key, value) {
				this[key] = value;
			}); 

		}   
	}

	// Player
	entity_type[0] = {
		w: 50,
		h: 50,
		src: "",
		color: "red",
		dt: 2,
		acceleration: 1.5,
		max_speed : 6
	}

	// Bullet
	entity_type[1] = {
		w: 5,
		h: 5,
		src: "",
		color: "black",
		dt: 2,
		acceleration: 1,
		max_speed: 20
	}

	// Tiles
	var tile_type = [];

	var level = { 
		tiles: []
	};



	// Ground
	tile_type[0] = {
		w: 50,
		h: 50,
		color: "#000",
		dt: 2
	}

	function tile(x, y, type, options) {
		this.x = x;
		this.y = y;
		this.w = tile_type[type].w;
		this.h = tile_type[type].h;
		this.type = type;

		if(options)
		{
			$.each(options, function(key, value) {
				this[key] = value;
			}); 

		}   
	}

	function init() {
		create_tiles(level);
	}

	function draw_bg() {
		ctx.drawImage(bg, 0, 0);
	}

	// Types: 0: image, 1: line, 2: rectangle, 3: circle, 4: text
	function draw_command(type, data) {
		// Types: 0: image, 1: line, 2: rectangle, 3: circle, 4: text
		this.type = type;
		this.data = data;
	}

	function draw_img(x, y, src, dq) {
		var tmp = new draw_command(0, {'x': x, 	'y': y, 'src': src});
		dq.push(tmp);
	}

	function draw_circle(x, y, radius, width, color, fill_color, dq) {
		var tmp = new draw_command(3, {'x': x, 'y': y, 'radius': radius, 'width': width, 'color': color, 'fill_color': fill_color});
		dq.push(tmp);
	}

	function draw_line(x, y, x2, y2, width, color, dq) {
		var tmp = new draw_command(1, {'x': x, 'y': y, 'x2': x2, 'y2': y2, 'width': width, 'color': color});
		dq.push(tmp);
	}

	function draw_rect(x, y, w, h, color, dq) {
		var tmp = new draw_command(2, {'x': x, 'y': y,'h': h, 'w': w, 'color': color});
		dq.push(tmp);
	}

	function draw_text(x, y, color, text, font, dq) {
		// font = string; primer: "30px Arial"
		var tmp = new draw_command(4, {'x': x, 'y': y, 'color': color, 'text': text, 'font': font});
		dq.push(tmp);
	}

	function exec_dq(dq, ctx) {
		for(var i = 0; i < dq.length; i++) {
			var d = dq[i];
			var data = d.data;
			switch(d.type) {
				case 0: 
				var img = images[data.src];
				if(!img) {
					img = new Image();
					img.src = "img/" + data.src;
					images[data.src] = img;
				}
				ctx.drawImage(img, data.x, data.y);
				break;
				case 1: 
				ctx.beginPath();
				ctx.strokeStyle = data.color;
				ctx.moveTo(data.x, data.y);
				ctx.lineTo(data.x2, data.y2);
				ctx.lineWidth = data.width;
				ctx.stroke();
				break;
				case 2:
				ctx.fillStyle = data.color;
				ctx.fillRect(data.x, data.y, data.w, data.h);
				break;
				case 3:
				ctx.beginPath();
				ctx.arc(data.x, data.y, data.radius, 0, 2 * Math.PI, false);
				ctx.fillStyle = data.fillcolor;
				if(data.fillcolor != "") ctx.fill();
				ctx.lineWidth = data.width;
				ctx.strokeStyle = data.color;
				ctx.stroke();
				break;
				case 4:
				ctx.fillStyle = data.color;
				ctx.font = data.font;
				ctx.fillText(data.text, data.x, data.y);
				break;
			}
		}
	}

	function draw_entities(entities, dq) {
		for(var i = 0; i < entities.length; i++) {
			var ent = entities[i];
			if(ent == null) continue;
			var td = entity_type[ent.type];
			switch(td.dt) {
				case 2:
				draw_rect(ent.x, ent.y, td.w, td.h, td.color, dq);
				break;
			}
		}
	}

	function draw_mouse(mx, my, dq) {
		draw_circle(mx, my, 5, 2, "white", "blue", dq);
		draw_line(player.x + player.w / 2, player.y, mx, my, 2, "blue", dq);
	}

	function check_if_jumpable() {
		var ent = entities[0];
		for(var i = 0; i < 19; i++){
			if(check_under(ent, level.tiles[i])) {
				jumpable = true;
			} else {
				jumpable = false;
			}
		}
	}

	function move_entities(entities, elapsed) {
		for(var i = 0; i < entities.length; i++) {
			var ent = entities[i];
			if(ent == null) continue;
			var td = entity_type[ent.type];

			// Player
			if(ent.type == 0) {
				// Check left & right keys
				if(leftKey && ent.x > 20 + td.w)  ent.sx -= ent.acceleration * elapsed * friction; // tile_types[].friction
				if(rightKey && ent.x < 980 - td.w) ent.sx += ent.acceleration * elapsed * friction;

				// Check if max speed
				if(Math.abs(ent.sx) >= td.max_speed) {
					if(ent.sx > 0) ent.sx = td.max_speed;
					if(ent.sx < 0) ent.sx = -td.max_speed;
				}

				// Stop if no key pressed
				if(!leftKey && !rightKey) ent.sx *= friction;

				if(spaceKey && ent.sy == 0 && syb4 > 0) {
					ent.syb4 = ent.sy;
					ent.sy = -10;
					spaceKey = false;

				}

				// Test syb4
				if(ent.sy) syb4 = ent.sy;

				// Gravity
				ent.sy += 0.5;

				// Modify entity's postition
				ent.x += ent.sx;
				ent.y += ent.sy;

				// Tile collision checker
				for(var i = 0; i < level.tiles.length; i++) {
					/*if(check_collision_left(ent, level.tiles[i])) {
						ent.sx = 0;
					}
					if(check_collision_bottom(ent, level.tiles[i])) {
						ent.sy = 0;
						ent.y = level.tiles[i].y - ent.h;
					}*/
					var tile = level.tiles[i];
					if(check_collision(ent, tile)) {
						var top = Math.abs(ent.y - tile.y - tile.h);
						var bottom = Math.abs(ent.y + ent.h - tile.y);

						var left = Math.abs(ent.x - tile.x + tile.w);
						var right = Math.abs(ent.x - ent.w - tile.x);

						var left_right = (left > right) ?  left : right;
						var top_bottom = (top > bottom) ?  top : bottom;
						if(left_right < top_bottom)
						{
							if(top >= bottom && syb4 >= 0)
							{
								ent.sy = 0;
								ent.y = tile.y - ent.h;
							}
							if(top < bottom)
							{
								ent.sy = 0;
								ent.y = tile.y + ent.h;
							}
						}

						else
						{
							if(left >= right)
							{
								ent.sx = 0;
								ent.x = tile.x + ent.w;
							}
							if(left < right)
							{
								ent.sx = 0;
								ent.x = tile.x - ent.w;
							}
						}
					}
				}
			}

			if(ent.type == 1) {

			}

		}
	}

	function get_shooting_angle(player) {
		// Gets angle between mouse and player. +- 180 deg.
		shooting_angle = Math.round(Math.atan2(-(my - player.y), (mx - (player.x + player.w / 2))) * 180 / Math.PI);
	}

	function draw_tiles(tiles, dq) {
		for(var i = 0; i < tiles.length; i++) {
			var tile = tiles[i];
			if(tile == null) continue;
			var td = tile_type[tile.type];
			switch(td.dt) {
				case 2:
				draw_rect(tile.x, tile.y, td.w, td.h, td.color, dq);
				break;
			}
		}
	}

	function create_tiles(level) {
		// Main ground
		for(var i = 4; i < 16; i++) {
			level.tiles.push(new tile(i * 50, 500, 0));
		}
		for(var i = 5; i < 9; i++) {
			level.tiles.push(new tile(i * 50, 330, 0));
		}
		for(var i = 12; i < 15; i++) {
			level.tiles.push(new tile(i * 50, 430, 0));
		}
		for(var i = 10; i < 12; i++) {
			level.tiles.push(new tile(i * 50, 400, 0));
		}
	}

	function check_collision(a, b) {
		return (a.x < b.x + b.w &&
			a.x + a.w > b.x &&
			a.y < b.y + b.h &&
			a.h + a.y > b.y);
	}

	function check_under(a, b) {
		return (a.x < b.x + b.w &&
			a.x + a.w > b.x &&
			a.y + a.h >= b.y);
	}


	function loop() {
		window.requestAnimationFrame(loop);
		loop_count++;
		var time_elapsed = new Date() - last_loop_time;
		last_loop_time = new Date();

		// Draw queue create
		var dq = [];

		// Clears screen
		ctx.clearRect(0, 0, cw, ch);

		// Draws background
		draw_bg();

		// Draws tiles
		draw_tiles(level.tiles, dq);

		// Checks for jumpable
		//check_if_jumpable();

		// Moves entities
		move_entities(entities, time_elapsed);

		// Draws entities
		draw_entities(entities, dq);

		// Draws mouse
		draw_mouse(mx, my, dq);

		// Gets shooting angle
		get_shooting_angle(player);

		// FPS
		fps = Math.round(1000 / (time_elapsed));
		if(loop_count == 1) {
			fps_avg = fps;
			fps_prev = fps;
		} else {
			fps_avg = (fps + fps_prev) / 2;
		}

		// Debug
		if(show_debug) {
			draw_text(20, 25, "yellow", "FPS: " + fps, "20px Arial", dq);
			draw_text(20, 50, "yellow", "Mouse x: " + mx, "20px Arial", dq);
			draw_text(20, 80, "yellow", "Mouse y: " + my, "20px Arial", dq);
			draw_text(20, 110, "yellow", "Shooting angle: " + shooting_angle + "°", "20px Arial", dq);
		}

		// Temp drawings
		draw_text(780, 50, "red", "Press R to restart", "20px Arial", dq);
		draw_text(780, 80, "red", "Press T to toggle debug", "20px Arial", dq);

		// Execute draw queue
		exec_dq(dq, ctx);




	}
	// Function calls
	var last_loop_time = new Date();
	var start_time = new Date();
	var player = new entity(500, 200, 0, 0, 0);
	entities.push(player);
	init();
	loop();
});