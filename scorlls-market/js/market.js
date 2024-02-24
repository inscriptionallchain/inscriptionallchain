getETHPrice(function(){
	loadData(function(){
		init()
	});
});
var ethRate=2350;//代币汇率，根据汇率计算出价值多少U
function init(){
	$("#list").html(`<tr>
		<th>Tick</th>
		<th>Floor Price</th>
		<th>24h Volume</th>
		<th>24h Sales</th>
		<th>Owners</th>
		<th>Total Volume</th>
		<th>Total Sales</th>
		<th>Listed</th>
	  </tr>`);
	contractMarket.methods.tokens().call({from:account},function(error,counter){
		item(counter,1);
	})
}

function item(arr,index){
	if(index>arr){
		return;
	}
	contractMarket.methods.tokenIndex(index).call({from:account},function(error,name){
		contractMarket.methods.tokenInfo(name).call({from:account},function(error,result){
			//console.log(result)
			var floorPrice=Math.round(result.floorPrice/10**18 * 1000000 ) / 1000000;
			var div=`<tr onclick='window.location.href="marketDetail.html?item=`+result.num+`"'>
				<td>
				  <div class="waptitle">
					Tick
				  </div>
				  <div class="s1">
					<b>`+name+`</b>
				  </div>
				</td>
				<td>
				  <div class="waptitle">
					Floor Price
				  </div>

				  `+floorPrice+`
				</td>
				<td>

				  <div class="waptitle">
					24h Volume
				  </div>
				  <span class="ver" id="`+name+`Volume">0</span>
				</td>
				<td>
				  <div class="waptitle">
					24h Sales
				  </div>
				  <span class="ver" id="`+name+`Sale">0</span>
				</td>
				<td>
				  <div class="waptitle">
					Owners
				  </div>
				  `+result.itemIndex+`
				</td>
				<td>
				  <div class="waptitle">Total Volume</div>
				  <span class="ver">`+result.volume+`</span>
				</td>
				<td>
				  <div class="waptitle">Total Sales</div>
				  `+result.sales+`
				</td>
				<td>
				  <div class="waptitle">Listed</div>`+result.itemIndex+`
				</td>
			  </tr>`
				// <td>
				//   <div class="waptitle">Market Cap</div>$`+Math.round(result.salePrice/10**18*ethRate * 100000 ) / 100000+`
				// </td>
			$("#list").append(div);
			sumBuy(name,result.buyCount);
			index++;
			item(arr,index)
		})
	})
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
function sumBuy(tokenName,index){
	if(index<=0){
		return;
	}
	contractMarket.methods.buyRecords(tokenName,index).call({from:account},function(error,record){
		console.log(record)
		var time=record.time*1000;
		var currentTimestamp = Math.floor(Date.now() / 1000);
		var timeDifference = currentTimestamp - time;
		if(timeDifference <= 24 * 60 * 60){
			var volume=parseFloat($("#"+tokenName+"Volume").html());
			var sale=parseFloat($("#"+tokenName+"Sale").html());
			$("#"+tokenName+"Volume").html(volume+Math.round(record.price/10**18 * 1000000 ) / 1000000);
			$("#"+tokenName+"Sale").html(sale+parseFloat(record.count));
			index--;
			sumBuy(tokenName,index);
		}
	})
}