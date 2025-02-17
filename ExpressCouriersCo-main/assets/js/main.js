/*
	Hyperspace by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$sidebar = $('#sidebar');

	// Breakpoints.
		breakpoints({
			xlarge:   [ '1281px',  '1680px' ],
			large:    [ '981px',   '1280px' ],
			medium:   [ '737px',   '980px'  ],
			small:    [ '481px',   '736px'  ],
			xsmall:   [ null,      '480px'  ]
		});

	// Hack: Enable IE flexbox workarounds.
		if (browser.name == 'ie')
			$body.addClass('is-ie');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Forms.

		// Hack: Activate non-input submits.
			$('form').on('click', '.submit', function(event) {

				// Stop propagation, default.
					event.stopPropagation();
					event.preventDefault();

				// Submit form.
					$(this).parents('form').submit();

			});

	// Sidebar.
		if ($sidebar.length > 0) {

			var $sidebar_a = $sidebar.find('a');

			$sidebar_a
				.addClass('scrolly')
				.on('click', function() {

					var $this = $(this);

					// External link? Bail.
						if ($this.attr('href').charAt(0) != '#')
							return;

					// Deactivate all links.
						$sidebar_a.removeClass('active');

					// Activate link *and* lock it (so Scrollex doesn't try to activate other links as we're scrolling to this one's section).
						$this
							.addClass('active')
							.addClass('active-locked');

				})
				.each(function() {

					var	$this = $(this),
						id = $this.attr('href'),
						$section = $(id);

					// No section for this link? Bail.
						if ($section.length < 1)
							return;

					// Scrollex.
						$section.scrollex({
							mode: 'middle',
							top: '-20vh',
							bottom: '-20vh',
							initialize: function() {

								// Deactivate section.
									$section.addClass('inactive');

							},
							enter: function() {

								// Activate section.
									$section.removeClass('inactive');

								// No locked links? Deactivate all links and activate this section's one.
									if ($sidebar_a.filter('.active-locked').length == 0) {

										$sidebar_a.removeClass('active');
										$this.addClass('active');

									}

								// Otherwise, if this section's link is the one that's locked, unlock it.
									else if ($this.hasClass('active-locked'))
										$this.removeClass('active-locked');

							}
						});

				});

		}

	// Scrolly.
		$('.scrolly').scrolly({
			speed: 1000,
			offset: function() {

				// If <=large, >small, and sidebar is present, use its height as the offset.
					if (breakpoints.active('<=large')
					&&	!breakpoints.active('<=small')
					&&	$sidebar.length > 0)
						return $sidebar.height();

				return 0;

			}
		});

	// Spotlights.
		$('.spotlights > section')
			.scrollex({
				mode: 'middle',
				top: '-10vh',
				bottom: '-10vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			})
			.each(function() {

				var	$this = $(this),
					$image = $this.find('.image'),
					$img = $image.find('img'),
					x;

				// Assign image.
					$image.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set background position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide <img>.
					$img.hide();

			});

	// Features.
		$('.features')
			.scrollex({
				mode: 'middle',
				top: '-20vh',
				bottom: '-20vh',
				initialize: function() {

					// Deactivate section.
						$(this).addClass('inactive');

				},
				enter: function() {

					// Activate section.
						$(this).removeClass('inactive');

				}
			});

	// Partners and Integrations Carousel
	document.addEventListener('DOMContentLoaded', function() {
		const track = document.querySelector('.carousel-track');
		const slides = Array.from(track.children);
		const slideWidth = slides[0].getBoundingClientRect().width;
		let slideIndex = 0;

		// Arrange the slides next to one another
		slides.forEach((slide, index) => {
			slide.style.left = slideWidth * index + 'px';
		});

		function moveToSlide(index) {
			track.style.transform = 'translateX(-' + slideWidth * index + 'px)';
			slideIndex = index;
		}

		function moveCarousel() {
			slideIndex++;
			if (slideIndex >= slides.length) {
				slideIndex = 0;
			}
			moveToSlide(slideIndex);
		}

		// Move carousel every 3 seconds
		setInterval(moveCarousel, 3000);
	});

	// Partners Carousel
	document.addEventListener('DOMContentLoaded', function() {
		const track = document.querySelector('.carousel-track');
		const slides = Array.from(track.children);
		let currentIndex = 0;

		function moveCarousel() {
			currentIndex++;
			if (currentIndex >= slides.length) {
				currentIndex = 0;
				track.style.transition = 'none';
				track.style.transform = 'translateX(0)';
				setTimeout(() => {
					track.style.transition = 'transform 0.5s ease-in-out';
				}, 10);
			} else {
				track.style.transform = `translateX(-${currentIndex * 20}%)`;
			}
		}

		// Move carousel every 3 seconds
		setInterval(moveCarousel, 3000);
	});

	document.addEventListener('DOMContentLoaded', function() {
		const tipButtons = document.querySelectorAll('.tip-button');
		const customTipInput = document.getElementById('custom-tip');
		const tipInput = document.getElementById('tip');
		const totalDisplay = document.getElementById('total-amount');
		const deliveryFee = 15.00;

		function updateTotal(tipAmount) {
			const total = deliveryFee + parseFloat(tipAmount || 0);
			totalDisplay.textContent = `$${total.toFixed(2)}`;
			tipInput.value = tipAmount;
		}

		// Handle percentage tip buttons
		tipButtons.forEach(button => {
			button.addEventListener('click', function() {
				// Clear custom tip input
				customTipInput.value = '';
				
				// If this button is already selected, deselect it
				if (this.classList.contains('selected')) {
					this.classList.remove('selected');
					updateTotal(0);
					return;
				}
				
				// Remove selected class from all buttons
				tipButtons.forEach(btn => btn.classList.remove('selected'));
				
				// Add selected class to clicked button
				this.classList.add('selected');
				
				// Calculate tip based on percentage
				const percentage = parseFloat(this.getAttribute('data-percentage'));
				const tipAmount = (deliveryFee * (percentage / 100));
				
				updateTotal(tipAmount);
			});
		});

		// Handle custom tip input
		customTipInput.addEventListener('input', function() {
			// Remove selected class from percentage buttons
			tipButtons.forEach(btn => btn.classList.remove('selected'));
			
			// Update total with custom amount
			const customAmount = parseFloat(this.value) || 0;
			updateTotal(customAmount);
		});

		// Initialize with no tip
		updateTotal(0);

		// Card number formatting
		const cardInput = document.getElementById('card-number');
		cardInput.addEventListener('input', function(e) {
			// Remove any non-digits
			let value = this.value.replace(/\D/g, '');
			// Truncate to 16 digits
			value = value.substring(0, 16);
			this.value = value;
		});

		// Expiry date formatting
		const expiryInput = document.getElementById('expiry');
		let prevValue = '';
		
		expiryInput.addEventListener('input', function(e) {
			let value = this.value.replace(/\D/g, '');
			
			// Allow backspacing
			if (this.value.length < prevValue.length) {
				prevValue = this.value;
				return;
			}
			
			// Format as MM/YY
			if (value.length >= 2) {
				value = value.substring(0, 2) + '/' + value.substring(2, 4);
			}
			
			this.value = value;
			prevValue = this.value;
		});

		// CVV formatting
		const cvvInput = document.getElementById('cvv');
		cvvInput.addEventListener('input', function(e) {
			// Remove any non-digits
			let value = this.value.replace(/\D/g, '');
			// Truncate to 4 digits
			value = value.substring(0, 4);
			this.value = value;
		});
	});

})(jQuery);