window.requestAnimFrame = (function(callback) {
  return window.requestAnimationFrame || 
  window.webkitRequestAnimationFrame || 
  window.mozRequestAnimationFrame || 
  window.oRequestAnimationFrame || 
  window.msRequestAnimationFrame ||
  function(callback) { window.setTimeout(callback, 1000);};
})();
var pi = Math.PI;
var anim_play = false;
var Banana = function(x,y,wind){
  this.wind = wind;
  this._x_init = x;
  this._x = 0;
  this._y_init = y;
  this._y = 0;
  this._radius = 5.00;
  this._v_mag = 1.00;
  this._v_ang = 0.00; 
};
Banana.prototype = {
  launch: function(mag, ang) {
    this._v_mag = mag * 10;
    this._v_ang = ang  * (Math.PI /180); //convert to radians
    this.start_time = (new Date()).getTime();
  },
  get_pos: function(t) {
    t = (t - this.start_time) /150;
    w = this.wind * t/50;
    this._x = w + this._x_init + (this._v_mag * Math.cos(this._v_ang) * t)/10;
    this._y = this._y_init + (((this._v_mag * Math.sin(this._v_ang)) * t) - (-9.81 * (t*t)))/10;
    return {
      x: this._x,
      y: this._y,
      o: Math.ceil(t % 8) //orientation (spin)
    }; 
  }
};
var Terrain = function(height, width, player_count) {
  this.start_time = (new Date()).getTime();
  this.sun_x = width / 2;
  this.sun_y = height / 2 - 100;
  this.height = height;
  this.width = width;
  this.buildings = Array();
  this.wind = 0; //-100 to 100
  this.clouds = Array();
  this.holes = Array(); //x,y
  this.p = Array();
  var init_windows = function(h,w) {
    var lights = Array();
    var x_count = Math.floor(h / 24);
    var y_count = Math.floor(w / 15); 
    total_windows = x_count * y_count - 1;
    for(var i=0; i<total_windows; i++) {
      lights [i] = (Math.random() > 0.7) ? 1 : 0;
    }
    return {
     x_count: x_count,
     y_count: y_count,
     lights: lights
    }; 
  };
  var total_width = 0;
  var _i = 0;
  var _height;
  var _width;
  var _colors = [BLDG_COL1,BLDG_COL2,BLDG_COL3];
  while(this.width >= total_width) {
    _height = 100 + Math.random() * 145;
    _width = GORILLA_WIDTH + 40 + Math.random() * 40;
    _color = _colors[Math.round(Math.random() * 2)]; 
    total_width += _width;    
    this.buildings[_i] = { 
       height: _height, 
        width: _width,
        color: _color,
      windows: init_windows(_height,_width)
    };
    _i += 1;
  } 
  this.p[0] = Math.floor(Math.random() * _i/2);
  this.p[1] = _i - 2 - Math.floor(Math.random() * _i/2); 
  if(this.p[0] === this.p[1]) { this.p[1] += 2;}
  this.init_clouds();
};
Terrain.prototype = {
  add_hole: function(x,y) {
    this.holes.push({x:x,y:y});
  },
  init_clouds: function() {
    this.wind = Math.random() * 100 * ((Math.random() > 0.45) ? -1 : 1); //-100 to 100
    cloud_count = Math.floor(Math.random() * 10) + 3;
    for (var i = 0; i < cloud_count; i++) {
     this.clouds.push((this.add_cloud()));
    }
  },
  add_cloud: function() {
    var bubble_count = 5 + Math.floor(Math.random() * 2.5); //5 to 20
    var _b = [];
    center = Math.round(bubble_count /2);
    thick_mod = 1;
    for (var i = 0; i< bubble_count; i++) {
      _b[i] = [i *4 * Math.random() + 1, Math.random() * 5 + 1];// ( thick_mod)];
      //thick_mod = (i < center) ? thick_mod + 7 : thick_mod -7;
    }
     _w = Math.random() * 40;
     _h = Math.random() * 10; 
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height/3,
      b: _b
    };
  },
  get_roof_pos: function(building_index) { //top left corner of roof
    var _x = 0; 
    for (var i=0; i < building_index; i++) {
      _x += this.buildings[i].width; 
    }
    return {
     x: _x + this.buildings[building_index].width / 2, //midpoint of player's rooftop
     y: this.height - this.buildings[building_index].height //canvas height - building's height = top of building
    };
  }
};
//background color deciminal values used for hit detection. 
var DEBUG   = true;
//               bg blue  |sun yellow|
var BG_COLORS =  [0,0,173,255,255,0];
//     index: 0        3        6         9
//               building    |off win |on window|gorilla   |teal      | 
var HIT_COLORS = [168,168,168,84,84,84,252,252,84,252,173,81,7,168,168,168,0,0];

