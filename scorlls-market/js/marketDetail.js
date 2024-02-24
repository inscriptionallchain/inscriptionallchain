
getETHPrice(function(){
	loadData(function(){
		var queryString = window.location.search;
		tokenId = getParameterByName('item', queryString);
		console.log("tokenId",tokenId);
		init()
	});
});

var tokenId;
var tokenName;
var tokenBalance;
var tokenIndex;

function init(){
	$("#activityTable").html(`<tr>
		<th>No.</th>
		<th>Event</th>
		<th>Tick</th>
		<th>Price</th>
		<th>Amount</th>
		<th>Total</th>
		<th>From</th>
		<th>Time</th>
	  </tr>`);
	$("#orderTable").html(`<tr>
		<th>No.</th>
		<th>Event</th>
		<th>Tick</th>
		<th>Price</th>
		<th>Amount</th>
		<th>Total</th>
		<th>From</th>
		<th>To</th>
		<th>Time</th>
		<th>Action</th>
	  </tr>`);
	contractMarket.methods.saleRate().call({from:account},function(error,result){
		$("#sellRate").html(result+"%");
	})
	contractMarket.methods.tokenIndex(tokenId).call({from:account},function(error,token){
		tokenName=token;
		contractMarket.methods.tokenInfo(tokenName).call({from:account},function(error,result){
			var floorPrice=Math.round(result.floorPrice/10**18 * 1000000 ) / 1000000;
			console.log("floorPrice",floorPrice)
			$("#name").html(tokenName);
			$("#name2").html(tokenName);
			$("#name3").html(tokenName);
			$("#floorPrice").html(floorPrice);
			$("#volume").html(result.volume);
			$("#owner").html(result.itemIndex);
			$("#sales").html(result.sales);
			$("#supply").html(result.supply);
			$("#floorPrice2").html(floorPrice+"ETH");
			$("#perMint").html(Math.round(floorPrice*ethRate* 10000)/10000);
			tokenIndex=result.itemIndex;
			activities(tokenIndex);
			listed();
			contractMarket.methods.myOrdersCount(account).call({from:account},function(error,ordersCount){
				orders(ordersCount);
			})
			contractInscription.methods.balanceOf(account,tokenName).call({from:account},function(error,balance){
				tokenBalance=balance;
				$("#balance").html(balance);
			})
		})
	})
}
var ethRate=2350;//代币汇率，根据汇率计算出价值多少U
function listed(){
	$("#listContainer").html('');
	contractMarket.methods.getSortedItems(tokenName).call({from:account},function(error,result){
		$("#volume2").html(result.length);
		if(result.length==0){
			$("#listContainer").html('<p style="text-align: center;">No Data</p>');
		}
		//console.log(result)
		for(var i=0;i<result.length;i++){
			var owner=result[i].owner.slice(0,4)+"..."+result[i].owner.slice(38);
			var price=Math.round(result[i].price/10**18 * 10000 ) / 10000;
			var uintPrice=Math.round(result[i].uintPrice/10**18 * 10000000 ) / 10000000;
			var event=`<a href="javascript:void(0)" class="buy" onclick="buy(`+result[i].num+`)">Buy</a>`;
			if(result[i].owner==account){
				event=`<a href="javascript:void(0)" class="buy" onclick="cancel(`+result[i].num+`)">Cancel</a>`;
			}
			var div=`<div class="item">
			  <div class="cont1">
				<div class="tit1">`+result[i].name+`</div>
				<div class="tit2">`+result[i].count+`</div>
				<div class="tit3">
				  `+uintPrice+` / Per Mint</div>
				<div class="tit4">$ `+Math.round(uintPrice*ethRate * 100000 ) / 100000+`</div>
			  </div>
			  <div class="cont2">
				<div class="infor1">
				  <p>#`+result[i].num+`</p>
				  <p>`+owner+`</p>
				</div>
				<div class="infor2">
				  <p>`+price+`ETH</p>
				  <p>$ `+Math.round(price*ethRate * 100000 ) / 100000+`</p>
				</div>
				`+event+`
			  </div>
			</div>`;
			$("#listContainer").append(div);
		}
	})
}

