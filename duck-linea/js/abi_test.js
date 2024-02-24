var contracts={
	inscription:{
		address:'0x9E691A4D1347ddd51300374F0e19240370E79F2f'
	}
}
function formatDateTime(inputTime) {
	var date = new Date(inputTime);
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	m = m < 10 ? ('0' + m) : m;
	var d = date.getDate();
	d = d < 10 ? ('0' + d) : d;
	var h = date.getHours();
	h = h < 10 ? ('0' + h) : h;
	var minute = date.getMinutes();
	var second = date.getSeconds();
	minute = minute < 10 ? ('0' + minute) : minute;
	second = second < 10 ? ('0' + second) : second;
	return y + '-' + m + '-' + d + ' ' + '　' + h + ':' + minute + ':' + second;
}
var contractInscription;
var provider;
function loadData(callback){
	//通过合约编译后的元数据，加载对应的abi设置到contracts中
	$.getJSON("data/InscriptionScrolls_metadata.json?version=1", function (result){
		contracts.inscription.abi=result.output.abi;
		if (typeof window.ethereum !== 'undefined') {
			var ethereum = window.ethereum
			//禁止自动刷新，metamask要求写的
			ethereum.autoRefreshOnNetworkChange = false
			try {
				if (window.ethereum) {
					try {
						(window.ethereum).request({
							method: 'wallet_switchEthereumChain',
							params: [{
								//chainId: Web3.utils.numberToHex(56) // 币安主网
								chainId: Web3.utils.numberToHex(97) // 币安测试网
							}]
						})
					} catch (e) {
						if ((e).code === 4902) {
							try {
								(window.ethereum).request({
									method: 'wallet_addEthereumChain',
									params: [{
										//chainId: Web3.utils.numberToHex(56), // 币安主网
										chainId: Web3.utils.numberToHex(97), // 币安测试网
										chainName: 'Binance Smart Chain',
										nativeCurrency: {
										  name: 'BNB',
										  symbol: 'BNB',
										  decimals: 18
										},
										rpcUrls: ['https://bsc-dataseed.binance.org/'], // 节点
										blockExplorerUrls: ['https://bscscan.com/']
									}]
								})
							} catch (ee) {
								//
							}
						} else if ((e).code === 4001) return
					}
				}
				if (ethereum.selectedAddress != 'undefined') {
					var accounts = ethereum.enable()
					provider = new Web3(ethereum);
					contractInscription=new provider.eth.Contract(contracts.inscription.abi,contracts.inscription.address);
					provider.eth.getAccounts(function (error, result) {
						if (!error){
							var networkId = window.ethereum.networkVersion;
							provider.eth.getBalance(result[0]).then(console.log);
							account=result[0];
							if(networkId!=97){
								$("#account").html("Wrong Network");
							}else{
								$("#account").html(account.slice(0,4)+"..."+account.slice(38));
							}
							callback();
						}
					});
				} else {
					alert("请解锁MetaMask并创建账号！");
				}
			} catch (e) {
				throw e;
				// swal({
				// 	title: "错误:"+e,
				// 	type: "error",
				// 	confirmButtonText:"好的"
				// });
			}
			ethereum.on('networkChanged', function (networkIDstring) {
				console.log("networkIDstring",networkIDstring)
				window.location.reload();
			})
		} else {
			swal({
				title: "没有安装metamask",
				type: "error",
				confirmButtonText:"好的"
			});
		}
	});
}

function call(fun,toAddr,callback){
	var callData=fun.encodeABI();
	window.ethereum.request({
		method: 'eth_sendTransaction',
		params: [{
			from:account,
			to: toAddr,
			data: callData,
		}],
	}).then(function(receipt){
		console.log("receipt",receipt)
		showAlert(1,"Sending...")
		// 调用监听函数
		waitForTransactionConfirmation(receipt,callback);
	}).catch(function(error) {
        if (error.code === 4001) {
			// 用户取消了交易
			console.log("Transaction canceled by user");
			showAlert(2,"Revoke")
		} else {
			showAlert(2,"Other Error")
			showAlert(2,"error")
		}
    });
}

function callAndSend(fun,toAddr,eth,callback){
	var callData=fun.encodeABI();
	window.ethereum.request({
		method: 'eth_sendTransaction',
		params: [{
			from:account,
			to: toAddr,
			value: eth+"",
			data: callData,
		}],
	}).then(function(receipt){
		console.log("receipt",receipt)
		showAlert(1,"交易发送中...")
		// 调用监听函数
		waitForTransactionConfirmation(receipt,callback);
	}).catch(function(error) {
        if (error.code === 4001) {
			// 用户取消了交易
			console.log("Transaction canceled by user");
			showAlert(2,"取消授权")
		} else {
			showAlert(2,"其他错误")
			showAlert(2,"error")
		}
    });
}

function waitForTransactionConfirmation(transactionHash,callback) {
    const interval = setInterval(async () => {
        try {
            const receipt = await provider.eth.getTransactionReceipt(transactionHash);
            if (receipt && receipt.blockNumber) {
                // 交易已经被打包进区块
                clearInterval(interval);
                console.log('Transaction confirmed:', receipt);
                // 在这里可以执行交易完成后的逻辑
				if(callback){
					callback();
				}
            } else {
                // 交易尚未被打包进区块
                console.log('Transaction still pending...');
            }
        } catch (error) {
            console.error('Error checking transaction receipt:', error);
        }
    }, 1000);
}
function formatDate(timestamp) {
	var now=new Date(timestamp)
	var year = now.getFullYear();
	var month = now.getMonth() + 1;
	var date = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();
	var second = now.getSeconds();
	return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second;
}

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}
function showAlert(type,title){
	if(type==1){
		$("#succeed .title").html(title);
		$('#succeed').fadeIn(200);
	}else if(type==2){
		$("#fail .title").html(title);
		$("#fail").fadeIn(200);
	}
}

function registerCopy(){
	var btns = document.querySelectorAll('.copy');
	var clipboard = new Clipboard(btns);
	clipboard.on('success', function(e) {
		$('.success').stop().hide()
		$('.success').fadeIn(100).delay(1000).fadeOut(100)
	});
	$('.success .close').click(function(){
		$(this).parents('.success').stop().fadeOut(100)
	})
}