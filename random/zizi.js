var NARROW_LINE = 1;
var WIDE_LINE = 5;

//colors
var COLOR_HOVER_VALID = "";
var COLOR_HOVER_INVALID = "";
var COLOR_VALID = "";
var WIN_COMBO = [
[[0, 0], [0, 1], [0, 2]],
[[1, 0], [1, 1], [1, 2]],
[[2, 0], [2, 1], [2, 2]],

[[0, 0], [1, 0], [2, 0]],
[[0, 1], [1, 1], [2, 1]],
[[0, 2], [1, 2], [2, 2]],

[[0, 0], [1, 1], [2, 2]],

[[0, 2], [1, 1], [2, 0]],
];

var game_state = {
    mouse_x: 0,
    mouse_y: 0,
    active_box:{'x': 1, 'y': 1,},
    mouse_click: [],
    moves: [],
    player: 0,
    polja: [],
    zmaga: -1,
    kvadrant_zmage: [],
};

$(document).ready(function() {
// 1400 * 700
var canvas = $("#canvas")[0];
console.log("Canvas: " + canvas);
var ctx = canvas.getContext("2d");
console.log("Context: " + ctx); 

function draw_command(type, data) {
    this.type = type;
    this.data = data;
}


function draw_img(x, y, src, draw_queue) {
    var tmp = new draw_command(1, {'x': x, 'y': y, 'src': src});
    draw_queue.push(tmp);
}
function draw_circle(x, y, radius, width, color, fillcolor, draw_queue) {
    var tmp = new draw_command(4, {'x': x, 'y': y, 'radius': radius, 'width': width
        , 'color': color, 'fillcolor': fillcolor});
    draw_queue.push(tmp);
}
function draw_line(x, y, x2, y2, width, color, draw_queue) {
    var tmp = new draw_command(3, {'x': x, 'y': y, 'x2': x2, 'y2': y2, 'width': width, 'color': color});
    draw_queue.push(tmp);
}

// RiÅ¡e rectangle
function draw(x, y, w, h, color, draw_queue) {
    var tmp = new draw_command(0, {'x': x, 'y': y,'h': h, 'w': w, 'color': color});
    draw_queue.push(tmp);
}
var images = [];
function execute_draw_queue(draw_queue, context) {
    for(var i = 0; i < draw_queue.length; i++) {
        var d = draw_queue[i];
        var data = d.data;
        if(d.type == 0)
        {
            context.fillStyle = data.color;
            context.fillRect(data.x, data.y, data.w, data.h);
        }
        if(d.type == 1)
        {
            var img = images[data.src];
            if(!img)
            {
                img = new Image();
                img.src = "img/" + data.src;
                images[data.src] = img;
            }

            context.drawImage(img, data.x, data.y);
        }
        if(d.type == 3)
        {
            context.beginPath();
            context.strokeStyle = data.color;
            context.moveTo(data.x, data.y);
            context.lineTo(data.x2, data.y2);
            context.lineWidth = data.width;
            context.stroke();
        }
        if(d.type == 4)
        {
            context.beginPath();
            context.arc(data.x, data.y, data.radius, 0, 2 * Math.PI, false);
            context.fillStyle = data.fillcolor;
            if(data.fillcolor != "") context.fill();
            context.lineWidth = data.width;
            context.strokeStyle = data.color;
            context.stroke();
        }
    }
    images = [];
}
function clear_canvas(canvas) {
    canvas.clearRect(0, 0, 1400, 700);
}
function draw_grid(x, y, w, h, draw_queue)
{

    var marginleft = w / 9;
    var margintop = h / 9;
    w += 6 * NARROW_LINE + 2 * WIDE_LINE;
    h += 6 * NARROW_LINE + 2 * WIDE_LINE;
//x += marginleft;
//y += margintop;
//console.log(margintop);
var buffer = 0;
for(var i = 1; i < 9; i++)
{
    var stroke = NARROW_LINE;
    if(i % 3 == 0) stroke = WIDE_LINE;
    buffer += stroke / 2;
//vodoravne
draw_line(x, y + i * margintop + buffer, w + x, y + i * margintop + buffer, stroke, 'green', draw_queue);
//navpicne
draw_line(x  + i * marginleft + buffer, y, x  + i * marginleft + buffer, y + h, stroke, 'green', draw_queue);
buffer += stroke / 2;

}
}
function get_tile_pos(x_t, y_t, x, y, w, h)
{
    var marginleft = w / 9;
    var margintop = h / 9;
    var x_start = x + x_t * marginleft + x_t * NARROW_LINE;
    if(x_t > 2) x_start += WIDE_LINE - NARROW_LINE;
    if(x_t > 5) x_start += WIDE_LINE - NARROW_LINE;
    var y_start = y + y_t * margintop + y_t * NARROW_LINE;
    if(y_t > 2) y_start += WIDE_LINE - NARROW_LINE;
    if(y_t > 5) y_start += WIDE_LINE - NARROW_LINE;
    return {'x': x_start, 'y': y_start};
}
function get_tile_coord(x_pos, y_pos, x, y, w, h)
{
    var marginleft = w / 9;
    var margintop = h / 9;
    var rel_mouse_x = game_state.mouse_x - x;
    var rel_mouse_y = game_state.mouse_y - y;
//console.log(rel_mouse_x + " - " + rel_mouse_y);
for(var x_t = 0; x_t < 9; x_t++)
{
    for(var y_t = 0; y_t < 9; y_t++)
    {
        var tile_pos = get_tile_pos(x_t, y_t, x, y, w, h);
        if(tile_pos.x < x_pos && tile_pos.x  + marginleft > x_pos 
            && tile_pos.y < y_pos && tile_pos.y + margintop > y_pos)
        {
            return {'x': x_t, 'y': y_t}; 
        }
    }

}
return null;
}
function draw_tiles(x, y, w, h, game_state, draw_queue)
{
    var marginleft = w / 9;
    var margintop = h / 9;
    var rel_mouse_x = game_state.mouse_x - x;
    var rel_mouse_y = game_state.mouse_y - y;
    var color = "#1CF24E";
//console.log(rel_mouse_x + " - " + rel_mouse_y);
for(var x_t = 0; x_t < 9; x_t++)
{
    for(var y_t = 0; y_t < 9; y_t++)
    {
        var tile_pos = get_tile_pos(x_t, y_t, x, y, w, h);
        if(tile_pos.x < game_state.mouse_x && tile_pos.x  + marginleft > game_state.mouse_x 
            && tile_pos.y < game_state.mouse_y && tile_pos.y + margintop > game_state.mouse_y)
        {
            if(!is_correct_move(x_t, y_t)) color = "red";
            draw(tile_pos.x, tile_pos.y, marginleft, margintop, color, draw_queue);
        }
    }

}
//alert();
}

function draw_tiles_moves(x, y, w, h, game_state, draw_queue)
{
    var marginleft = w / 9;
    var margintop = h / 9;
    var rel_mouse_x = game_state.mouse_x - x;
    var rel_mouse_y = game_state.mouse_y - y;

    var ml = marginleft * 0.1;
    var mt = margintop * 0.1;

    var kvadranti = new Array(3);
    for (var i = 0; i < 3; i++) {
        kvadranti[i] = new Array(3);
    }

    // Draw moves X O
    for(var i = 0; i < game_state.moves.length; i++)
    {
        var move = game_state.moves[i];

        var kvadrant_x = Math.floor(move.x / 3);
        var kvadrant_y = Math.floor(move.y / 3);
        if(!kvadranti[kvadrant_x][kvadrant_y]) kvadranti[kvadrant_x][kvadrant_y] = 1;
        else kvadranti[kvadrant_x][kvadrant_y]++;

        var tile_pos = get_tile_pos(move.x, move.y, x, y, w, h);
        var m = marginleft / 10;
        if(move.player == 1)
        {
            draw_circle(tile_pos.x + marginleft / 2, tile_pos.y + margintop / 2, marginleft / 2 - m, NARROW_LINE + 1, "", "", draw_queue);
        }
        else if(move.player == 0)
        {
            draw_line(tile_pos.x + m, tile_pos.y + m, tile_pos.x + marginleft - m, tile_pos.y + margintop - m, NARROW_LINE + 1, 'black', draw_queue);
            draw_line(tile_pos.x + marginleft - m, tile_pos.y + m, tile_pos.x + m, tile_pos.y + margintop - m, NARROW_LINE + 1, 'black', draw_queue);
        }
        else if(move.player == 666)
        {
            for(var k = 0; k < 10; k++)
            {   
                draw_line(tile_pos.x + m * k, tile_pos.y, tile_pos.x + m * k, tile_pos.y + margintop, NARROW_LINE + 1, 'black', draw_queue);   
            }
        }

    }
    marginleft = w / 3;
    margintop = h / 3;

    ml = marginleft * 0.1;
    mt = margintop * 0.1;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            //if(!game_state.kvadrant_zmage[i]) continue;
            //if(!game_state.kvadrant_zmage[i][j]) continue;
            var status = game_state.kvadrant_zmage[i][j];
            var tile_pos = get_tile_pos(i * 3, j * 3, x, y, w, h);
            if(status == 0)
            {
                draw_line(tile_pos.x + m, tile_pos.y + m, tile_pos.x + marginleft - m, tile_pos.y + margintop - m, NARROW_LINE + 3, 'red', draw_queue);
                draw_line(tile_pos.x + marginleft - m, tile_pos.y + m, tile_pos.x + m, tile_pos.y + margintop - m, NARROW_LINE + 3, 'red', draw_queue);
            }
            if(status == 1)
            {
                draw_circle(tile_pos.x + marginleft / 2, tile_pos.y + margintop / 2, marginleft / 2 - m, NARROW_LINE + 3, "red", "", draw_queue);
            }
        }
    }
}
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
function is_correct_move(x, y)
{
    var kvadrant_x = Math.floor(x / 3);
    var kvadrant_y = Math.floor(y / 3);


    if(kvadrant_x != game_state.active_box.x || kvadrant_y != game_state.active_box.y)
    {
        return false;

    }
    for(var i = 0; i < game_state.moves.length; i++)
    {
        //že obstaja move
        if(x == game_state.moves[i].x && y == game_state.moves[i].y) return false;
    }

    return true;
}

