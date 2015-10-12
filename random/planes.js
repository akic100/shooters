$(document).ready(function() {
    // 1400 * 700
    var canvas = $("#canvas")[0];
    console.log("Canvas: " + canvas);
    var ctx = canvas.getContext("2d");
    console.log("Context: " + ctx); 
    var last_loop = new Date();
    var collision = false;
    var bullet_counter = 0;
    var loop_count = 0;
    var leftKey = false;
    var rightKey = false;
    var upKey = false;
    var downKey = false;
    var scroll_speed1 = 1;
    var scroll_speed2 = 1.3;
    var clouds1_y = -1400;
    var clouds2_y = -1400;


    // Set up background
    var background = new Image();
    background.src = "img/bg.jpg";
    var clouds = new Image();
    clouds.src = "img/clouds.png"

    // Set up player
    var player = {
    	x: 680,
    	y: 600,
    	w: 64, 
    	h: 64,
    	speed_x: 0,
    	speed_y: 0,
    	acceleration: 0.002, 
    	deceleration: 0.997, 
    	max_speed: 0.6, 
    	min_speed: 0.2,
    	bullet_time: 0, 
    	bullet_rate: 300, 
    	bullet_type: 0, 
    	health: 100
    };

    var draw_queue = [];

    // Set up entities
    var entity_type = [];
// Player bullet
entity_type[0] = {   
	w: 7,
	h: 20,
	fill: "white",
	speed_y: - .5, 
	speed_x: 0, 
	collision: false,
	active: false,
	src: "bullet.png",
	is_enemy: false,
	bullet_type: -1, 
	is_bullet: true
};
// Enemy
entity_type[1] = {   
	w: 64,
	h: 64,
	fill: "white",
	speed_y: .1, 
	speed_x: 0, 
	collision: false,
	active: false,
	src: "enemy1.png",
	bullet_type: 0, 
	is_enemy: true,
	bullet_type: 2,
	bullet_time: 1000,
	bullet_offset_x: 30,
	bullet_offset_y: 50,
	is_bullet: false, 
	damage: 30

};
// Enemy bullet
entity_type[2] = {   
	w: 7,
	h: 20,
	fill: "white",
	speed_y: + 0.8, 
	speed_x: 0, 
	collision: false,
	active: false,
	src: "bullet.png",
	is_enemy: true,
	bullet_type: -1,
	is_bullet: true, 
	damage: 10
};
// Health power up
entity_type[3] = {
	w: 31,
	h: 31,
	fill: "white",
	speed_y: -1,
	speed_x: 0,
	collision:false,
	src: "hp.png", 
	is_enemy: false,
	bullet_type: -1,
	is_bullet: false
}
var entities = [];

function draw_command(x, y, w, h, color, src) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.color = color;
	this.src = src;
}

function entity(x, y, speed_x, speed_y, type, options) {
	this.x = x;
	this.y = y;
	this.speed_x = speed_x;
	this.speed_y = speed_y;
	this.type = type;
	this.bullet_time = 0;

	if(options)
	{
		$.each( options, function( key, value ) {
			this[key] = value;
              //console.log(this.bullet_time); alert(key);
          }); 

	}   
}

var image_status = 1;

function randomIntFromInterval(min,max)
{
	return Math.floor(Math.random()*(max-min+1)+min);
}

    // BriÃ…Â¡e screen
    function clear_canvas(canvas) {
    	canvas.clearRect(0, 0, 1400, 700);
    }

    // RiÃ…Â¡e sliko
    var images = [];
    function draw_img(x, y, src, cnv) {
    	var tmp = new draw_command(x, y, -1, -1, -1, src);
    	draw_queue.push(tmp);
    }

    // RiÃ…Â¡e rectangle
    function draw(x, y, w, h, color, cnv) {
    	var tmp = new draw_command(x, y, -1, -1, color, "");
    	draw_queue.push(tmp);
    }

    function execute_draw_queue(draw_queue, context) {
    	for(var i = 0; i < draw_queue.length; i++) {
    		var d = draw_queue[i];
    		if(d.color != -1) {
    			context.fillStyle = d.color;
    			context.fillRect(d.x, d.y, d.w, d.h);
    		}
    		if(d.src != "") {
    			var img = images[d.src];
    			if(!img)
    			{
    				img = new Image();
    				img.src = "img/" + d.src;
    				images[d.src] = img;
    			}

    			context.drawImage(img, d.x, d.y);
    		}
    		//draw_queue.splice(i, 1);
    	}
    }

    // Clear screen
    function clearx(x, y, w, h, cnv) {
    	cnv.clearRect(x, y, w, h);
    }


    // Vrne true, Ã„Âe se obj1 dotika sprednjega sredinskega dela obj2
    function detect_collision(obj1, obj2) {
    	for(var i = 0; i < obj1.w; i++) {
    		for(var j = 0; j <obj1.h; j++) {
    			if(obj1.x + i == obj2.x + obj2.w / 2 && obj1.y + j == obj2.y + obj2.h) {
    				return true;
    			}
    		}
    	}
    }

    // Test
    function play_test_object(obj) {
    	if(detect_collision(player, obj)) {
    		obj.collision = true;
    		collision = true;
    	}
    	draw(obj.x, obj.y, obj.w, obj.h, obj.fill, ctx);
    	obj.y += obj.speed_y;
    	obj.active = true;
    	for(var y = obj.y; y <= 700; y += obj.speed_y) {
    		obj.y += obj.speed_y;
    	}
    }

    // Random object gen
    function create_object(i) {
    	enemies.push({});
    	enemies[i].x = Math.floor(Math.random() * 1200) + 200;
    	enemies[i].y = 100;
    	enemies[i].w = 10;
    	enemies[i].h = 10;
    	enemies[i].fill = "white";
    	enemies[i].speed_y = 5;
    	enemies[i].collision = false;
    	enemies[i].active = false;
    }

    // Key listener
    // window.addEventListener('keydown', doKeyDown, true);
    function keyDown(e) {
        /*if(player.speed > player.min_speed) {
            player.speed -= player.acceleration;
        }*/
        if (e.keyCode == 39) rightKey = true;
        else if (e.keyCode == 37) leftKey = true;
        if (e.keyCode == 38) upKey = true;
        else if (e.keyCode == 40) downKey = true;
    }

    function keyUp(e) {
        /*if(player.speed < player.max_speed) {
            player.speed += player.acceleration;
        }*/
        if (e.keyCode == 39) rightKey = false;
        else if (e.keyCode == 37) leftKey = false;
        if (e.keyCode == 38) upKey = false;
        else if (e.keyCode == 40) downKey = false;
    }

   /* function draw_bullet() {
        if(bullets.length) {
            for(var i = 0; i < bullets.length; i++) {
                ctx.fillStyle = bullets[i].fill;
                create_bullet(i);
                console.log(i);
                draw(bullets[i].x, bullets[i].y, bullets[i].w, bullets[i].h, bullets[i].fill, ctx); 
            }
        }
    }*/

    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);

    function player_move(milliseconds)
    {
    	if(leftKey && player.x > 20 + player.w)  player.speed_x -= player.acceleration * milliseconds;
    	else if(rightKey && player.x < 1380 - player.w) player.speed_x += player.acceleration * milliseconds;
    	if(upKey && player.y > 300 + player.h) player.speed_y -= player.acceleration * milliseconds;
    	else if(downKey && player.y < 690 - player.h) player.speed_y += player.acceleration * milliseconds;

    	if(!leftKey && !rightKey)
    	{
    		if(player.speed_x > 0) player.speed_x *= Math.pow(player.deceleration, milliseconds);
    		else if(player.speed_x < 0) player.speed_x *= Math.pow(player.deceleration, milliseconds);
    	}
    	if(!upKey && !downKey)
    	{
    		if(player.speed_y > 0) player.speed_y *= Math.pow(player.deceleration, milliseconds);
    		else if(player.speed_y < 0) player.speed_y *= Math.pow(player.deceleration, milliseconds);

    	}
    	if( player.speed_x < -1 * player.max_speed)  player.speed_x = player.max_speed * -1;
    	else if(player.speed_x > player.max_speed) player.speed_x = player.max_speed;
    	if( player.speed_y < -1 * player.max_speed) player.speed_y = player.max_speed * -1;
    	else if(player.speed_y > player.max_speed) player.speed_y = player.max_speed;
    	player.x += player.speed_x * milliseconds;
    	player.y += player.speed_y * milliseconds;
    }

    function boundaries() {
    	if(player.x <= 40) player.speed_x = 0;
    	else if(player.x >= 1360) player.speed_x = 0;
    	if(player.y <= 300) player.speed_y = 0;
    	else if(player.y >= 660) player.speed_y = 0;
    }

    function draw_fps(fps) {
        //ctx.clearRect(0, 0, 100, 100);
        ctx.font = '30px Arial';
        if(fps <= 49) ctx.fillStyle = "red";
        if(fps <= 59) ctx.fillStyle = "yellow";
        if(fps >= 60) ctx.fillStyle = "#0DFF00";
        ctx.fillText(fps, 20, 50);
        ctx.fillText(entities.length, 20, 100);
        ctx.fillStyle = "#0DFF00";
        if(player.health <= 65) ctx.fillStyle = "yellow";
        if(player.health <= 35) ctx.fillStyle = "red";
        var hp_string = "Health " + player.health + "%";
        ctx.fillText("Health: " + player.health + "%", 20, 150);
    }

    function draw_bg(clouds_y) {
    	clearx(0, 0, 1400, 700, ctx);
    	draw_img(0, 0, "bg.jpg", ctx);
    	draw_img(0, clouds1_y, "bg0.png", ctx);
    	draw_img(0, clouds2_y, "bg1.png", ctx);
    }

    function draw_bullet(x, y, w, h, speed, cnv) {
    	draw(x, y, w, h, "white", cnv);

    }
    function is_collide(a, b)
    {
    	return (a.x < b.x + b.w &&
    		a.x + a.w > b.x &&
    		a.y < b.y + b.h &&
    		a.h + a.y > b.y);
    }
    function process_entities(canvas, entities, elapsed) {
    	for(var i = 0; i < entities.length; i++)
    	{
    		var ent = entities[i];
    		if(ent == null) continue;
    		var typeData = entity_type[ent.type];
    		ent.w = typeData.w;
    		ent.h = typeData.h;

    		if(is_collide(player, ent) && typeData.is_enemy) {
    			player.health -= typeData.damage;
    			entities[i] = null;
    			continue;
    		}

    		draw(ent.x, ent.y, ent.w, ent.h, "blue", canvas);
    		var destroyed = false;
    		for(var j = 0; j < entities.length; j++)
    		{
    			if(j == i) continue;
    			if(entities[j] == null) continue;
    			if(typeData.is_enemy == entity_type[entities[j].type].is_enemy) continue;
    			if(typeData.is_bullet == entity_type[entities[j].type].is_bullet) continue;

    			if(is_collide(ent, entities[j]))
    			{
    				entities[i] = null;
    				entities[j] = null;

    				destroyed = true;

    			}
    			if(destroyed) break;

    		}
    		if(destroyed) continue;
    	}
    	for(var i = 0; i < entities.length; i++)
    	{
    		var ent = entities[i];
    		if(ent == null) continue;
    		var typeData = entity_type[ent.type];
    		if(ent.x < -10 || ent.y < -300 || ent.x > 1410 || ent.y > 1010)
    		{
    			entities[i] = null;
    			i++;
    			continue;
    		}
            //check collision

            if(ent.bullet_type != -1)
            {

            	if(ent.bullet_time > typeData.bullet_time)
            	{
            		ent.bullet_time = 0;
            		var bullet = new entity(ent.x + typeData.bullet_offset_x, ent.y + typeData.bullet_offset_y, 0, ((ent.speed_y < 0) ? ent.speed_y  : 0),  2);
            		entities.push(bullet);
            	}
            	else
            	{
            		ent.bullet_time += elapsed;
            	}
            }

            
            //console.log(typeData);
            ent.x += (typeData.speed_x + ent.speed_x) * elapsed;
            ent.y += (typeData.speed_y + ent.speed_y) * elapsed;
            draw_img(ent.x, ent.y, typeData.src, canvas);

        }/*
        for(var i = 0; i < entities.length; i++) {
        	console.log(i);
        	if(entities[i] == null) delete entities[i];
        }
        */
    }

    function draw_bullet(x, y, w, h, speed, cnv) {
    	draw(x, y, w, h, "white", cnv);

    }

    var fps, fps_avg, fps_prev;
    var game_state = 0;
    var pause_time = 0;

    function main() {
    	requestAnimationFrame(main);
    	draw_queue = [];
    	draw_bg(clouds1_y);
    	//execute_draw_queue(draw_queue, ctx);
    	//draw_queue = [];
    	clouds1_y += scroll_speed1;
    	clouds2_y += scroll_speed2;
    	if(clouds1_y >= -700) clouds1_y = -1400;
    	if(clouds2_y >= -700) clouds2_y = -1400;
    	var this_loop = new Date();
    	var elapsed_time = this_loop - last_loop;
    	if(game_state == 1) {
    		if(pause_time > 500000) {
    			game_state = 0;
    		}
    		pause_time += elapsed_time;
            return;
        }
        player_move(elapsed_time);
        boundaries();
        if(rightKey)
          draw_img(player.x - 31, player.y - 31, "planeright.png", ctx);
      else if(leftKey)
          draw_img(player.x - 31, player.y - 31, "planeleft.png", ctx);
      else
          draw_img(player.x - 31, player.y - 31, "plane" + ((image_status % 3) + 1) + ".png", ctx);


      if(player.bullet_time > player.bullet_rate)
      {
          player.bullet_time = 0;
          var bullet;
          bullet = new entity(player.x - 2, player.y - player.h / 2, player.speed_x / 3.5, ((player.speed_y < 0) ? player.speed_y  : 0), 0);
          entities.push(bullet);
      }
      else
      {
          player.bullet_time += elapsed_time;
      }

      if(loop_count % 30 == 0) {
          var x = randomIntFromInterval(20, 1380);
          var enemy = new entity(x, -80, 0, 0, 1, {bullet_time: 0});
          entities.push(enemy);
          x = randomIntFromInterval(30, 1370);
          var hp = new entity(x, -80, 0, 0, 3);
          entities.push(hp);
      };

      process_entities(ctx, entities, elapsed_time);
      image_status++;
      loop_count++;        
      clear_canvas(ctx);
      execute_draw_queue(draw_queue, ctx);
      fps = 1000 / (elapsed_time);
      if(loop_count == 1) {
          fps_avg = fps;
          fps_prev = fps;
      } else {
          fps_avg = (fps + fps_prev) / 2;
      }
      last_loop = this_loop;
      draw_fps(Math.round(fps_avg));
      if(player.health <=0) {
        var gradient = ctx.createLinearGradient(0, 0, 2000, 0);  
        gradient.addColorStop(0, 'red');  
        gradient.addColorStop(1 / 6, 'orange');  
        gradient.addColorStop(2 / 6, 'yellow');  
        gradient.addColorStop(3 / 6, 'green');  
        gradient.addColorStop(4 / 6, 'blue');  
        gradient.addColorStop(5 / 6, 'indigo');  
        gradient.addColorStop(1, 'violet');  
        ctx.fillStyle = gradient;  
        ctx.font = 'italic 320pt Courier';
        ctx.fillText("faggot", 200, 450);
        player.health = 100;
        game_state = 1;
        pause_time = 0;
        player.x = 680;
        player.y = 680;
        player.speed_x = 0;
        player.speed_y = 0;
        entities = [];
    }
}

main();
});