var GORILLA_WIDTH = 28;
var GORILLA_HEIGHT = 35;
var GORILLA_COL = 'rgb('+HIT_COLORS[9]+','+HIT_COLORS[10]+','+HIT_COLORS[11]+')';
var BLDG_COL1 = 'rgb('+HIT_COLORS[0]+','+HIT_COLORS[1]+','+HIT_COLORS[2]+')';
var BLDG_COL2 = 'rgb('+HIT_COLORS[12]+','+HIT_COLORS[13]+','+HIT_COLORS[14]+')';
var BLDG_COL3 = 'rgb('+HIT_COLORS[15]+','+HIT_COLORS[16]+','+HIT_COLORS[17]+')';

//background items
var SUN_COL = 'rgb('+BG_COLORS[3]+','+BG_COLORS[4]+','+BG_COLORS[5]+')';
var BANANA_COL = SUN_COL;
var CLOUD_COL = 'rgb(250,250,250)';
var SKY_COL = 'rgb('+BG_COLORS[0]+','+BG_COLORS[1]+','+BG_COLORS[2]+')';

var Stateful = function(states, init_state, default_next_map) {
  if (typeof(states) === 'number') {
    this.states = [];
    for (var i = 0; i < states; i++) {
      this.states[i] = "_" + i; //prefix with _ (_0,_1,_2...) so state labels are strings 
    }
  } else {
    this.states = states;
  }
  this.next_map= {};
  if ([undefined,false].indexOf(default_next_map) === -1) {
    this.next_map[this.states[-1]] = this.states[0]; //last points to first
    var c = this.states.length -1;
    for(var j = 0; j < c; j++) {
      this.state_map[this.states[j]] = this.states[j+1]; 
    }
  }
  this.state = this.states[init_state];
  this.last = this.state;
  this.in_transition = false;
};

