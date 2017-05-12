var socket = io.connect(mSocketUrl);
var myId = '';
$(function(){
	
	var get=getRequest();
	var mUserId=get["userid"];
	socket.emit('join',{name:mUserId});
	var originalPrice = "";
	var getPrice = "";
	var selectedList = [];
	var seat_price = [];
	var occupied_seats = ['A21','A22','C21','H24','K24','E22','G22','H22','A23','C23','K22','A25','A26','C25','D25'];
	var not_occupied = ['D21','E21','G21','H21','K21','C22','D22','D23','E23','G23','H23','K23','A24','C24','E25','G25','H25','K25','C26','D26','E26','G26','H26','K26'];
	
	initSocket();
	
	//buttons
	//start auction
	$('#btnStart').click(function(){
		socket.emit('checkConductor',myId);
		if(!$('#btnStart').hasClass('disable')){
			originalPrice = $('#originalPrice').val();
			getPrice = $('#price').val();
			if(originalPrice != "" && getPrice !=""){
				$('#originalPrice').hide();
				$('#getOrigPrice').html(originalPrice);
				$('#getOrigPrice').show();
				$('.selSeats').find('strong').html(edtComma(getPrice));
				socket.emit('startAuction', {"originalPrice": originalPrice});
				if(getPrice!=""){
					var getPrice = $('#price').val();
					$('#prevPrice').html(edtComma(getPrice));
					if(selectedList==""){
						selectedList = not_occupied;
					}
					for(a=0; a<selectedList.length; a++){
						var jsonData =  {"seatId":selectedList[a],"seatPrice": getPrice,"status": "new"};
						var exists = false;
						for (var i = 0; i <seat_price.length; i++){
							if (seat_price[i].seatId == selectedList[a]){ 
								seat_price[i].seatPrice = getPrice; 
								seat_price[i].status = "new"; 
								exists = true;
								break;
							}
						}
						if(!exists) {
								seat_price.push(jsonData);console.log(seat_price);
						}
					}
					socket.emit('sendPrice', seat_price);
					socket.emit('sendDataPricing', {"originalPrice":originalPrice, "prevPrice": getPrice});
					
					setTimeout(function(){
						for (var i = 0; i <seat_price.length; i++){
							seat_price[i].status = "old"; 
						}
					},2000);
					
					selectedList = [];
				}
				
				$('#btnStart').addClass('disable');
			}
		}
		else{
			alert("Auction has already started.");
		}
	});
	
	//end auction
	$('#btnEnd').click(function(){
		socket.emit('checkConductor',myId);
		originalPrice = "";
		getPrice = "";
		selectedList = [];
		seat_price = [];
		occupied_seats = ['A21','A22','C21','H24','K24','E22','G22','H22','A23','C23','K22','A25','A26','C25','D25'];
		not_occupied = ['D21','E21','G21','H21','K21','C22','D22','D23','E23','G23','H23','K23','A24','C24','E25','G25','H25','K25','C26','D26','E26','G26','H26','K26'];
		$('.selSeats').find('.status').removeClass('reserve');
		$('.selSeats').find('.status').removeClass('seatNotAvail');
		$('.selSeats').find('.status').addClass('seatAvail');
		location.href = "conductor.html?userid="+mUserId;
		socket.emit('endAuction', {});
	});
	
	//reset auction
	$('#btnReset').click(function(){
		socket.emit('checkConductor',myId);
		originalPrice = "";
		getPrice = "";
		selectedList = [];
		seat_price = [];
		occupied_seats = ['A21','A22','C21','H24','K24','E22','G22','H22','A23','C23','K22','A25','A26','C25','D25'];
		not_occupied = ['D21','E21','G21','H21','K21','C22','D22','D23','E23','G23','H23','K23','A24','C24','E25','G25','H25','K25','C26','D26','E26','G26','H26','K26'];
		$('.selSeats').find('.status').removeClass('reserve');
		$('.selSeats').find('.status').removeClass('seatNotAvail');
		$('.selSeats').find('.status').addClass('seatAvail');
		socket.emit('resetAuction', {});
		location.href = "conductor.html?userid="+mUserId;
	});
	
	//unselect all
	$('#btnUnselect').click(function(){
		selectedList = [];
		$('.selSeats').find('.status').removeClass('seatSelected');
		$('.selSeats').find('.status').addClass('seatAvail');
	});
	
	//select seats to apply price change
	$('.selSeats').live('click',function(){
		socket.emit('checkConductor',myId);
		if($(this).find('.status').hasClass('seatNotAvail') || $(this).find('.status').hasClass('reserve')){
			alert("The price of this seat cannot be changed.");
		}
		else{
			var selSeatsData = $(this).attr('data-id');
			$(this).find('.status').toggleClass('seatSelected seatAvail');
			
			var found = jQuery.inArray(selSeatsData, selectedList);
			if (found >= 0) {
				selectedList.splice(found, 1);
			}else{
				selectedList.push(selSeatsData);
			}
			console.log(selectedList);
		}
	});
	
	//apply price change to selected seats
	$('#btnSendPrice').live('click',function(){
		socket.emit('checkConductor',myId);
		originalPrice = $('#originalPrice').val();
		getPrice = $('#price').val();
		if(getPrice!=""){
			var getPrice = $('#price').val();
			$('#prevPrice').html(edtComma(getPrice));
			if(selectedList==""){
				selectedList = not_occupied;
			}
			for(a=0; a<selectedList.length; a++){
				var jsonData =  {"seatId":selectedList[a],"seatPrice": getPrice,"status": "new"};
				var exists = false;
				for (var i = 0; i <seat_price.length; i++){
					if (seat_price[i].seatId == selectedList[a]){ 
						seat_price[i].seatPrice = getPrice; 
						seat_price[i].status = "new"; 
						exists = true;
						break;
					}
				}
				if(!exists) {
						seat_price.push(jsonData);console.log(seat_price);
				}
			}
			socket.emit('sendPrice', seat_price);
			socket.emit('sendDataPricing', {"originalPrice":originalPrice, "prevPrice": getPrice});
			
			setTimeout(function(){
				for (var i = 0; i <seat_price.length; i++){
					seat_price[i].status = "old"; 
				}
			},2000);
			
			selectedList = [];
		}
		else{
			alert("Please enter original price.");
		}
	});
	
	//receive  change of price
	socket.on('receive_price', function(data){
		for(a=0; a<data.length; a++){
			$('.selSeats').filter('[data-id='+data[a].seatId+']').find('strong').html(edtComma(data[a].seatPrice));
			$('.selSeats').filter('[data-id='+data[a].seatId+']').find('.status').removeClass('seatSelected');
			if(!$('.selSeats').filter('[data-id='+data[a].seatId+']').find('.status').hasClass('seatNotAvail')){
				$('.selSeats').filter('[data-id='+data[a].seatId+']').find('.status').addClass('seatAvail');
			}
			if(data[a].status=="new"){
				$('.selSeats').filter('[data-id='+data[a].seatId+']').find('strong').addClass('priceChange');
			}
		}
		setTimeout(function(){
			$('.selSeats').find('strong').removeClass('priceChange');
		},3000);
	});
	
	//get reserve seats number====
	socket.on('sendReserveNum', function(data){
		if(data.rNum!=0){
			$('.selSeats').filter('[data-id='+data.seat+']').find('span').html(data.rNum);
			if(!$('.selSeats').filter('[data-id='+data.seat+']').find('.status').hasClass('reserve')){
				$('.selSeats').filter('[data-id='+data.seat+']').find('.status').addClass('reserve');
			}
			$('.selSeats').filter('[data-id='+data.seat+']').find('.status').removeClass('seatSelected');
			$('.selSeats').filter('[data-id='+data.seat+']').find('.status').addClass('seatAvail');
			var found = jQuery.inArray(data.seat, not_occupied);
			if (found >= 0) {
				not_occupied.splice(found,1);
			}
			
			var found_selectedSeats = jQuery.inArray(data.seat, selectedList);
			if(found_selectedSeats >= 0){
				selectedList.splice(found_selectedSeats,1);
				console.log(selectedList);
			}
		}
		else{
			$('.selSeats').filter('[data-id='+data.seat+']').find('span').html("");
			$('.selSeats').filter('[data-id='+data.seat+']').find('.status').removeClass('reserve');
			not_occupied.push(data.seat);
		}
	});	
	
	//update confirmed seats
	var seat = [];
	socket.on('updateConfirmSeats',function(data){
		var exist = 0;
		var getSeats = data.confirmSeats;
		for(var i in getSeats){
			console.log("getseats",getSeats[i]);
			if(seat.indexOf(getSeats[i])!=-1){
				exist=1;
				var seatAffected = seat.indexOf(getSeats[i]);
				delete seat[seatAffected];
			}
		}
			
		if(exist==0){
			for(i = 0; i < data.confirmSeats.length; i++){
				seat.push(data.confirmSeats[i]);
				console.log("seats",seat);
				if(data.name==mUserId){
					//alert('Confirmed');
					selectedSeats = [];
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatSuccess');
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatAvail');
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('span').html("");
				}
				else if(mUserId=="aucmint9669"){
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('span').html("");
					
				}
				else{
					var idx = selectedSeats.indexOf(data.confirmSeats[i]);
					occupied_seats.push(selectedSeats[idx]);
					if(idx!=-1){
						selectedSeats.splice(idx,1);
					}
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('span').html("");
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('strong').remove();
				}
			}			
		}
	});
	
	//retrieve datas on refresh or for late user==========================
	//check if auction starts===	
	socket.emit('chk_auction', {});
	socket.on('auctionStatus', function(data){
		if(data){
			$('#btnStart').addClass('disable');
		}
	});
	//==========================
	//retrieve saved price
	socket.on('sendSavePrice', function(data){
		for(i = 0; i < data.length; i++){
			$('.selSeats').filter('[data-id='+data[i].seatId+']').find('strong').html(edtComma(data[i].seatPrice));
		}
	});
	
	//retrieve previous and init price
	socket.on('sendPricing', function(data){
		$('#prevPrice').html(edtComma(data.prevPrice));
		if(data.origPrice != ""){
			originalPrice = data.origPrice;
			$('#originalPrice').hide();
			$('#getOrigPrice').html(data.origPrice);
			$('#getOrigPrice').show();
		}
	});
	
	//retrieve reserved seats=====
	var reservedSeat = {};
	var selectedSeats = [];
	var confirmSeats = [];
	socket.on('sendSaveData', function(data){
		console.log(data.length);
		for(i = 0; i < data.length; i++){console.log(reservedSeat[data[i].rSeat]);
			if(reservedSeat[data[i].rSeat]===undefined) {
				reservedSeat[data[i].rSeat] = 1;
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('span').html(reservedSeat[data[i].rSeat]);
				if(!$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').hasClass('reserve')){
					$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').addClass('reserve');
				}
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').removeClass('seatSelected');
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').addClass('seatAvail');
				var found = jQuery.inArray(data[i].rSeat, not_occupied);
				if (found >= 0) {
					not_occupied.splice(found,1);
				}
				
				var found_selectedSeats = jQuery.inArray(data[i].rSeat, selectedList);
				if(found_selectedSeats >= 0){
					selectedList.splice(found_selectedSeats,1);
				}
				console.log("hey");
			}
			else {
				reservedSeat[data[i].rSeat] += 1;
				console.log("oi");
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('span').html(reservedSeat[data[i].rSeat]);
				$('.selSeats').filter('[data-id='+data[i].seat+']').find('.status').removeClass('reserve');
				not_occupied.push(data.seat);
			}
		} 
	});
	
	//retrieve confirmed seats=====
	socket.on('retrieveOccupiedSeats', function(data){
		console.log(data);
		for(i = 0; i < data.length; i++){
			for(a=0; a<data[i].selectedSeats.length; a++){
				if(data[i].name==mUserId){
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatSuccess');
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
				}
				else if(mUserId=="aucmint9669"){
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
				}
				else{
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('strong').remove();
				}
			}
		}
	});
	
	//end retrieve =======================================================	
	
	socket.on('error', function (data) {
		console.log('error', data)
		if (data.code == 1 ) {
			location.href = 'login.html?error=1';
		} else if(data.code == 2) {
			location.href = 'login.html?error=2';
		}else if(data.code==3){
			location.href = 'login.html?error=3';
			
		}
	});
});

function initSocket () {
	//retrieve users
	socket.emit('retrieveusers', {});
	
	//gets player data
	socket.on('playerData', function (data) {
		playerData = data;
		updatePlayers();
	});
}

function updatePlayers() { 
	var html = '';
	var playerCount = 0;
	$.each(playerData, function (i, val) {
		if(val.name!="aucmint9669"){
			html += '<li>';
			html += ''+ val.name +'';
			html += '</li>';
			playerCount++;
		}
		else{
			myId = val.socketId;
		}
	});
	$("#playerList").html(html);		
	
	//players number
	$("#playerNumber").html(playerCount);
}