function activities(index){
	if(index<=0){
		registerCopy();
		return;
	}
	contractMarket.methods.items(tokenName,index).call({from:account},function(error,result){
		//console.log(result)
		var price=Math.round(result.price/10**18 * 10000 ) / 10000;
		var uintPrice=Math.round(result.uintPrice/10**18 * 10000000 ) / 10000000;
		var owner=result.owner.slice(0,4)+"..."+result.owner.slice(38);
		var addTime=formatDate(parseInt(result.addTime)*1000)
		var op="";
		if(result.op=="1"){
			op="<b style='color:rgb(124 212 22)'>Listing</b>";
		}else if(result.op=="2"){
			op="<b style='color:rgb(214 57 42)'>Sold</b>";
		}else if(result.op=="3"){
			op="<b style='color:rgb(153 119 78)'>Cancelled</b>";
		}
		var div=`<tr>
			<td>
			  <div class="waptitle">
				No.
			  </div>
			  <div class="s1">
				<b>`+result.num+`</b>
			  </div>
			</td>
			<td>
			  <div class="waptitle">
				Event
			  </div>
			  `+op+`
			</td>
			<td>
			  <div class="waptitle">
				Tick
			  </div>
			  `+result.name+`
			</td>
			<td>
			  <div class="waptitle">
				Price
			  </div>
			  <span class="ver">`+uintPrice+`</span>
			</td>
			<td>
			  <div class="waptitle">
				Amount
			  </div>
			  `+result.count+`
			</td>
			<td>
			  <div class="waptitle">
				Total
			  </div>
			  <span class="ver">`+price+`</span>
			</td>
			<td>
			  <div class="waptitle">
				From
			  </div>
			  <a href="" class="a1">`+owner+`</a>
			  <div class="copy" data-clipboard-text="`+result.owner+`"></div>
			</td>
			<td>
			  <div class="waptitle">
				Time
			  </div>
			  <a href="" class="a1">`+addTime+`</a>
			</td>
		  </tr>`;
		$("#activityTable").append(div);
		index--
		activities(index);
	})
}

function orders(index){
	if(index<=0){
		registerCopy();
		return;
	}
	contractMarket.methods.myOrders(account,index).call({from:account},function(error,orderIndex){
		contractMarket.methods.buyRecords(tokenName,orderIndex).call({from:account},function(error,record){
			contractMarket.methods.items(tokenName,record.itemIndex).call({from:account},function(error,result){
				var price=Math.round(result.price/10**18 * 10000 ) / 10000;
				var uintPrice=Math.round(result.uintPrice/10**18 * 10000000 ) / 10000000;
				var owner=result.owner.slice(0,4)+"..."+result.owner.slice(38);
				var to=record.owner.slice(0,4)+"..."+record.owner.slice(38);
				var addTime=formatDate(parseInt(record.time)*1000)
				var op="";
				if(result.op=="1"){
					op="<b style='color:rgb(124 212 22)'>Listing</b>";
				}else if(result.op=="2"){
					op="<b style='color:rgb(214 57 42)'>Sold</b>";
				}else if(result.op=="3"){
					op="<b style='color:rgb(153 119 78)'>Cancelled</b>";
				}
				var action="";
				if(record.owner==account){
					action="buy";
				}else{
					action="Sell";
				}
				var div=`<tr>
					<td>
					  <div class="waptitle">
						No.
					  </div>
					  <div class="s1">
						<b>`+result.num+`</b>
					  </div>
					</td>
					<td>
					  <div class="waptitle">
						Event
					  </div>
					  `+op+`
					</td>
					<td>
					  <div class="waptitle">
						Tick
					  </div>
					  `+result.name+`
					</td>
					<td>
					  <div class="waptitle">
						Price
					  </div>
					  <span class="ver">`+uintPrice+`</span>
					</td>
					<td>
					  <div class="waptitle">
						Amount
					  </div>
					  `+result.count+`
					</td>
					<td>
					  <div class="waptitle">
						Total
					  </div>
					  <span class="ver">`+price+`</span>
					</td>
					<td>
					  <div class="waptitle">
						From
					  </div>
					  <a href="" class="a1">`+owner+`</a>
					  <div class="copy" data-clipboard-text="`+result.owner+`"></div>
					</td>
					<td>
					  <div class="waptitle">
						To
					  </div>
					  <a href="" class="a1">`+to+`</a>
					  <div class="copy" data-clipboard-text="`+record.owner+`"></div>
					</td>
					<td>
					  <div class="waptitle">
						Time
					  </div>
					  <span class="ver">`+addTime+`</span>
					</td>
					<td>
					  <div class="waptitle">
						Action
					  </div>
					  <span class="ver">`+action+`</span>
					</td>
				  </tr>`;
				$("#orderTable").append(div);
				index--
				orders(index);
			})
		})
	})
}

