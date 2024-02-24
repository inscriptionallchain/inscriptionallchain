var contracts={
	inscription:{
		address:'0x96F9C94fDE57070E6B8D1334A9eBdBF1e291988f'
	},
	proxy:{
		address:'0x2642C03D1c3aA646b8E698882bfd141A5bD18FA7'
	},
	market:{
		address:'0xFa241deFbb27e89DB2928F9305EB90C11f8555e0'
	},
	token:{
		address:'0x0Eb35E3d94AebBA14611A298d85BA9c366CEB231',
		//address:'0xeEA15c833e41724cc79B253370140637542BD1b7',//ccc
		//weth:0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
		//avax weth: 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7
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
var contractProxy;
var contractMarket;
var contractToken;
var provider;
function loadData(callback){
	$.getJSON("data/ERC20_metadata.json", function (result){
		contracts.token.abi=result.output.abi;
		$.getJSON("data/DuckMarket_metadata.json?version=1", function (result){
			contracts.market.abi=result.output.abi;
			$.getJSON("data/DuckInscriptionProxy_metadata.json?version=1", function (result){
				contracts.proxy.abi=result.output.abi;
				//通过合约编译后的元数据，加载对应的abi设置到contracts中
				$.getJSON("data/DuckInscription_metadata.json?version=1", function (result){
					contracts.inscription.abi=result.output.abi;
					if (typeof window.ethereum !== 'undefined') {
						var ethereum = window.ethereum
						//禁止自动刷新，metamask要求写的
						ethereum.autoRefreshOnNetworkChange = true
						try {
							if (window.ethereum) {
								var networkId = window.ethereum.networkVersion || window.ethereum.chainId;
								if(networkId!=59144){
									try {
										(window.ethereum).request({
											method: 'wallet_switchEthereumChain',
											params: [{
												chainId: Web3.utils.numberToHex(59144) // 主网
												//chainId: Web3.utils.numberToHex(97) // 币安测试网
											}]
										})
									} catch (e) {
										if ((e).code === 4902) {
											try {
												(window.ethereum).request({
													method: 'wallet_addEthereumChain',
													params: [{
														chainId: Web3.utils.numberToHex(59144), // 主网
														//chainId: Web3.utils.numberToHex(97), // 币安测试网
														chainName: 'Linea',
														nativeCurrency: {
														  name: 'ETH',
														  symbol: 'ETH',
														  decimals: 18
														},
														rpcUrls: ['https://linea-mainnet.infura.io/v3/'], // 节点
														blockExplorerUrls: ['https://lineascan.build']
													}]
												})
											} catch (ee) {
												//
											}
										} else if ((e).code === 4001) return
									}
								}
							}
							if (ethereum.selectedAddress != 'undefined') {
								var accounts = ethereum.enable()
								provider = new Web3(ethereum);
								contractInscription=new provider.eth.Contract(contracts.inscription.abi,contracts.inscription.address);
								contractProxy=new provider.eth.Contract(contracts.proxy.abi,contracts.proxy.address);
								contractMarket=new provider.eth.Contract(contracts.market.abi,contracts.market.address);
								contractToken=new provider.eth.Contract(contracts.token.abi,contracts.token.address);
								provider.eth.getAccounts(function (error, result) {
									if (!error){
										provider.eth.getBalance(result[0]).then(console.log);
										account=result[0];
										console.log("networkId",networkId)
										// if(networkId!=56){
										// 	$("#account").html("Wrong Network");
										// }else{
										$("#account").html(account.slice(0,4)+"..."+account.slice(38));
										//}
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
							window.location.reload()
						})
						ethereum.on('accountsChanged', function (accounts) {
							window.location.reload()
						});
					} else {
						swal({
							title: "没有安装metamask",
							type: "error",
							confirmButtonText:"好的"
						});
					}
				});
			});
		});
	});
}
var shouldReload = true; 

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
		}
    });
}

function callAndSend(fun,toAddr,eth,callback){
	var callData=fun.encodeABI();
	var val=provider.utils.toHex(eth);
	window.ethereum.request({
		method: 'eth_sendTransaction',
		params: [{
			from:account,
			to: toAddr,
			value: val,
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
	var date = new Date(timestamp);
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
	return y + '-' + m + '-' + d + '　' + h + ':' + minute + ':' + second;
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

function showMail(){
	console.log(1)
	showAlert(1,"scriptionscroll@gmail.com");
}