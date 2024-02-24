window.setTimeout(function() {
	$(".loading").fadeOut(500)
	var wow = new WOW({
		boxClass: 'wow',
		animateClass: 'animated',
		offset: 0,
		mobile: true,
		live: true
	});
	wow.init();
}, 400)

$(document).ready(function() {
	$(window).load(function() {
		$(".mobile-inner-header-icon").click(function() {
			$(this).toggleClass("mobile-inner-header-icon-click mobile-inner-header-icon-out");
			$(".mobile-inner-nav").slideToggle(250);
		});
		$(".mobile-inner-nav li").each(function(index) {
			$(this).css({
				'animation-delay': (index / 10) + 's'
			});
		});
		$(".mobile-inner-nav li").click(function() {
			$(this).find('dl').slideToggle(200)
		})
	});

})

$(document).ready(function() {

	$(".section_8 img").each(function(index) {
		$(this).css({
			'animation-delay': (index / 10) + 's'
		});
	});




	$('.titlemodel').addClass('wow fadeInUp')



	$('.head .right .switch').click(function() {
		$(this).next('ul').toggle()
	})

	$('.main1 .contentDetail .check_Search .check a').click(function() {
		$('.main1 .contentDetail .check_Search .check a').removeClass('current')
		$(this).addClass('current')
	})


	// $('.head .right .more').click(function() {
	// 	$('#alertmodel1').stop()
	// 	$('#alertmodel1').fadeToggle(200)
	// })
	$('.main1 .contentDetail .title .more').click(function() {
		$('#alertmodel2').stop()
		$('#alertmodel2').fadeToggle(200)
	})


	$('.btn200').click(function() {
		$('#alertmodel200').stop()
		$('#alertmodel200').fadeToggle(200)
	})




	$('.main1 .tabs2 .hdlist .list').click(function() {
		$('#alertmodel3').stop()
		$('#alertmodel3').fadeToggle(200)
	})

	$('.alertmodel .shadow,.alertmodel .content1 .close').click(function() {
		$(this).parents('.alertmodel').stop()
		$(this).parents('.alertmodel').fadeOut(200)
	})


	function height() {
		var sc = $(window).scrollTop();
		if (sc > 200) {
			$("body").addClass("current");
		} else {
			$("body").removeClass("current");
		}
	}
	height()
	$(window).scroll(function() {
		height()
	});



	function initTab(tab) {
		$(tab + ' .hd a').eq(0).addClass('current');
		$(tab + ' .model').hide();
		$(tab + ' .model').eq(0).show();
		$(tab + ' .hd a').click(function() {
			var thisa = $(tab + ' .hd a').index(this);
			$(tab + ' .hd a').removeClass('current');
			$(this).addClass('current');
			$(tab + ' .model').not($(tab + ' .model').eq(thisa)).hide();
			$(tab + ' .model').eq(thisa).stop().fadeIn(100);
		});
	}

	initTab('#tab1');



	$('#tab3 .hd a').eq(0).addClass('current');
	$('#tab3 .model').hide()
	$('#tab3 .model').eq(0).show()
	$('#tab3 .hd a').click(function() {
		var thisa = $('#tab3 .hd a').index(this);
		$('#tab3 .hd a').removeClass('current');
		$(this).addClass('current');
		$('#tab3 .model').not($('#tab3 .model').eq(thisa)).hide();
		$('#tab3 .model').eq(thisa).stop()
		$('#tab3 .model').eq(thisa).fadeIn(100)
		// if (thisa == 2) {
		// 	$('#alertmodel1').fadeIn(200)
		// }
	})



	$('#chey1 .check a').eq(0).addClass('current');
	$('#chey1 .bds .model').hide()
	$('#chey1 .bds .model').eq(0).show()
	$('#chey1 .check a').click(function() {
		var thisa = $('#chey1 .check a').index(this);
		$('#chey1 .check a').removeClass('current');
		$(this).addClass('current');
		$('#chey1 .bds .model').not($('#chey1 .bds .model').eq(thisa)).hide();
		$('#chey1 .bds .model').eq(thisa).stop()
		$('#chey1 .bds .model').eq(thisa).fadeIn(100)
	})





	var clickCount = 0;
	$("#toggleBtn").click(function() {
		clickCount++;

		// Calculate the class index (1, 2, 3) and use modulo to cycle
		var classIndex = clickCount % 3;

		// Remove existing classes
		$(this).removeClass("btn1 btn2 btn3");

		// Add the appropriate class based on the index
		$(this).addClass("btn" + (classIndex + 1));
	});

	var clickCount2 = 0;
	$("#toggleBtn2").click(function() {
		clickCount2++;

		// Calculate the class index (1, 2, 3) and use modulo to cycle
		var classIndex = clickCount2 % 3;

		// Remove existing classes
		$(this).removeClass("btn1 btn2 btn3");

		// Add the appropriate class based on the index
		$(this).addClass("btn" + (classIndex + 1));
	});

	var clickCount3 = 0;
	$("#toggleBtn3").click(function() {
		clickCount3++;

		// Calculate the class index (1, 2, 3) and use modulo to cycle
		var classIndex = clickCount3 % 3;

		// Remove existing classes
		$(this).removeClass("btn1 btn2 btn3");

		// Add the appropriate class based on the index
		$(this).addClass("btn" + (classIndex + 1));
	});




	$('.copyFause').click(function() {
		$('.fause').stop().hide()
		$('.fause').fadeIn(100).delay(1000).fadeOut(100)
	})
	$('.copyFause .close').click(function() {
		$(this).parents('.copyFause').stop().fadeOut(100)
	})



	$('.head .right .nav ul li:nth-child(1) .h2tit a').attr('href', 'index.html')
	$('.head .right .nav ul li:nth-child(2) .h2tit a').attr('href', 'tokens.html')
	$('.head .right .nav ul li:nth-child(3) .h2tit a').attr('href', 'mine.html')
	$('.head .right .nav ul li:nth-child(4) .h2tit a').attr('href', 'market.html')

	var btns = document.querySelectorAll('.copy');
	var clipboard = new Clipboard(btns);
	clipboard.on('success', function(e) {
		$('.success').stop().hide()
		$('.success').fadeIn(100).delay(1000).fadeOut(100)
	});
	$('.success .close').click(function() {
		$(this).parents('.success').stop().fadeOut(100)
	})
});