function execute_tile_click_logic(x, y)
{
    if(is_correct_move(x, y)){
        game_state.moves.push({'x': x, 'y': y, 'player': game_state.player % 2});
        
        game_state.active_box.x = x % 3;
        game_state.active_box.y = y % 3;

        var kvadrant_x = Math.floor(x / 3);
        var kvadrant_y = Math.floor(y / 3);

        game_state.polja[kvadrant_x][kvadrant_y][x % 3][y % 3] = game_state.player % 2; 
        console.log(x + ", " + y);
        game_state.player++;

        var kvadranti = new Array(3);
        for (var i = 0; i < 3; i++) {
            kvadranti[i] = new Array(3);
        }

        // Draw moves X O
        for(var i = 0; i < game_state.moves.length; i++)
        {

            var move = game_state.moves[i];
            //if(move.player == 666) continue;
            var kvadrant_x = Math.floor(move.x / 3);
            var kvadrant_y = Math.floor(move.y / 3);
            if(!kvadranti[kvadrant_x][kvadrant_y]) kvadranti[kvadrant_x][kvadrant_y] = 1;
            else kvadranti[kvadrant_x][kvadrant_y]++;

        }


        //Draw Closed tiles
        for(var x_t = 0; x_t < 9; x_t++)
        {
            for(var y_t = 0; y_t < 9; y_t++)
            {
                var kvadrant_x = Math.floor(x_t / 3);
                var kvadrant_y = Math.floor(y_t / 3);

                var next_kvadrant_x = x_t % 3;
                var next_kvadrant_y = y_t % 3;
                if(kvadranti[next_kvadrant_x][next_kvadrant_y] == 9 && game_state.polja[kvadrant_x][kvadrant_y][x_t % 3][y_t % 3] == -1)
                {
                    game_state.polja[kvadrant_x][kvadrant_y][x_t % 3][y_t % 3] = 666;
                    game_state.moves.push({'x': x_t, 'y': y_t, 'player': 666});   
                }

            }

        }
        check_kvadrant_zmaga(game_state);
        check_zmaga(game_state);

    }
}
canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt);
    game_state.mouse_x = mousePos.x;
    game_state.mouse_y = mousePos.y;