Stateful.prototype = {
  get: function() {
    return {current: this.state, last: this.last};
  },
  set_map: function(from, to) {
    if (this.states.indexOf(from) !== -1) {
      this.next_map[from] = to;
    } else {
      throw ('cannot use set_map with unregistered state ' + from); 
    }  
  },
  next: function(delay) {
    var next_state = (typeof(this.next_map[this.state]) === undefined) ? this.state : this.next_map[this.state];
    this.update(next_state, delay);
  },
  update: function (new_state,delay) {
    var self = this;
    delay = (typeof(delay) === 'number') ? delay : 0;
    if (delay === 0) {
        this.last = this.state;
        this.state = new_state; 
    } else {
      this.in_transition = true;
      window.setTimeout(function() {
        self.update(new_state,0);
        self.in_transition = false;
      }, delay);
    }
  },
  walk: function(interval) {
    var self = this;
    window.setInterval(function() {
      self.next();    
    },interval);
  },
  recently_updated: function() {
    return (this.state === this.last) ? true : false;
  }
};
var Game = function(canvas,players,rounds){
  this.state = new Stateful(7,0);
  this.time = 0;
  this.dt = 0;
  this.anim_cycle = 0;
  this.anim_cycle_count= 0;
  this.arm_anim_type = 0; //0 = still, no motion
  this.canvas = canvas; 
  this.context = this.canvas.getContext('2d');
  this.static_bg = document.createElement('canvas');
  this.static_bg.height = this.canvas.height;
  this.static_bg.width  = this.canvas.width;
  this.static_bg.getContext('2d').drawImage(canvas, 0, 0); //save
  this.context.drawImage(this.static_bg,0,0); //restore
  this.banana;
  this.terrain; 
  this.in_play = false;
  this.hit_type = 0; // 0 = no hit, 1 = out of bounds, 2 = terrain, 3 = gorilla;
  this.players = players;
  this.player_count = this.players.length;
  this.player_turn = 0;
  this.drawing_player = 0; //draw terrain from left to right, always draw player 1 before player 2
  this.total_rounds = rounds;
  this.round= 1;
  this.time_last = (new Date()).getTime();
  this.text = ['H T M L 5  G O R I L L A S', 'STARRING:', '', ''];
  this.play_game();
};
var Player = function(name,type) {
  this.name = name;
  //type: human (default), cpu, remote_human
  this.type = (type != undefined) ? type : 'human';
  this.last_shot = {ang: 0, vel: 0, x: 0, y: 0}
  this.score = 0;
  this._x = 0;
  this._y = 0;
  if (this.type === 'cpu') {
  //
  }
};
Player.prototype = {
  add_score: function(){
    this.score += 1;
  },
  reset_score: function (){
    this.score = 0;
  },
  set_position: function(x,y) {
    this._x = x;
    this._y = y;
  },
  set_last_shot_launch: function(ang,vel) {
    this.last_shot.ang = ang;
    this.last_shot.vel = vel;
  },
  set_last_shot_hit: function(x,y) {
    this.last_shot.x = x; 
    this.last_shot.y = y;
  },
  get_last_shot: function() {
    return this.last_shot;
  },
  get_info: function() {
    return {
       type: this.type,
       name: this.name,
      score: this.score,
          x: this._x,
          y: this._y
    }; 
  }
};
Game.prototype = {
  play_game: function() {
    this.text[2] = this.players[0].get_info().name + " AND " + this.players[1].get_info().name;
  },
  play_round: function(callback) {
    if(this.round <= this.total_rounds) {
      this.state.update('_2'); // = 2;
      var pos;
      this.create_static_elements();
      this.round+=1;
      for(var i = 0; i < this.players.length; i++) {
        if (this.players[i].type === "cpu") {
          var _i = (i === 0) ? 1: 0; //other player index
          var target = this.players[_i].get_info();
          var self = this.players[i].get_info();
          this.players[i].ai.see_conditions(self.x, self.y, target.x, target.y, this.terrain.wind);
        }
      }
    } else {
      this.state.update('_4');// = 4;
    }
  },
  create_static_elements: function() { //buildings, gorilla body, sun
    this.terrain = new Terrain(this.canvas.height, this.canvas.width, this.player_count);
    var width_offset = 0;
    var _x; 
    var _y;
    //draw sun and sky
    this.context.fillStyle = SKY_COL;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.beginPath();
    this.context.fillStyle = SUN_COL;
    this.context.arc(this.terrain.sun_x, this.terrain.sun_y, 20, 0,2 * Math.PI ,false);
    this.context.closePath();
    this.context.fill();
    this.context.beginPath();
    for (var j = 0; j < this.terrain.buildings.length; j++) {
      b = this.terrain.buildings[j];
      this.context.fillStyle = b.color;//'#212121'; light grey, teal, red
      this.context.fillRect(width_offset, this.canvas.height - b.height,b.width - 1, b.height);
      _x = 0; 
      _y = 0;
      for(k=0; k <= b.windows.lights.length; k++) {
        this.context.fillStyle = (b.windows.lights[k] == 1) ? '#dddd00' : '#343434';
        this.context.fillRect(width_offset + _x + 5, this.canvas.height - b.height + _y + 5,6, 14);
        _x += 15;
        if(_x >= b.width - 20) {
          _x = 0;
          _y += 25;
        }
      }
      if (j === this.terrain.p[0] || j === this.terrain.p[1]) {
         _x = this.terrain.buildings[j].width + width_offset - b.width/2;
         _y = this.canvas.height - this.terrain.buildings[j].height;
        this.players[this.drawing_player].set_position(_x,_y);
        this.draw_gorilla(_x,_y);
        this.drawing_player = (this.drawing_player === 0) ? 1: 0; 
      }
      width_offset += b.width;
    }  
    this.static_bg.getContext('2d').drawImage(this.canvas, 0, 0); //save
    delete this.terrain.buildings;
  },
  play_turn: function(mag, ang) {
    if (!this.in_play && this.state.in_transition === false) {
      this.in_play = true;
      cur_player = this.players[this.player_turn].get_info();
      var player_offset = GORILLA_WIDTH /2;
      if (this.player_turn === 1) {
        player_offset = 0;
        this.arm_anim_type = 2;
        ang = Math.abs(Math.abs(ang - 180) - 360);
        this.player_turn = 0;
      } else {
        player_offset = -1 * player_offset;
        this.arm_anim_type = 2;
        ang = Math.abs(ang - 360);
        this.player_turn = 1;
      }
      //this.debug(this.player_turn);
      this.banana = new Banana(cur_player.x + player_offset, cur_player.y - 45, this.terrain.wind);
      this.arm_anim_type = 1;
      this.hit_type = 0;
      this.banana.launch(mag,ang);
    }
  },
  //game states
  //0 : first time setup -> 1
  //1 : player intro screen -> 2
  //2 : playing the game (draw clouds, throws, etc) -> 3
  //3 : player hit detected (win animation, screen similar to intro screen shows score) -> 2 OR 4
  //4 : show overall winner by most round won -> 0 OR 1 (0:end or 1:rematch) ??
  animate: function() {
    this.time = (new Date()).getTime();
    this.dt = this.time - this.time_last;
    this.time_last = this.time;
    switch(this.state.get().current) {
      case '_2':
        this.context.drawImage(this.static_bg,0,0); //restore
        this.animate_arms(); //changes state 
        this.draw_holes(); 
        if (this.in_play === true) {
          pos = this.banana.get_pos(this.time);
          this.draw_banana(pos.x, pos.y, pos.o);
          this.detect_hit(pos.x, pos.y);
          if (this.hit_type !== 0) {
            if(this.hit_type === 3) { // && this.arm_anim_type != 3) {
//
              this.text[1] = this.players[0].name+": "+this.players[0].score;
              this.text[2] = this.players[1].name+": "+this.players[1].score;
              if (this.round <= this.total_rounds) {
                //this.text = ['DEBUG 2??','','','ROUND ' + this.round + ' of ' +this.total_rounds];
                this.text[3] = 'ROUND ' + this.round + ' of ' +this.total_rounds;
                this.state.update('_1',3000); // = 1;
              } else {
                this.state.update('_4',3000);// = 4;
                if (this.players[0].score === this.players[1].score) {
                  this.text[3] = 'Draw!';
                } else {
                  this.text[3] = (this.players[0].score > this.players[1].score) ? this.players[0].name : this.players[1].name;
                  this.text[3] += " wins!";
                }
                this.text[0] = 'GAME OVER';
                this.state.update('_4',3000);// = 4;
              }
//
            } //end player hit in the face 
          }
        }
        this.draw_clouds();
        //draw bananas in the clouds
        //for (q=0; q<10; q++) { 
        //  this.draw_banana((10+15*q), 50, q);
        //}
        break;
      case '_0':
        //reset game
        this.players[0].reset_score();
        this.players[1].reset_score();
        this.round = 1;
        this.state.update('_1');// = 1;
        break;
      case '_3':
      case '_4':
      case '_1':
        this.arm_anim_type = 0;
        this.context.fillStyle = '#000000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = '#408404';
        this.context.font="16px monospace";
        this.draw_str(this.text[0],50);
        this.draw_str(this.text[1],90);
        this.draw_str(this.text[2],130);
        this.draw_str(this.text[3],330);
        var gx = this.canvas.width/2 - GORILLA_WIDTH;
        this.draw_gorilla(gx,200,true);
        this.draw_gorilla(gx+GORILLA_WIDTH+50,200,true);
        this.anim_cycle += this.dt;
//rarty
        if(this.anim_cycle > 2400 && this.anim_cycle <= 3900 && this.state.get().current === '_1') {
          this.text[3] = 'ROUND ' + this.round + ' of ' +this.total_rounds;
        } else if(this.anim_cycle > 3900 && this.state.get().current  === '_1') {
          this.anim_cycle = 0;
          this.play_round();
        }
        break;
    }
    this.context.save();
    this.context.restore();
  },
  draw_str: function(str,y) {
    this.context.fillText(str, (this.canvas.width/2) - (str.length/2 * 10),y);
  },
  draw_test: function() {
   for(i= 0; i < this.debug_m.length; i++) {
     this.context.fillStyle = '#'+this.debug_m[i][0];//'yellow';//this.banana._color;
     this.context.fillRect(this.debug_m[i][1],this.debug_m[i][2],18,10);
     this.context.save();
     this.context.restore();
   }
  },
  draw_clouds: function() {
    for (i = 0; i < this.terrain.clouds.length; i++) {
      if (this.terrain.clouds[i].x - 200 > this.canvas.width) {
        this.terrain.clouds[i].x = -150;
        this.terrain.clouds[i].y = this.terrain.clouds[i].y + (Math.random() *3);
      } else if (this.terrain.clouds[i].x + 200 < 0) {
        this.terrain.clouds[i].x = this.canvas.width + 150;
        this.terrain.clouds[i].y = this.terrain.clouds[i].y + (Math.random() *3);
      } else {
        this.terrain.clouds[i].x += .005 * this.terrain.wind + i * .001;
      }
      for(j = 0; j < this.terrain.clouds[i].b.length; j++) {
        this.context.beginPath();
        this.context.fillStyle = CLOUD_COL; 
        this.context.arc(this.terrain.clouds[i].x + this.terrain.clouds[i].b[j][0] + 18 * j,
                         this.terrain.clouds[i].y + this.terrain.clouds[i].b[j][1],
                         (this.terrain.clouds[i].b[j][0] % 4) * this.terrain.clouds[i].b[j][1] + 22, // +  this.terrain.clouds[i].b[j][2] , 
                         0,2 * Math.PI ,false);
        this.context.closePath();
        this.context.fill();
      }
    }
  },
  detect_hit: function(x,y) {
    if (x > -10 && x - 10 < this.canvas.width && y < this.canvas.height) {
      var c0 = this.context.getImageData(x+3, y+5, 1, 1).data[0]; //getImageData values are in decimal
      if(y > 0 && x > -10 && x < this.canvas.width + 10 && 
        ((c0 === HIT_COLORS[0] || c0 === HIT_COLORS[3] || 
          c0 === HIT_COLORS[6] || c0 === HIT_COLORS[9] ||
          c0 === HIT_COLORS[12]|| c0 === HIT_COLORS[15] ) ? true : false)) {
        this.terrain.add_hole(x,y);
        this.hit_type = 2; //could be a terrain hit.
      }
    } else {
      this.hit_type = 1; //off the screen on the x-axis
    } 
    if (this.hit_type !== 0) {
      this.in_play = false;
      var throwing_player = (this.player_turn === 0) ? 1 :0;
      p1 = this.players[0].get_info();
      p2 = this.players[1].get_info();
      this.players[throwing_player].set_last_shot_hit(x,y); 

      var player_hit = function(_x,_y) {
        var p_hit = 9;
        if(c0 === HIT_COLORS[9]) { }
        if(_x > (p1.x - 29) && _x < (p1.x + 9) && _y < (p1.y + 40)) {p_hit =0;}
        if(_x > (p2.x - 29) && _x < (p2.x + 9) && _y < (p2.y + 40)) {p_hit =1;}
        return p_hit;
      }(x,y);
      if(player_hit != 9) {
        var winner = (player_hit === 0) ? 1 : 0;
        this.players[winner].add_score();
        this.arm_anim_type = 3;
        this.player_turn = player_hit;
        this.hit_type = 3; 
      }
    }
  },
  draw_holes: function() {
    var h = this.terrain.holes;
    var len = h.length; 
    if (len > 0) {
      this.context.fillStyle = SKY_COL;
      for(i = 0; i < len; i++) {
        this.context.beginPath();
        this.context.arc(h[i].x - 4, h[i].y -4, 12, 0,Math.PI*2,false);
        this.context.fill();
        this.context.closePath();
      } 
    }
  },
  draw_banana: function(x,y,orientation) {
    this.context.beginPath();
    this.context.fillStyle = BANANA_COL; //"rgb(250,0,0)";//'#efef00';//'yellow';//this.banana._color;
    cx = x; cy = y;
    _x = x; _y = y;
    switch(orientation) {
      case 1: //   )
        cax = -2.5; cby = -5;
        ccx = 0.5;   cdy = 5;
        cex = 3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+ccx,cy+cby,cx+ccx,cy+cdy,cx+cax,cy+cdy);
        this.context.bezierCurveTo(cx+cex,cy+cdy,cx+cex,cy+cby,cx+cax,cy+cby);
        break;
      case 2: // /
        cax = 1.75; cby = -5.3;
        ccx = 2.5;  cdy = -2.5
        cex = 1;    cfy = 1;
        cgx = -3.5; chy = 3.5;
        cix = 3.5;  cjy = 5;
        ckx = 0;    cly = -5; 
        cmx = 0;    cny = -3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+ccx,cy+cdy,cx+cex,cy+cfy,cx+cgx,cy+chy);
        this.context.bezierCurveTo(cx+cix,cy+cjy,cx+cix,cy+cly,cx+cix,cy+cny);
        break;
      case 3: // --- bow down
        cax = -5;  cby = -2.5;
        ccx = 5; cdy = -0.5;
        cex = 0;   cfy = 3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+cax, cy+cdy, cx+ccx, cy+cdy, cx+ccx, cy+cby);
        this.context.bezierCurveTo(cx+ccx, cy+cfy, cx+cax, cy+cfy, cx+cax, cy+cby);
        break;
      case 4: // \
        ax = -1.8; ay = -5.6;
        bx = -3;   by = -4.24;
        cx = -3.7; cy = 2.8;
        dx = 5.1; dy = 1.4;
        ex = .9; ey = 5.6;
        fx = -6.1; fy = -1.41;
        this.context.moveTo(_x+ax,_y+ay);
        this.context.bezierCurveTo(_x+bx,_y+by,_x+cx,_y+cy,_x+dx,_y+dy);
        this.context.bezierCurveTo(_x+ex,_y+ey,_x+fx,_y+fy,_x+ax,_y+ay);
        break;
      case 5: // | (
        cax = 2.5; cby = -5;
        ccx = .5;   cdy = 5;
        cex = -3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+ccx,cy+cby,cx+ccx,cy+cdy,cx+cax,cy+cdy);
        this.context.bezierCurveTo(cx+cex,cy+cdy,cx+cex,cy+cby,cx+cax,cy+cby);
        break;
      case 6: // /
        cax = -1.75; cby = 5.3;
        ccx = -2.5;  cdy = 2.5
        cex = -1;    cfy = -1;
        cgx = 3.5; chy = -3.5;
        cix = -3.5;  cjy =-5;
        ckx = 0;    cly = 5; 
        cmx = 0;    cny = 3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+ccx,cy+cdy,cx+cex,cy+cfy,cx+cgx,cy+chy);
        this.context.bezierCurveTo(cx+cix,cy+cjy,cx+cix,cy+cly,cx+cix,cy+cny);
        break;
      case 7: // -- bow up
        cax = 5;  cby = 2.5;
        ccx = -5; cdy = .5;
        cex = 0;   cfy = -3.5;
        this.context.moveTo(cx+cax,cy+cby);
        this.context.bezierCurveTo(cx+cax, cy+cdy, cx+ccx, cy+cdy, cx+ccx, cy+cby);
        this.context.bezierCurveTo(cx+ccx, cy+cfy, cx+cax, cy+cfy, cx+cax, cy+cby);
        break;
      case 8: // \
        ax = -6.15; ay = -1.41;
        bx = -4.7;   by = -2.83;
        cx = 2.327; cy = 4.242;
        dx = .9; dy = 5.656;
        ex = 5.155; ey = 1.43;
        fx = -1.9; fy =-5.656;
        this.context.moveTo(_x+ax,_y+ay);
        this.context.bezierCurveTo(_x+bx,_y+by,_x+cx,_y+cy,_x+dx,_y+dy);
        this.context.bezierCurveTo(_x+ex,_y+ey,_x+fx,_y+fy,_x+ax,_y+ay);
        break;
    }
    this.context.closePath();
    this.context.fill();
  },
  animate_arms: function() {
    var x_offset = -12;
    //               active    other
    //               R    L    R    L
    var y_offsets = [-11, -11, -11, -11];
    var other_player = (this.player_turn === 0) ? 1: 0;
    switch (this.arm_anim_type) {
       case 0: //idle

       break;
       case 1: //active player throws
         //y_offsets = [-10, -11, -11, -21];
         y_offsets[3 - other_player] = -21; // [-10, -11, -11, -21];
         this.anim_cycle += this.dt;
         if (this.anim_cycle > 600) {
           this.anim_cycle = 0;
           this.arm_anim_type =0;
         }
       break;
       case 3: //case 3 and 4 do the winning arm animation.
        this.anim_cycle += this.dt;
        y_offsets[3 - other_player] = -21; // [-10, -11, -11, -21];
        if(this.anim_cycle > 400) {
          this.anim_cycle = 0;
          this.arm_anim_type = 4;
        }
       break;
       case 4: 
        this.anim_cycle += this.dt;
        y_offsets[2 + other_player] = -21;
        if(this.anim_cycle > 400) {
          this.anim_cycle = 0;
          this.arm_anim_type = 3;
        }
       break;
    }
    this.draw_limb(this.players[this.player_turn]._x + x_offset, this.players[this.player_turn]._y + y_offsets[0],'R');
    this.draw_limb(this.players[this.player_turn]._x + x_offset - 14, this.players[this.player_turn]._y + y_offsets[1],'L'); 
    this.draw_limb(this.players[other_player]._x + x_offset, this.players[other_player]._y + y_offsets[2],'R');
    this.draw_limb(this.players[other_player]._x + x_offset - 14, this.players[other_player]._y + y_offsets[3],'L'); 
  },
  draw_gorilla: function(x,y,drawing_player) { //static gorilla without arms
   
    if (this.arm_anim_type === 0 || drawing_player !== this.player_turn){
    if(drawing_player != undefined) { 
      draw_arms = true;
    } else { 
      draw_arms = false;
    }
    y = y - GORILLA_HEIGHT;//this.canvas.height - y;// - GORILLA_HEIGHT;
    x = x - GORILLA_WIDTH /2; //28
    this.context.fillStyle = GORILLA_COL;//'#916a34';//'yellow';//this.banana._color;
    this.context.fillRect(x-4, y+6, 8, 9); //neck
    this.context.fillRect(x-6, y, 12, 10); //head (x,y-height,WIDTH,height)
    this.context.fillRect(x-8, y+2, 16, 5); //ears
    this.context.fillRect(x-8, y+13, 16, 12); //torso
    this.context.fillRect(x-9, y+12, 20, 9); //chest
    if (draw_arms === true) {
      this.draw_limb(x +2, y + GORILLA_HEIGHT-11,'R'); //right arm
      this.draw_limb(x -12, y + GORILLA_HEIGHT-11,'L'); //right arm
    }
    this.draw_limb(x-5, y + GORILLA_HEIGHT,'R'); //right leg
    this.draw_limb(x-7, y + GORILLA_HEIGHT,'L'); //leftleg
    //features
     
    this.context.fillStyle = SKY_COL;
    this.context.moveTo(x, y);
    this.context.fillRect(x-4, y+2, 8, 1); //brow ---
    this.context.fillRect(x-4, y+5, 4, 1); //eyes - -
    this.context.fillRect(x+2, y+5, 4, 1);
    this.context.fillRect(x-7, y+14, 1, 3); //chest |_|_ 
    this.context.fillRect(x+1, y+14, 1, 3);  
    this.context.fillRect(x-6, y+17, 6, 1); 
    this.context.fillRect(x+2, y+17, 6, 1);
    }
  },
  draw_limb: function(x,y,o) { //o = 'L' or 'R' TACOS
    //                           cx1, cy1, cx2, cy2, x  , y
    //this.context.bezierCurveTo(130, 100, 130, 150, 230, 150);
    // assume bottom left corner of gorilla is given
    var a = 6;
    this.context.fillStyle = GORILLA_COL;
    this.context.beginPath();
    x = x+a;
    a2 = a + 5;
    this.context.moveTo(x, y);
    if (o === 'R') { // draw bottom to top
      this.context.bezierCurveTo(x + a, y, x + a, y - a2, x, y - a2);
      this.context.lineTo(x + a,y - a2);
      this.context.bezierCurveTo(x + a+ a, y-a2, x + a +a, y, x + a, y);
    } else { // if(o === 'L') {
      this.context.bezierCurveTo(x - a, y, x - a, y - a2, x, y - a2);
      this.context.lineTo(x - a,y - a2);
      this.context.bezierCurveTo(x - a- a, y-a2, x - a -a, y, x - a, y);
    }
    this.context.fill();
    this.context.closePath();
  },
  debug: function(msg) {
    if (DEBUG === true) {
      console.log(msg + ' '+ (new Date()).getTime());
    }
  }
};
document.addEventListener('DOMContentLoaded', function() {
  //begin jquery stuff
  var canvas = document.getElementById("myCanvas");
  var q1 = document.getElementsByName("player1");
  //var p2 = document.getElementsByName("player2");
  var i = 0;
  var players =[0,1];
  var default_names = [{name: 'Player 1', type: 'human'}, {name: 'Player 2', type: 'human'}];
  var user_names = default_names;
  var pregame = $("#preGame");
  var game;
  $(canvas).parent().hide();
  pregame.find("input[type='text']").each(function() {
    $(this).val(default_names[i].name);
    $(this).parent().find("input[type='checkbox']").on("click", {ind: i}, function(event) {
      user_names[event.data.ind].type = ($(this).prop("checked")) ? 'cpu' : 'human';
    });
    $(this).on("focus blur", {ind:i}, function (event) {
      if ($(this).val() === default_names[event.data.ind].name) {
        $(this).val('');
      } else {
        user_names[event.data.ind].name = $(this).val();
      }
    });
    i++;
  }); 
  var Cpu_player = function() {
    this.turn_history = Array();
  }
  Cpu_player.prototype = {
    see_conditions: function (my_x, my_y, target_x, target_y, wind) {
      //bot's wind value is negative if it moves against the direction they are throwing
      wind = ((wind > 0 && target_x > my_x) || (wind < 0 && target_x < my_x)) ? wind : wind * -1;
      this.conditions = {
            my_x: my_x,
            my_y: my_y,
        target_x: target_x,
        target_y: target_y,
          x_dist: Math.abs(my_x - target_x),
          y_dist: Math.abs(my_y - target_y),
            wind: wind
      };
    },
    add_turn_history: function (turn) {
      if(this.turn_history === undefined || this.turn_history.length < 1) {
        this.turn_history = Array();
      }
      this.turn_history.push(turn);
    },
    get_turn: function() { //aka this dumb computer player
      //TODO examine past turns, adjust velocity step value accordingly
      //TODO account for wind
      //TODO determine when to adjust angle, velocity, or angle and velocity
      last_shot_dist = Math.abs(this.turn_history[this.turn_history.length -1].x - this.conditions.my_x);
      //this.debug(last_shot_dist + ", " + this.conditions.x_dist);
      if (this.turn_history.length <= 1) {
        return {ang: 45, vel: 15}; //first turn
      } else {
        var ang;
        var vel;
        var dif = 3;
        //dif = Math.abs(Math.ceil(last_shot_dist - this.conditions.x_dist) / 10);
        if (last_shot_dist < this.conditions.x_dist) {
          vel = this.turn_history[this.turn_history.length - 1].vel + dif;
        } else {
          vel = this.turn_history[this.turn_history.length - 1].vel - dif - 2;
        }
        return {ang: 45, vel: vel};
      }
    }
  };
  pregame.find("input[type='button']").on("click",function(event) {
    if(user_names[0] != user_names[1] && user_names[0] !== '' && user_names[1] !== '') {
      $(this).parent().hide();
      $(canvas).parent().slideDown(function() {
        for (var j = 0; j< players.length; j++) {
          players[j] = new Player(user_names[j].name, user_names[j].type);
          players[j].ai = new Cpu_player();
        } 
        game = new Game(canvas,players,4);
        set_player_controls(players);
        game.player_turn = 0;
        loop();
      });
    }
  });

  var set_player_controls = function(players) { //for humans and computer players
    var i = 0;
    $("#gorillaGame #controls").find("form").each(function() {
      var ang;
      var vel;
      if(players[i].type === 'cpu') {
      //  return false; //do not bind controls for cpu players
      } else {
        $(this).find("input").each(function() {
          if ($(this).is("input[type='text']")) {
            $(this).on("focus blur", {player:i}, function(event) {
              if($(this).val() === 'angle' || $(this).val() === 'velocity') {
                $(this).val('');
              }
            });
          } else { //button
            $(this).on("click", {player:i}, function(event) {
              if (game.player_turn === event.data.player) {
                var ang_i = $(this).parent().find("input[name='angle']");
                    ang = $(ang_i).val();
                var vel_i = $(this).parent().find("input[name='velocity']");
                    vel = $(vel_i).val();
            
                if(!$.isNumeric(ang) || !$.isNumeric(vel)){
                  $(ang_i).val('angle');
                  $(vel_i).val('velocity');
                } else {
                 game.play_turn(vel,ang); 
                 pid = event.data.player + 1;
                 pid2 = (pid ===1) ? 2:1;
                 pid = "form[name='player"+pid+"']"; 
                 pid2 = "form[name='player"+pid2+"']"; 
                 $(pid).removeClass('active');
                 $(pid2).addClass('active');
                }
              }
            });
          }
        });
      } 
      i++;
    });
  }; //end set_player_controls 
  //var last_game_state = 0;
  var last_player_turn = 1;
  function loop() {
    requestAnimFrame(function() {
      game.animate();
      loop();
      if(game.in_play === false) {
        if(game.state.recently_updated() === false || game.player_turn !== last_player_turn) {
   //       last_game_state = game.state.get().current;
          game.state.update(game.state.get().current);
          last_player_turn = game.player_turn;
          if(game.state.get().current === '_2') {
           pid = game.player_turn + 1;
           active_player = "form[name='player"+pid+"']";
           if (game.players[pid - 1].type === 'cpu') {
             window.setTimeout(function() {
               game.players[pid - 1].ai.add_turn_history(game.players[pid -1].get_last_shot());
               turn = game.players[pid - 1].ai.get_turn();
               $(active_player).find("input[name='angle']").val(turn.ang);
               $(active_player).find("input[name='velocity']").val(turn.vel);
               window.setTimeout(function() {
                 game.players[pid - 1].set_last_shot_launch(turn.ang,turn.vel);
                 game.play_turn(turn.vel,turn.ang);
               }, 800);
             }, 1000);
           }
           $(active_player).addClass('active');
          } else if(game.state.get().current === '_1') {
            for(i = 0; i < 1; i++) {
              if(game.players[i].ai !== undefined) {
                delete game.players[i].ai.turn_history;
              }
            }
          } else if(game.state.get().current === '_4') {
            //reset
            //TODO: ask before reset, go back to name change form
            game.state.update('_0');// = 0; 
          }else {
            //place holder for "im done playing" option
          }
        }
      }//in_play
    });
  }
});

