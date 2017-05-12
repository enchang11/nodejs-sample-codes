var express    = require('express');
var app        = express.createServer();
var io         = require('socket.io').listen(app);

app.configure(function(){
	app.use(express.static(__dirname + "/public"));
});

app.listen(3260);

//remove error log
io.set('log level', 1);

//variables
var playerData 	= {};
var auctionStart = false;
var saveData = [];
var selectedSeats = [];
var prices = "";
var origPrice = "";
var prevPrice = "";
var occupied_seats = [];

var activeId =  '';
//==============================

io.sockets.on('connection', function (socket) {
	
	//retrieve user
	socket.on('retrieveusers', function (data) {
		console.log('retrieveusers');
		retrieve();
		io.sockets.emit('playerData', playerData);
	});
	
	//new user join
	socket.on('join', function (data) {
		if (!data.name) {		
			return;
		}
		console.log('join', data);
		//retrieve();
		for (var i in playerData) {
			if (playerData[i].name == data.name) {
				socket.emit('error', {"code": 2}); // user already exists
				console.log("User already exists.");
				return;
			}
		}
		retrieve();
		
		if(data.name=="aucmint9669"){
			activeId = socket.id;
			console.log(activeId);
		}
		
		playerData[socket.id] = {"name": data.name, "socketId": socket.id};		
		io.sockets.emit('playerData', playerData);
	});
	
	//disconnected user
	socket.on('disconnect', function () {
		delete playerData[socket.id];
		io.sockets.emit('playerData', playerData);
	});
	
	//==========================
	//check auction
	//==========================
	socket.on('chk_auction', function(){
		io.sockets.emit('auctionStatus',auctionStart);
	});
	
	
	//start auction
	socket.on('startAuction', function(data){
		auctionStart = true;
		origPrice= data.originalPrice;
		io.sockets.emit('start', data);
	});
	
	//end auction
	socket.on('endAuction',function(){
		auctionStart = false;
		saveData = [];
		selectedSeats = [];
		prices = "";
		origPrice = "";
		prevPrice = "";
		occupied_seats = [];
		io.sockets.emit('endGame',{});
	});
	
	//reset auction
	socket.on('resetAuction', function(){
		auctionStart = false;
		saveData = [];
		selectedSeats = [];
		prices = "";
		origPrice = "";
		prevPrice = "";
		occupied_seats = [];
		io.sockets.emit('resetGame',{});
	});
	
	//send price
	socket.on('sendDataPricing', function(data){
		origPrice = data.originalPrice;
		prevPrice = data.prevPrice;
	});
	socket.on('sendPrice', function(data){
		prices= data;
		io.sockets.emit('receive_price', data);
	});
	
	
	//========================
	//reserve seat
	//========================
	socket.on('reserveSeat', function(data){
		saveData.push(data);
		
		var countreserved = 0;
		for( i = 0; i < saveData.length; i++) {  
			if(saveData[i].rSeat == data.rSeat) {
				countreserved++;
			}  
		}
		if(selectedSeats.indexOf(data.rSeat)==-1){
		  selectedSeats.push(data.rSeat);
		 }
		io.sockets.emit('sendReserveNum', {"seat": data.rSeat, "rNum": countreserved, "price": data.price});

	});
	
	//========================
	//cancel seat
	//========================
	socket.on('cancelSeat', function(data){
		for( i = 0; i < saveData.length; i++) {
			if (saveData[i].name == data.name && saveData[i].rSeat == data.rSeat) {
				saveData.splice(i, 1);
			}
		}
		
		var countreserved = 0;
		for( i = 0; i < saveData.length; i++) {  
			if(saveData[i].rSeat == data.rSeat) {
				countreserved++;
			}  
		}
		if(countreserved==0){
		  var idx = selectedSeats.indexOf(data.rSeat);
		  selectedSeats.splice(idx, 1);
		 }
		io.sockets.emit('sendReserveNum', {"seat": data.rSeat, "rNum": countreserved, "price": data.price});
	});
	
	//=============================
	// confirm seats
	//=============================
	socket.on('confirmSeats', function(data){
		occupied_seats.push(data);
		io.sockets.emit("updateConfirmSeats", {"name":data.name , "confirmSeats":data.selectedSeats});
	});
	
	function retrieve(){
		console.log(saveData);
		socket.emit('sendPricing',{"origPrice": origPrice, "prevPrice": prevPrice});
		socket.emit('sendSavePrice',prices);
		socket.emit('sendSaveData',saveData);
		socket.emit('retrieveOccupiedSeats', occupied_seats);
	}
	
	socket.on('checkConductor', function(data){
		if(data!=activeId){
			socket.emit('error', {"code": 2});
		}
	});
});