//console.log(game_state.mouse_x + " - " + game_state.mouse_y);
}, false);
canvas.addEventListener('mousedown', function(evt) {
    var mousePos = getMousePos(canvas, evt);
//game_state.mouse_x = mousePos.x;
//game_state.mouse_y = mousePos.y;
game_state.mouse_click.push({x: mousePos.x, y: mousePos.y});
}, false);
var screen_width = 600;
var screen_height = 600;
var screen_x = 0;
var screen_y = 0;

function check_kvadrant_zmaga(game_state)
{

    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var status = game_state.kvadrant_zmage[i][j];
            if(status == -1)
            {
                for(var z = 0; z < WIN_COMBO.length; z++)
                {
                    var zmaga0 = true;
                    var zmaga1 = true;
                    for(var u = 0; u < WIN_COMBO[z].length; u++)
                    {
                        var x = WIN_COMBO[z][u][0];
                        var y = WIN_COMBO[z][u][1];
                        //console.log(game_state.polja[i][j][x][y]);
                        if(game_state.polja[i][j][x][y] != 0) 
                        {
                            zmaga0 = false;
                            //break;
                        } 
                        if(game_state.polja[i][j][x][y] != 1) 
                        {
                            zmaga1 = false;
                            //break;
                        } 
                    }
                    //console.log(x, y, game_state.polja[i][j][x][y], zmaga0, zmaga1);
                    if(zmaga0) game_state.kvadrant_zmage[i][j] = 0;
                    if(zmaga1) game_state.kvadrant_zmage[i][j] = 1; 
                }
            }

        }
    }

}
function check_zmaga(game_state)
{

    for(var z = 0; z < WIN_COMBO.length; z++)
    {
        var zmaga0 = true;
        var zmaga1 = true;
        for(var u = 0; u < WIN_COMBO[z].length; u++)
        {
            var x = WIN_COMBO[z][u][0];
            var y = WIN_COMBO[z][u][1];
            //console.log(game_state.polja[i][j][x][y]);
            if(game_state.kvadrant_zmage[x][y] != 0) 
            {
                zmaga0 = false;
                //break;
            } 
            if(game_state.kvadrant_zmage[x][y] != 1) 
            {
                zmaga1 = false;
                //break;
            } 
        }
        //console.log(x, y, game_state.polja[i][j][x][y], zmaga0, zmaga1);
        if(zmaga0) game_state.zmaga = 0;
        if(zmaga1) game_state.zmaga = 1; 
        console.log(game_state.zmaga);
    }

}

