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
		// Constants
		const DELIVERY_FEE = 20.00;
		const GST = 1.00;
		const BASE_TOTAL = DELIVERY_FEE + GST;

		// Get DOM elements with null checks
		const elements = {
			tipSelect: document.getElementById('tip'),
			subtotalElement: document.getElementById('subtotal'),
			gstElement: document.getElementById('gst'),
			totalElement: document.getElementById('total'),
			tipButtons: document.querySelectorAll('.tip-button'),
			customTipInput: document.getElementById('custom-tip'),
			tipDisplay: document.getElementById('tip-display'),
			totalDisplay: document.getElementById('total-display'),
			orderTotal: document.getElementById('order_total')
		};

		// Update total function with null checks
		function updateTotal(tipAmount = 0) {
			const tip = Number(tipAmount) || 0;
			const total = BASE_TOTAL + tip;
			
			if (elements.tipDisplay) elements.tipDisplay.textContent = tip.toFixed(2);
			if (elements.totalDisplay) elements.totalDisplay.textContent = total.toFixed(2);
			if (elements.orderTotal) elements.orderTotal.value = total.toFixed(2);
		}

		// Setup tip buttons if they exist
		if (elements.tipButtons && elements.tipButtons.length > 0) {
			elements.tipButtons.forEach(button => {
				button.addEventListener('click', function() {
					if (elements.customTipInput) elements.customTipInput.value = '';
					
					elements.tipButtons.forEach(btn => btn.classList.remove('selected'));
					this.classList.add('selected');
					
					const percentage = parseFloat(this.getAttribute('data-percentage'));
					const tipAmount = (DELIVERY_FEE * (percentage / 100));
					
					updateTotal(tipAmount);
				});
			});
		}

		// Setup custom tip input if it exists
		if (elements.customTipInput) {
			elements.customTipInput.addEventListener('input', function() {
				if (elements.tipButtons) {
					elements.tipButtons.forEach(btn => btn.classList.remove('selected'));
				}
				updateTotal(this.value);
			});
		}

		// Initialize with no tip
		updateTotal(0);

		// Address autocomplete setup
		const addressInputs = document.querySelectorAll('[data-google-places="true"]');
		if (addressInputs.length > 0) {
			const suggestionsList = document.createElement('ul');
			suggestionsList.className = 'suggestions-list';
			suggestionsList.style.display = 'none';
			document.body.appendChild(suggestionsList);

			// Debounce function
			const debounce = (func, delay) => {
				let timeoutId;
				return (...args) => {
					clearTimeout(timeoutId);
					timeoutId = setTimeout(() => func.apply(null, args), delay);
				};
			};

			// Update the position of the suggestions list
			function updateSuggestionsPosition(input, suggestionsList) {
				const inputWrapper = input.closest('.address-wrapper');
				if (!inputWrapper) return;

				// Reset the list's display to ensure it's positioned correctly
				suggestionsList.style.display = 'none';
				
				// Position relative to the wrapper
				const inputRect = input.getBoundingClientRect();
				const wrapperRect = inputWrapper.getBoundingClientRect();
				
				suggestionsList.style.width = `${inputRect.width}px`;
				suggestionsList.style.display = 'block';
			}

			// Modify the existing address input initialization
			document.addEventListener('DOMContentLoaded', () => {
				const addressInputs = document.querySelectorAll('[data-google-places="true"]');
				
				addressInputs.forEach(input => {
					const wrapper = input.closest('.address-wrapper');
					if (!wrapper) return;

					// Create suggestions list for this input
					const suggestionsList = document.createElement('ul');
					suggestionsList.className = 'suggestions-list';
					suggestionsList.style.display = 'none';
					wrapper.appendChild(suggestionsList);

					// Update position when showing suggestions
					const showSuggestions = (predictions) => {
						suggestionsList.innerHTML = '';
						predictions.forEach(prediction => {
							const li = document.createElement('li');
							li.textContent = prediction.description;
							li.addEventListener('click', () => {
								input.value = prediction.description;
								input.dataset.selectedFromDropdown = 'true';
								suggestionsList.style.display = 'none';
							});
							suggestionsList.appendChild(li);
						});
						updateSuggestionsPosition(input, suggestionsList);
					};

					// Modify the existing fetchSuggestions function
					const fetchSuggestions = async (query) => {
						if (query.length < 3) {
							suggestionsList.style.display = 'none';
							return;
						}

						try {
							const response = await fetch(`https://api.expresscouriers.co:3000/api/address-autocomplete?input=${encodeURIComponent(query)}`);
							const data = await response.json();

							if (data.status === 'OK' && data.predictions.length > 0) {
								showSuggestions(data.predictions);
							} else {
								suggestionsList.style.display = 'none';
							}
						} catch (error) {
							console.error('Error fetching suggestions:', error);
							suggestionsList.style.display = 'none';
						}
					};

					// Setup event listeners
					const debouncedFetch = debounce(fetchSuggestions, 300);
					
					input.addEventListener('input', (e) => {
						input.dataset.selectedFromDropdown = 'false';
						debouncedFetch(e.target.value.trim());
					});

					input.addEventListener('blur', () => {
						setTimeout(() => {
							suggestionsList.style.display = 'none';
						}, 200);
					});
				});
			});
		}
	});

})(jQuery);