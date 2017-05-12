var socket = io.connect(mSocketUrl);

$(function(){
	var priceList = '';
	var occupied_seats = ['A21','A22','C21','H24','K24','E22','G22','H22','A23','C23','K22','A25','A26','C25','D25'];
	var origPrice = "";
	// get and register player id======
	var get=getRequest();
	mUserId=get["userid"];
	socket.emit('join',{name:mUserId});
	
	//==================================
	//check if auction starts===	
	socket.emit('chk_auction', {});
	socket.on('auctionStatus', function(data){
		if(!data){
			location.href = "start.html?userid="+mUserId;	
		}
	});
	
	//retrieve datas on refresh or for late user ================================
	//=========================
	//retrieve previous and init price
	socket.on('sendPricing', function(data){
		origPrice = data.origPrice;
		$('#origPrice').html(edtComma(origPrice));
		console.log(origPrice);
	});
	//retrieve saved price
	socket.on('sendSavePrice', function(data){
		priceList = data;
		for(i = 0; i < data.length; i++){
			$('.selSeats').filter('[data-id='+data[i].seatId+']').find('strong').html(edtComma(data[i].seatPrice));
		}
	});
	//==============================
	//retrieve reserved seats=====
	var reservedSeat = {};
	var selectedSeats = [];
	var confirmSeats = [];
	socket.on('sendSaveData', function(data){
		for(i = 0; i < data.length; i++){
			if(data[i].name==mUserId && $.inArray(data[i].rSeat, selectedSeats)==-1){
			   selectedSeats.push(data[i].rSeat);
			   console.log(selectedSeats);
			   $('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').removeClass('seatAvail');
			   $('.selSeats').filter('[data-id='+data[i].rSeat+']').find('.status').addClass('seatSelected');
			   for(a=0; a<priceList.length; a++){ 
				   if(data[i].rSeat==priceList[a].seatId){
					   console.log(priceList[a].seatPrice,origPrice);
					   var rpOff = parseInt(origPrice-priceList[a].seatPrice)/parseInt(origPrice)*100;
						$('.sSList').append('<li data-id="'+data[i].rSeat+'">'+
							'<div class="sSLSeatNum">'+data[i].rSeat+'</div>'+
							'<div class="sSLSeatPri">'+edtComma(priceList[a].seatPrice)+'</div>'+
							'<div class="sSLSeatDis">'+rpOff.toFixed(2)+'%</div>'+
						'</li>');
				   }
			   }
			}
			
			if(reservedSeat[data[i].rSeat]===undefined) {
				reservedSeat[data[i].rSeat] = 1;
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('span').html(reservedSeat[data[i].rSeat]);
			}
			else {
				reservedSeat[data[i].rSeat] += 1;
				$('.selSeats').filter('[data-id='+data[i].rSeat+']').find('span').html(reservedSeat[data[i].rSeat]);
			}
		} 
	});
	//===========================
	//retrieve confirm seats=====
	socket.on('retrieveOccupiedSeats', function(data){
		console.log(data);
		for(i = 0; i < data.length; i++){
			for(a=0; a<data[i].selectedSeats.length; a++){
				if(data[i].name==mUserId){
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatSuccess');
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
				   $('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
				   $('.sSList li').filter('[data-id="'+data[i].selectedSeats[a]+'"]').remove();
				}
				else if(mUserId=="admin"){
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
				}
				else{
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').addClass('seatTaken');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('span').html("");
					$('.selSeats').filter('[data-id='+data[i].selectedSeats[a]+']').find('strong').remove();
				}
			}
		}
	});
	//==========================
	//end retrieve ============================================================
	
	//receive price
	socket.on('receive_price', function(data){
		priceList = data;
		for(a=0; a<data.length; a++){
			$('.selSeats').filter('[data-id='+data[a].seatId+']').find('strong').html(edtComma(data[a].seatPrice));
			
			
			$('.sSList li').filter('[data-id='+data[a].seatId+']').find('.sSLSeatPri').html(edtComma(data[a].seatPrice));
			if(data[a].status=="new"){
				$('.selSeats').filter('[data-id='+data[a].seatId+']').find('strong').addClass('priceChange');
			}
			setTimeout(function(){
				$('.selSeats').find('strong').removeClass('priceChange');
			},3000);
		}
	});
	
	//select seats to confirm
	var selectedSeats = [];
	$('.selSeats').live('click', function(){
		if(!$(this).find('.status').hasClass('seatNotAvail') && !$(this).find('.status').hasClass('seatSuccess')){
			var selSeatsData = $(this).attr('data-id');
			var getPrice = $(this).find('strong').html();
			var pOff = parseInt(origPrice-(getPrice.replace(/,/g,'')))/parseInt(origPrice)*100;
			console.log(origPrice,(getPrice.replace(/,/g,'')));
			$(this).find('.status').toggleClass('seatSelected seatAvail');
			var found = jQuery.inArray(selSeatsData, selectedSeats);
			if (found >= 0) {
				selectedSeats.splice(found, 1);
				$('.sSList li').filter('[data-id="'+selSeatsData+'"]').remove();
				socket.emit('cancelSeat', {"name":mUserId, "rSeat": selSeatsData,"selectedSeats":selectedSeats,"price":getPrice});
				
			} else {
				$('.sSList').append('<li data-id="'+selSeatsData+'">'+
										'<div class="sSLSeatNum">'+selSeatsData+'</div>'+
										'<div class="sSLSeatPri">'+getPrice+'</div>'+
										'<div class="sSLSeatDis">'+pOff.toFixed(2)+'%</div>'+
									'</li>');
				selectedSeats.push(selSeatsData);
				socket.emit('reserveSeat', {"name":mUserId, "rSeat": selSeatsData,"selectedSeats":selectedSeats,"price":getPrice});
			}
		}
	});
	//==================================
	
	//get reserve seats number====
	socket.on('sendReserveNum', function(data){
		if(data.rNum!=0){
			$('.selSeats').filter('[data-id='+data.seat+']').find('span').html(data.rNum);
		}
		else{
			$('.selSeats').filter('[data-id='+data.seat+']').find('span').html("");
		}
	});
	//==========================
	
	//click confirm selected seats
	$('#btnConfirm').click(function(){
		var d = new Date();
		var n = d.getMilliseconds();
		var occ=0;
		var ctr = 0;
		var _selectedSeats = selectedSeats;
		for (var i in _selectedSeats){
			if(occupied_seats.indexOf(_selectedSeats[i]) != -1){
				occ = 1;
				var idx = selectedSeats.indexOf(_selectedSeats[i])
				delete  selectedSeats[idx];
			}
			ctr++;
		}
		if(occ==1){
			$('#alertPopup').show();
		}
		else{
			socket.emit('confirmSeats', {"name": mUserId, "selectedSeats": selectedSeats, "timing":n});
			
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
				   $('.sSList').html("");
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatSuccess');
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatAvail');
				   $('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('span').html("");
				}
				else if(mUserId=="admin"){
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
						$('#alertPopup').show();
					}
					console.log("a");
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatNotAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').addClass('seatTaken');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatAvail');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('.status').removeClass('seatSelected');
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('span').html("");
					$('.selSeats').filter('[data-id='+data.confirmSeats[i]+']').find('strong').remove();
					$('.sSList li').filter('[data-id='+data.confirmSeats[i]+']').remove();
				}
			}			
		}
	});
	
	//confirm alert============
	$('#confirmAlert').click(function(){
		$('#alertPopup').hide();
	});
	//========================
	
	//reset game=========
	socket.on('resetGame', function(){
		selectedSeats = [];
		console.log("Reset Game");
		location.href = "start.html?userid="+mUserId;
	});
	
	socket.on('endGame', function(){
		selectedSeats = [];
		console.log("End Game");
		location.href = "start.html?userid="+mUserId;
	});
	
});