loadData(function(){
	init()
});

function init(){
	$("#list").html(`<tr>
		<th>Token</th>
		<th>Deploy Time</th>
		<th>Progress</th>
		<th>Holders</th>
		<th>Transactions</th>
		<th></th>
	  </tr>`);
	contractInscription.methods.inscriptionCounter().call({from:account},function(error,counter){
		item(counter,1);
	})
}

function item(arr,index){
	if(index>arr){
		return;
	}
	contractInscription.methods.inscriptions(index).call({from:account},function(error,result){
		console.log(result)
		var rate=Math.round(result.progress/result.supply*100 * 10000 ) / 10000
		var deployTime=formatDate(parseInt(result.deployTime)*1000)
		var div=`<tr>
			  <td>`+result.name+`</td>
			  <td>`+deployTime +`</td>
			  <td>`+rate+`%</td>
			  <td>`+result.holders +`</td>
			  <td>`+result.transtractions+`</td>
		  </tr>`;
		var img='';
		if(result.name=="SRCS"){
			img=`<img style="width:24px;height:24px;" src="data:image/png;base64,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">`;
		}
		var div=`<tr onclick='window.location.href="tokenInfo.html?token=`+result.num+`"'>
			<td>
			  <div class="s1">
				`+img+`
				<b>`+result.name+`</b>
				<span>LRC-20</span>
			  </div>
			</td>
			<td>`+deployTime +`</td>
			<td>
			  <div class="tit">`+rate+`%</div>
			  <div class="val">
				<i style="width: `+rate+`%;"></i>
			  </div>
			</td>
			<td>
			  `+result.holders +`
			</td>
			<td>`+result.transtractions+`</td>
			<td>
			  <a href="#" class="more"></a>
			</td>
		  </tr>`
		$("#list").append(div);
		index++;
		item(arr,index)
	})
}

$("#deploy").click(function(){
	deploy();
})

function deploy(){
	var tick=$("#tick").val();
	var supply=$("#supply").val();
	var limit=$("#limit").val();
	var fee=$("#fee").val();
	if(!tick){
		showAlert(2,"Please enter tick")
		return;
	}
	if(!supply){
		showAlert(2,"Please enter total supply")
		return;
	}
	if(!limit){
		showAlert(2,"Please enter limit per mint")
		return;
	}
	if(!fee){
		showAlert(2,"Please enter fee per mint")
		return;
	}
	var str=`{"p":"lrc-20","op":"deploy","tick":"`+tick+`","total":"`+supply+`","limit":"`+limit+`"}`;
	var cost=BigInt(parseFloat(fee)*10**18);
	console.log(str)
	console.log("cost",cost)
	contractInscription.methods.switchOn().call({from:account},function(error,switchOn){
		if(switchOn){
			call(contractInscription.methods.deploy(str,cost),contracts.inscription.address,function(){
				$("#alertmodel2").fadeOut(100)
				showAlert(1,"Success")
				init();
			});
		}else{
			showAlert(2,"Coming soon")
		}
	})
}
$("#search").click(function(){
	var addr=$("#keywords").val();
	if(addr.length!=42){
		$("#chey1").fadeIn(200);
		$("#main1").hide();
		return;
	}
	contractInscription.methods.typeCount(addr).call({from:account},function(error,counter){
		startCounter=counter;
		itemRecord(addr,counter,counter);
		$("#latest").html("");
	})
	$("#chey1").fadeOut(200);
	$("#main1").show();
})

function itemRecord(addr,arr,index){
	if(index<=0){
		return;
	}
	contractInscription.methods.indexName(addr,index).call({from:account},function(error,str){
		contractInscription.methods.balanceOf(addr,str).call({from:account},function(error,result){
			var formattedNumber = parseInt(result).toLocaleString('en-US', { useGrouping: true });
			var div=`<div class="item" style="height: 220px;">
			  <a href="javascript:void(0)">
				<div class="content2">
				  <div class="infor">
					<p style="color:#d64f49">`+str+` </p>
				  </div>
				</div>
				<div class="text2">
				  <div class="scroll">
					  <p>`+formattedNumber+`</p>
				  </div>
				</div>
			  </a>
			</div>`
			$("#latest").append(div);
			index--;
			itemRecord(addr,arr,index);
		})
	})
}