$("#all").click(function(){
	contractInscription.methods.balanceOf(account,tokenName).call({from:account},function(error,balance){
		$("#amount").val(balance);
		tokenBalance=balance;
		sumPrice();
	})
})

function sumPrice(){
	var amount=parseFloat($("#amount").val());
	var price=parseFloat($("#price").val());
	if(amount&&price){
		var inputPrice=Math.round(price/amount * 1000000 ) / 1000000;
		var getPrice=Math.round(price*98/100 * 1000000 ) / 1000000;
		$("#inputPrice").html(inputPrice)
		$("#canGet").html(getPrice+"ETH");
	}
}
$("#confirmList").click(function(){
	listToken();
})

function listToken(){
	var amount=parseFloat($("#amount").val());
	var price=parseFloat($("#price").val());
	if(!amount){
		showAlert(2,"Please enter amount")
		return;
	}
	if(!price){
		showAlert(2,"Please enter price")
		return;
	}
	if(amount>tokenBalance){
		showAlert(2,"Insufficient Balance")
		return;
	}
	contractInscription.methods.allowance(tokenName,account,contracts.market.address).call({from:account},function(error,result){
		if(result>amount){
			var val=BigInt(price*10**18)
			console.log("val",val)
			call(contractMarket.methods.sale(tokenName,val,amount),contracts.market.address,function(){
				$("#alertmodel3").fadeOut(100)
				showAlert(1,"Success")
				init();
			});
		}else{
			var maxValue = BigInt(100000000*10**18)//BigInt(2 ** 128 - 1);
			call(contractInscription.methods.approve(tokenName,contracts.market.address,maxValue.toString()),contracts.inscription.address,function(){
				listToken();
			});
		}
	})
}

function buy(itemId){
	contractMarket.methods.items(tokenName,itemId).call({from:account},function(error,result){
		//console.log(result)
		callAndSend(contractMarket.methods.buy(tokenName,itemId),contracts.market.address,result.price,function(){
			showAlert(1,"Success")
			init();
		});
	});
}

function cancel(itemId){
	call(contractMarket.methods.cancel(tokenName,itemId),contracts.market.address,function(){
		showAlert(1,"Success")
		init();
	});
}
function getETHPrice(callback){
	$.ajax({
		url: 'https://api.coincap.io/v2/assets/ethereum',
		method: 'GET',
		dataType: 'json',
		success: function (data) {
		  if (data && data.data && data.data.priceUsd) {
			const ethPrice = Math.round(data.data.priceUsd * 1000 ) / 1000;
			ethRate=ethPrice;
			console.log(`ETH Price in USD: ${ethPrice}`);
		  } else {
			console.error('Failed to retrieve ETH price.');
		  }
			callback()
		},
		error: function (error) {
		  console.error('Error fetching data from CoinCap:', error.statusText);
			callback()
		}
	});
}