function new_game(game_state)
{
    console.log(game_state);

    game_state.mouse_x =  0;
    game_state.mouse_y =  0;
    game_state.active_box = {'x': 1, 'y': 1,};
    game_state.mouse_click =  [];
    game_state.moves =  [];
    game_state.player =  0;
    game_state.polja =  [];
    game_state.zmaga =  -1;

    game_state.polja = new Array(3);
    for (var i = 0; i < 3; i++) {
        game_state.polja[i] = new Array(3);
        for (var j = 0; j < 3; j++) {
            game_state.polja[i][j] = new Array(3);
            for (var k = 0; k < 3; k++) {
                game_state.polja[i][j][k] = new Array(3);
                for (var l = 0; l < 3; l++) {
                    game_state.polja[i][j][k][l] = -1;
                }
            }
        }
    }

    game_state.kvadrant_zmage = new Array(3);
    for (var i = 0; i < 3; i++) {
        game_state.kvadrant_zmage[i] = new Array(3);
        for (var l = 0; l < 3; l++) {
            game_state.kvadrant_zmage[i][l] = -1;
        }
    }

}
new_game(game_state);
function main() {

    requestAnimationFrame(main);
    var drawQueue = [];
    for(var i = 0; i < game_state.mouse_click.length; i++)
    {
        //if(game_state.mouse_click[i] == null) continue;
        var tile = get_tile_coord(game_state.mouse_click[i].x, game_state.mouse_click[i].y, screen_x, screen_y, screen_width, screen_height)
        execute_tile_click_logic(tile.x, tile.y);
        game_state.mouse_click.splice(i, 1);
        i--;
    }

    draw_grid(screen_x, screen_y, screen_width, screen_height, drawQueue);
    draw_tiles(screen_x, screen_y, screen_width, screen_height, game_state, drawQueue);
    draw_tiles_moves(screen_x, screen_y, screen_width, screen_height, game_state, drawQueue);
    clear_canvas(ctx);
    execute_draw_queue(drawQueue, ctx);
}

main();
});

