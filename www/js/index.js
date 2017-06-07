var app = function() {

    var self = {};
    self.is_configured = false;

    var server_url = "https://luca-ucsc-teaching-backend.appspot.com/keystore/";
    var call_interval = 2000;

    Vue.config.silent = false; // show all warnings

    // Extends an array
    self.extend = function(a, b) {
        for (var i = 0; i < b.length; i++) {
            a.push(b[i]);
        }
    };

    self.my_identity = randomString(20);
    self.null_board = [" ", " ", " ", " ", " ", " ", " ", " ", " "];

    //set board of 8x8/length=64 to null &fn
    self.null_board = function(length) {
        if (length === undefined) { length = 64} //error handling incase length =null
        var squaresArray = Array(length);
        for (var i = 0; i < length; i++) {  squaresArray[i] = ""; } //val= null
        return squaresArray; //return the whole board back
    };

    // Enumerates an array.
    var enumerate = function(v) {
        var k=0;
        v.map(function(e) {e._idx = k++;});
    };

    // Initializes an attribute of an array of objects.
    var set_array_attribute = function (v, attr, x) { v.map(function (e) {e[attr] = x;}); };
    
    //initliazes the app, listens to see if device is ready...
    self.initialize = function () { document.addEventListener('deviceready', self.ondeviceready, false); };

    //if the device is ready after intialization, show the div containing all the shit
    self.ondeviceready = function () {
        console.log("The device is ready");
        $("#vue-div").show();
        self.is_configured = true;
    };

    // This is the object that contains the information coming from the server.
    self.player_x = null;
    self.player_o = null;

    // This is the main control loop.
    function call_server() {
        console.log("Yo server what's good? | call_server()");
        if (self.vue.chosen_magic_word === null) { 
            console.log("No Magic Word");
            setTimeout(call_server, call_interval);
        } else {
            //removed random delay to avoid synchronizations cause fuck that. &edit&
            //var extra_delay = Math.floor(Math.random() * 1000);
             console.log("Yo server what's good? | call_server()");
            $.ajax({ //server call via ajax
                dataType: 'json',
                url: server_url +'read',
                //added BRAINBLAST to key so I don't run into your games.
                data: {key:  "BRAINBLAST"+ self.vue.chosen_magic_word},
                success: self.process_server_data,
                complete: setTimeout(call_server, call_interval) // rm extra delay
            });
        }
    }

    //Main function for sending the state.
    //was set for tic-tac-toe only player_x, player_o, newBoard.. &edit&.
    //made changes to val so it can parse properly per the hw6 explanation.              
    self.send_state = function () {
        $.post(server_url + 'store',{
            //added BRAINBLAST to key so I don't run into your games.
            key: "BRAINBLAST" + self.vue.chosen_magic_word, 
            val: JSON.stringify({
                'player_1': self.player_1,
                'player_2': self.player_2,
                'board_1': self.vue.board_1,
                'board_2': self.vue.board_2,
                'turn_count': self.vue.turn_count,
                'game_count': self.vue.game_count
            })
        });
    };           


    // Main place where we receive data and act on it. &edits&
    self.process_server_data = function (data) {
        //?data=null from server
        if (!data.result) {
            self.player_1 = self.my_identity;
            self.player_2 = null;
            self.vue.board_1 = getBoard();
            self.vue.board_2 = self.null_board();
            self.vue.turn_count = 0;
            self.vue.game_count = 0;
            self.send_state();
        } else { //data!
            var answer = JSON.parse(data.result); //parse the answer JSON if data!
            if (answer.player_2 === null) {
                if (answer.player_1 === self.my_identity) { //if answer looped back, wait.
                    self.vue.status_line = "waiting...2nd player is pooping";
                    return;
                }
                else if (answer.player_1 === null) { 
                    self.vue.status_line = "2nd player had to go pick up the kids. Waiting for second player.";
                    self.player_1 = self.my_identity;
                    self.player_2 = null;
                    self.vue.board_1 = getBoard();
                    self.vue.board_2 = self.null_board();
                    self.vue.turn_count = 0;
                    self.vue.game_count = 0;
                    self.vue.is_my_turn = false;
                    self.send_state();
                }
                else {
                    self.vue.status_line = "Oh shiet, Game's starting!!! ";

                    // Set data and send state
                    self.player_1 = answer.player_1;
                    self.player_2 = self.my_identity;
                    self.vue.board_1 = answer.board_1;
                    self.vue.board_2 = getBoard();
                    self.vue.turn_count = answer.turn_count;
                    self.vue.game_count = answer.game_count;
                    self.send_state();
                    // Make it our turn
                    self.vue.is_my_turn = true;
                }
            }
            else { // both not null
                // check if both players are already in
                if (self.player_1 !== self.my_identity && self.player_2 !== self.my_identity) {
                    self.vue.status_line = "Cannot join this game, two players already present.";
                    self.vue.need_new_magic_word = true;
                }
                else { // Potentially new turn data
                    self.vue.status_line = "Both Players crackin a cold one and transferring data.";
                    if (answer.turn_count >= self.vue.turn_count && answer.game_count === self.vue.game_count) {
                        // Swap turns
                        if (answer.turn_count > self.vue.turn_count) {
                            self.vue.is_my_turn = !self.vue.is_my_turn;
                        }
                        self.vue.turn_count = answer.turn_count;
                        self.vue.board_1 = answer.board_1;
                        self.vue.board_2 = answer.board_2;
                        self.player_1 = answer.player_1;
                        self.player_2 = answer.player_2;

                        if (self.board_is_won(self.own_board())) {
                            self.vue.win_line = "You lost at the Brain Ship :(";
                        }

                    }
                    else if (answer.game_count > self.vue.game_count) {
                        self.vue.status_line = "Starting a new game of Brain Ship ";
                        self.vue.win_line = "";
                        if (self.player_1 === self.my_identity) {
                            self.vue.board_2 = answer.board_2;
                            self.vue.board_1 = getBoard();
                        }
                        else {
                            self.vue.board_1 = answer.board_1;
                            self.vue.board_2 = getBoard();
                        }
                        self.vue.turn_count = answer.turn_count;
                        self.vue.game_count = answer.game_count;
                        self.send_state();
                        // Make it our turn
                        self.vue.is_my_turn = true;
                    }
                }//end of else (potential new data)
            }//end of else (both not null)
            }//end of else (data!)
    };

    self.update_local_vars = function (server_answer) {
        // First, figures out our role.
        if (server_answer.player_o === self.my_identity) {  self.vue.my_role = 'o';  } 
        else if (server_answer.player_x === self.my_identity) { self.vue.my_role = 'x';  }
        else {  self.vue.my_role = ' ';  }

        // Reconciles the board, and computes whose turn it is.
        // rm  var device_has_newer_state = false;
        // rm  else if statement for device_has_newer_state = true;

        for (var i = 0; i < 9; i++) {
            if (self.vue.board[i] === ' ' || server_answer.board[i] !== ' ') {
                // The server has new information for this board.
                Vue.set(self.vue.board, i, server_answer.board[i]);
            } else if (self.vue.board[i] !== server_answer.board[i]
                && self.vue.board[i] !== ' ' && server_answer.board[i] !== ' ')  {
                console.log("Board inconsistency at: " + i);
                console.log("Local:" + self.vue.board[i]);
                console.log("Server:" + server_answer.board[i]);
            }
        }

        // Compute whether it's my turn on the basis of the now reconciled board.
        self.vue.is_my_turn = (self.vue.board !== null) && (self.vue.my_role === whose_turn(self.vue.board));
    };

    //no changes
    function whose_turn(board) {
        num_x = 0;
        num_o = 0;
        for (var i = 0; i < 9; i++) {
            if (board[i] === 'x') num_x += 1;
            if (board[i] === 'o') num_o += 1;
        }
        if (num_o >= num_x) {   return 'x'; } 
        else {  return 'o'; }
    }

    self.set_magic_word = function () {
        //check to see if magic words are equal   &edit&
        if (self.vue.chosen_magic_word === self.vue.magic_word) { return; }
        // reset board if active
        if (self.vue.chosen_magic_word !== null     //if chosen word is not null &edit&
            && self.player_1 !== self.my_identity   //and idenity is not yourself
            && self.player_2 !== self.my_identity){ //and not the other player
                self.player_1 = null;
                self.player_2 = null;
                self.vue.board_1 = null;
                self.vue.board_2 = null;
                self.vue.turn_count = null;
                self.vue.game_count = null;
                self.vue.need_new_magic_word = false;
                self.send_state();
        }
        self.vue.chosen_magic_word = self.vue.magic_word;
        self.vue.need_new_magic_word = false;
        // Reset
        self.vue.board_1 = self.null_board();
        self.vue.board_2 = self.null_board();
        self.vue.is_my_turn = false;
        self.vue.my_role = "";
    };

    //play function with multiple edits from OG due to different game logic.
    self.play = function (i, j) {
        var opponent_board = self.opponent_board(); //set opponent board
        if (self.vue.is_my_turn && opponent_board[8*i+j] !== 'h' && opponent_board[8*i+j] !== 'w') {
            if (typeof(opponent_board[8*i+j]) === "number") { //IT'S A HITT!!!!!!?(fire emoji)
                var shipid = opponent_board[8*i+j];
                var shipcount = 0;
                for (var index = 0; index < opponent_board.length; index++) {
                    if (opponent_board[index] === shipid) { shipcount++; }
                }
                opponent_board[8*i+j] = 'h'; //set their board at that i,j position to 'h'
                if (shipcount <= 1) {   self.reveal_water(opponent_board, i, j);  } //?final hit of ship: reveal
            }
            //YOU MISSED..(sad tears emoji)
            else if (opponent_board[8*i+j] === '') { opponent_board[8*i+j] = 'w';}  //set their baord at i,j position to 'w'
            self.vue.is_my_turn = false; //switch turns
            self.vue.turn_count++; //add turn count

            // Check for win
            if (self.board_is_won(opponent_board)) { self.vue.win_line = "You won!"; }
            self.send_state();
        }
    };

    //fn reveals the ship in the water upon hits &fn&
    self.reveal_water = function(board, x, y) {
        var dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];//array sets of direction ranges
        var dir; //direction variablefor reference if it's hit.
        for (var i = 0; i < dirs.length; i++) {
            if (board[8*(x+dirs[i].x)+(y+dirs[i].y)] === 'h') {
                dir = dirs[i];
                break;
            }
        }
        //direction not adjacent? (small ships)
        if (dir === undefined) {
            for (var j = 0; j < dirs.length; j++) { //check all direction ranges
                var offset = self.vadd(x, y, dirs[j].x, dirs[j].y);
                if (board[self.vflat(offset)] === '') {
                    self.set_in_board(board, offset.x, offset.y, 'w'); 
                }
            }
            return;
        }
        //checking for hit in range of "positive" direction 
        for (var i = 0; self.vflat(self.vadd(x, y, i*dir.x, i*dir.y)) >= 0 
            && self.vflat(self.vadd(x, y, i*dir.x, i*dir.y)) < 64; i++) {
                var center = self.vadd(x, y, i*dir.x, i*dir.y);
                if (board[self.vflat(center)] !== 'h') { break; }
                for (var j = 0; j < dirs.length; j++) {
                    var offset = self.vadd(center.x, center.y, dirs[j].x, dirs[j].y);
                    if (board[self.vflat(offset)] === '') {
                     self.set_in_board(board, offset.x, offset.y, 'w');
                    }
                }
        }
         //checking for hit in range of range in "negative" direction 
        for (var i = 0; self.vflat(self.vadd(x, y, -1*i*dir.x, -1*i*dir.y)) >= 0 
            && self.vflat(self.vadd(x, y, -1*i*dir.x, -1*i*dir.y)) < 64; i++) {
                var center = self.vadd(x, y, -1*i*dir.x, -1*i*dir.y);
                if (board[self.vflat(center)] !== 'h') {
                    break;
                }
                for (var j = 0; j < dirs.length; j++) {
                    var offset = self.vadd(center.x, center.y, dirs[j].x, dirs[j].y);
                    if (board[self.vflat(offset)] === '') {
                        self.set_in_board(board, offset.x, offset.y, 'w');
                    }
                }
        }
    };






    //fn to set the board &fn&
    self.set_in_board = function(board, x, y, val) {
        if (x < 8 && x >= 0 && y < 8 && y >= 0) {
            board.splice(8*x+y, 1, val);
        }
    };
    //fn helper methods for calculating reveal_water fn &fn&
    self.vadd = function(x1, y1, x2, y2) { return {x: (x1+x2), y: (y1+y2)}; } //adjacent 
    self.vflat = function(x1, y1) { //no adjacency
        if (typeof(x1) === "object") { return 8*x1.x+x1.y;}
        return 8*x1+y1;
    }

    //fn determines the your board based on the identity returned. &fn&
    self.own_board = function() {
        if (self.vue === undefined) { return []; }
        if (self.player_1 === self.my_identity) { return self.vue.board_1; }
        else { return self.vue.board_2; }
    };

    //fn determines the opponenent board based on the identity returned. &fn&
    self.opponent_board = function() {
        if (self.vue === undefined) { return []; }
        if (self.player_1 === self.my_identity) { return self.vue.board_2; }
        else { return self.vue.board_1; }
    };

    //fn determines if all the ships are sunk to get a winner &fn&
    self.board_is_won = function(board) {
        for (i = 0; i < board.length; i++) { //for all the squares on the board
            if (typeof(board[i]) === "number") { //check it it's a number type instead of empty
                return false;
            }
        }
        return true; // no numbers means all ships sunk -> won
    }

    //function to make a new game &fn*
    self.new_game = function() {
        if (self.vue.win_line === "") { return; } // checks to see if game is won yet.
        else {
            self.vue.status_line = "New Game of Brain Ship starting...";
            self.vue.win_line = ""; //resets condition to see if game is won

            if (self.player_1 === self.my_identity) {   //if you're player 1,
                self.vue.board_1 = getBoard();          //get your board set up with stuff
                self.vue.board_2 = self.null_board();   //set the other board to null(2nd player)
            }
            else {                                      //if you're not,
                self.vue.board_2 = getBoard();          // get the 2nd board set up with stuff
                self.vue.board_1 = self.null_board();   // set the other board to null(1st player)
            }
            self.vue.turn_count = 0;    //reset turn count for game.
            self.vue.game_count++;      //increment game count
            self.vue.is_my_turn = false;//transfer turn to other player
            self.send_state();
        }
    };

    self.vue = new Vue({
        el: "#vue-div",
        delimiters: ['${', '}'],
        unsafeDelimiters: ['!{', '}'],
        data: {
            magic_word: "",
            chosen_magic_word: null,
            need_new_magic_word: false,
            my_role: "",
            board_1: self.null_board(), // board_1 "ref" &edit&
            board_2: self.null_board(), // board_1 "ref" &edit&
            is_other_present: false,
            is_my_turn: false,          
            status_line: "No players here",
            win_line: "",
            turn_count: 0,
            game_count: 0
        },
        methods: {
            set_magic_word: self.set_magic_word,
            play: self.play,
            new_game: self.new_game,
            own_board: self.own_board,
            opponent_board: self.opponent_board
        }
    });

    call_server();
    return self;
};
 
var APP = null;
// This will make everything accessible from the js console;
jQuery(function(){
    APP = app();
    APP.initialize();
});
