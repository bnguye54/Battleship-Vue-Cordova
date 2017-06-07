//shohbit's helper code
var EMPTY = '';
function isvalid(board, x, y, orientation, ship_size, board_size){
	if(orientation){
		if(x+ship_size >= board_size) return false;
		for(var i = x; i < x+ship_size; i++){
			if(board[i][y] != EMPTY || 
				(y-1 >= 0 && board[i][y-1] != EMPTY) || // to ensure that ships do not "touch each other"
				(y+1 < board_size && board[i][y+1] != EMPTY)) 
					return false;
		}
		if((x - 1 >= 0 && board[x-1][y] != EMPTY) || 
			(x + ship_size < board_size && board[x+ship_size][y] != EMPTY)) return false;
	} else {
		if(y+ship_size >= board_size) return false;
		for(var i = y; i < y+ship_size; i++){
			if(board[x][i] != EMPTY || 
				(x-1 >= 0 && board[x-1][i] != EMPTY) || // to ensure that ships do not "touch each other"
				(x+1 < board_size && board[x+1][i] != EMPTY)) 
					return false;
		}
		if((y-1 >= 0 && board[x][y-1] != EMPTY) || 
			(y+ship_size < board_size && board[x][y+ship_size] != EMPTY)) return false;
	}
	return true;
}

function print(board){
	var size = Math.sqrt(board.length);
	for(var i = 0; i < size; i++){
		var s = "";
		for(var j = 0; j < size; j++){
			s += board[i*size + j];
		}
		console.log(s);
	}
}

//creates a ship in board with shipid
function setShip(board, orientation, x, y, ship_size, shipid){
	if(orientation){
		for(var i = x; i < x+ship_size; i++){
			board[i][y] = shipid;
		}
	}else{
		for(var i = y; i < y+ship_size; i++){
			board[x][i] = shipid;
		}
	}
}

//get random integers in range [Min, Max]
function get_random(Min, Max){
	return Math.floor(Math.random() * (Max - Min +1)) + Min;
}

//create a ship
function createShip(board, board_size, ship_size, shipid){
	var counter=0;
	while(counter < 200){
		counter++;
		var orientation = get_random(0, 1);//0 -> horizontal, 1-> vertical
		var x=0;
		var y=0;
		if(orientation){
			x = get_random(0, board_size-ship_size-1);
			y = get_random(0, board_size-1);
		}else{
			x = get_random(0, board_size-1);
			y = get_random(0, board_size-ship_size-1);
		}
		if(!isvalid(board, x, y, orientation, ship_size, board_size)) continue; //check if it conflicts
		setShip(board, orientation, x, y, ship_size, shipid);
		break;
	}
}

//create all ships
function createShips(board, board_size){
	var ships = [[1,3], [3,1], [2,2]]; // first element of every pair is number of ships, second element is length of ship
	var shipid = 1;
	for(var i = 0; i < ships.length; i++){
		for(var count = 0; count < ships[i][0]; count++){
			createShip(board, board_size, ships[i][1], shipid);
			shipid++;
		}
	}
}

//flatten 2d vector to 1d vector
function flatten(board){
	var size = board.length;
	var board2 = new Array(size*size);
	for(var i = 0; i < size; i++){
		for(var j = 0; j < size; j++)
			board2[i*size + j] = board[i][j];
	}
	return board2;
}

// get 8x8 board flattened
function getBoard(){
	var size = 8;
	var board = new Array(size);
	for (var i = 0; i < size; i++) {
		board[i] = new Array(size);
		for (var j = 0; j < size; j++)
			board[i][j] = EMPTY;
	}
	createShips(board, size);
	board = flatten(board);
	return board;
}