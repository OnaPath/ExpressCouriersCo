if (!window.DeliveryFormHandler) {
    // Define city boundaries once globally
    if (!window.CITY_BOUNDS) {
        window.CITY_BOUNDS = {
            'calgary': {
                north: 51.2,
                south: 50.8,
                east: -113.9,
                west: -114.3
            },
            'airdrie': {
                north: 51.3,
                south: 51.2,
                east: -113.9,
                west: -114.1
            },
            'lethbridge': {
                north: 49.7,
                south: 49.6,
                east: -112.7,
                west: -112.9
            }
        };
    }
  
    class DeliveryFormHandler {
      constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
          console.error(`Form with ID ${formId} not found`);
          return;
        }
  
        this.apiEndpoint = 'https://api.expresscouriers.co/api/delivery-orders';
        this.configEndpoint = 'https://api.expresscouriers.co/config/moneris';
  
        this.pickupAddress = null;
        this.dropoffAddress = null;
        this.distanceKm = 0;
        this.hasCalculatedDistance = false;
        this.baseFees = {
            'calgary': 23.00,
            'airdrie': 20.00,
            'lethbridge': 20.00
        };
  
        // Initialize payment config as an empty object
        this.paymentConfig = {};
  
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message-container';
        this.form.appendChild(this.messageContainer);
  
        this.init().catch(error => {
            console.error('Initialization failed:', error);
            this.showError('Service initialization failed. Please refresh the page.');
        });
      }
  
      async init() {
        try {
            this.elements = {
                deliveryFeeDisplay: document.getElementById('delivery-fee-display'),
                gstDisplay: document.getElementById('gst-display'),
                tipDisplay: document.getElementById('tip-display'),
                totalDisplay: document.getElementById('total-display'),
                orderTotal: document.getElementById('order_total'),
                tipInput: document.getElementById('tip'),
                customTip: document.getElementById('custom-tip'),
                tipButtons: document.querySelectorAll('.tip-button')
            };
            
            const response = await fetch('https://api.expresscouriers.co/config/maps-api-key');
            if (!response.ok) throw new Error('Failed to load Maps API key');
            const data = await response.json();
            this.mapsApiKey = data.key;
            
            await this.initializeGoogleMaps();
            this.setupLoadingUI();
            this.setupFormListener();
            this.initializePayment();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Service initialization failed. Please refresh the page.');
        }
      }
  
      async fetchWithRetry(url, options = {}, retries = 3, baseDelay = 1000) {
        for (let i = 0; i < retries; i++) {
          try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
          } catch (error) {
            if (i === retries - 1) throw error;
            const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
            if (i < retries - 1) console.debug(`Attempt ${i + 1} failed, retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
  
      async initializeGoogleMaps() {
        try {
          if (window.google && window.google.maps) {
            console.log('Maps already initialized');
            this.setupAddressAutocomplete();
            return;
          }
  
          if (!this.mapsApiKey) {
            throw new Error('Maps API key not available');
          }
  
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.mapsApiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.crossOrigin = "anonymous";
            
            script.onload = () => {
              console.log('Maps script loaded successfully');
              this.setupAddressAutocomplete();
              resolve();
            };
            
            script.onerror = (error) => {
              console.error('Maps script failed to load:', error);
              reject(error);
            };
            
            document.head.appendChild(script);
          });
        } catch (error) {
          console.error('Maps initialization failed:', error);
          this.showError('Address lookup unavailable. Please try refreshing the page.');
          throw error;
        }
      }
  
      setupAddressAutocomplete() {
        const addressInputs = this.form.querySelectorAll('input[data-google-places="true"]');
        
        // Get city from form input
        const cityInput = this.form.querySelector('input[name="city"]');
        const city = cityInput ? cityInput.value.toLowerCase() : 'calgary';
        const cityBounds = window.CITY_BOUNDS[city];
        
        if (!cityBounds) {
            console.error(`No bounds defined for city: ${city}`);
            return;
        }

        const bounds = new google.maps.LatLngBounds(
            { lat: cityBounds.south, lng: cityBounds.west },
            { lat: cityBounds.north, lng: cityBounds.east }
        );

        addressInputs.forEach(input => {
            const autocomplete = new google.maps.places.Autocomplete(input, {
                componentRestrictions: { country: ['ca'] },
                bounds: bounds,
                strictBounds: true,
                fields: ['formatted_address', 'geometry']
            });

            input.dataset.city = city;
            autocomplete.setBounds(bounds);

            // Add flag to track if address was selected from dropdown
            input.dataset.selectedFromDropdown = 'false';

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry) {
                    input.setCustomValidity('Please select an address from the dropdown');
                    input.classList.add('error');
                    input.dataset.selectedFromDropdown = 'false';
                    return;
                }

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                if (lat < cityBounds.south || lat > cityBounds.north ||
                    lng < cityBounds.west || lng > cityBounds.east) {
                    input.setCustomValidity(`Please select an address within ${city}`);
                    input.classList.add('error');
                    input.dataset.selectedFromDropdown = 'false';
                    return;
                }
                
                input.classList.remove('error');
                input.dataset.selectedFromDropdown = 'true';
                input.setCustomValidity('');

                // Store the full address
                if (input.id === 'pickup-address') {
                    this.pickupAddress = place.formatted_address;
                } else if (input.id === 'dropoff-address') {
                    this.dropoffAddress = place.formatted_address;
                }

                // If both addresses are set, calculate distance
                if (this.pickupAddress && this.dropoffAddress) {
                    console.log('Both addresses set, calculating distance:', this.pickupAddress, this.dropoffAddress);
                    this.calculateDistance();
                }
            });

            // Add input event listener to enforce dropdown selection
            input.addEventListener('input', () => {
                input.dataset.selectedFromDropdown = 'false';
                input.setCustomValidity('Please select an address from the dropdown');
                input.classList.add('error');
            });

            // Add blur event listener to check if address was selected
            input.addEventListener('blur', () => {
                if (input.dataset.selectedFromDropdown !== 'true') {
                    input.setCustomValidity('Please select an address from the dropdown');
                    input.classList.add('error');
                }
            });
        });
      }
  
      async initializeMoneris() {
        try {
            const formData = this.collectFormData();
            const config = await this.fetchWithRetry(
                this.configEndpoint,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ total: formData.total })
                },
                3, 2000
            );
            this.monerisTicket = config.ticket;
            this.monerisMode = config.mode || 'prod';
        } catch (error) {
            console.error('Moneris init failed:', error);
            this.showError('Payment system unavailable—try later');
        }
      }
  
      setupFormListener() {
        const debounce = (fn, delay) => {
          let timeoutId;
          return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
          };
        };
        this.form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmit();
        });
        const handleInput = debounce((input) => {
          input.setCustomValidity('');
          input.classList.remove('error');
        }, 250);
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => input.addEventListener('input', () => handleInput(input)));
        const addressInputs = this.form.querySelectorAll('input[data-google-places="true"]');
        addressInputs.forEach(input => input.addEventListener('input', debounce(() => input.classList.remove('error'), 500)));
      }
  
      setupLoadingUI() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.innerHTML = '<div class="spinner"></div>';
        this.loadingOverlay.style.display = 'none';
        document.body.appendChild(this.loadingOverlay);
      }
  
      initializePayment() {
        const cityInput = this.form.querySelector('input[name="city"]');
        this.city = cityInput ? cityInput.value.toLowerCase() : 'calgary';

        if (!this.paymentConfig[this.city]) {
            this.paymentConfig[this.city] = {
                city: this.city,
                deliveryFee: this.baseFees[this.city] || 20.00,
                distanceSurcharge: 0,
                gstRate: 0.05
            };
        }

        this.elements = {
            ...this.elements,
            deliveryFeeDisplay: document.getElementById('delivery-fee-display'),
            gstDisplay: document.getElementById('gst-display'),
            tipDisplay: document.getElementById('tip-display'),
            totalDisplay: document.getElementById('total-display'),
            orderTotal: document.getElementById('order_total'),
            tipInput: document.getElementById('tip'),
            customTip: document.getElementById('custom-tip'),
            tipButtons: document.querySelectorAll('.tip-button')
        };

        this.elements.tipButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTipButton(e));
        });

        if (this.elements.customTip) {
            this.elements.customTip.addEventListener('input', (e) => this.handleCustomTip(e));
        }

        this.updateAmounts(0);
      }
  
      async handleSubmit() {
        try {
          this.showLoading(true);
          const formData = this.collectFormData();
          if (!this.validateFormData(formData)) return;
          if (!this.monerisTicket) await this.initializeMoneris();
          if (!this.monerisTicket) throw new Error('Payment system not initialized—try refreshing');
          sessionStorage.setItem('pendingOrder', JSON.stringify(formData));
          this.showMonerisIframe();
        } catch (error) {
          console.error('Form submission failed:', error);
          this.showError(error.message || 'Unable to process your request');
        } finally {
          this.showLoading(false);
        }
      }
  
      showMonerisIframe() {
        const overlay = document.createElement('div');
        overlay.id = 'monerisOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        overlay.style.cursor = 'pointer';
        document.body.appendChild(overlay);
  
        const outerDiv = document.createElement('div');
        outerDiv.id = 'outerDiv';
        outerDiv.style.width = '500px';
        outerDiv.style.height = '740px';
        outerDiv.style.position = 'fixed';
        outerDiv.style.top = '50%';
        outerDiv.style.left = '50%';
        outerDiv.style.transform = 'translate(-50%, -50%)';
        outerDiv.style.background = '#fff';
        outerDiv.style.border = '1px solid #ccc';
        outerDiv.style.zIndex = '1000';
        document.body.appendChild(outerDiv);
  
        const checkoutDiv = document.createElement('div');
        checkoutDiv.id = 'monerisCheckout';
        outerDiv.appendChild(checkoutDiv);
  
        const closeButton = document.createElement('button');
        closeButton.textContent = '✕';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '11px';
        closeButton.style.right = '10px';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.background = '#5E42A6';
        closeButton.style.color = '#5E42A6';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '18px';
        closeButton.style.lineHeight = '30px';
        closeButton.style.textAlign = 'center';
        closeButton.style.fontFamily = 'Arial, sans-serif';
        closeButton.style.zIndex = '1001';
        closeButton.style.fontWeight = 'bold';
        outerDiv.appendChild(closeButton);
  
        const cleanup = () => {
          if (document.body.contains(outerDiv)) document.body.removeChild(outerDiv);
          if (document.body.contains(overlay)) document.body.removeChild(overlay);
          this.showLoading(false);
        };
  
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            console.log('Overlay clicked—closing Moneris');
            cleanup();
          }
        });
  
        closeButton.addEventListener('click', () => {
          console.log('Close button clicked—closing Moneris');
          cleanup();
        });
  
        console.log('Checking MonerisCheckout');
        if (typeof window.monerisCheckout === 'undefined') {
          console.error('monerisCheckout not available—script not loaded');
          cleanup();
          this.handleMonerisFailure();
          return;
        }
  
        const myCheckout = new window.monerisCheckout();
        myCheckout.setMode(this.monerisMode);
        myCheckout.setCheckoutDiv('monerisCheckout');
        myCheckout.setCallback('page_loaded', () => {
          console.log('Moneris page loaded');
          this.showLoading(false);
        });
        myCheckout.setCallback('cancel_transaction', () => {
          console.log('Transaction cancelled');
          this.showError('Payment cancelled');
          cleanup();
        });
        myCheckout.setCallback('error_event', (error) => {
          console.error('Payment error:', error);
          cleanup();
          this.handleMonerisFailure();
        });
        myCheckout.setCallback('payment_complete', async (response) => {
          console.log('Payment successful:', response);
          this.showLoading(true);
          try {
            const orderData = JSON.parse(sessionStorage.getItem('pendingOrder'));
            await this.dispatchOrder(orderData);
            sessionStorage.removeItem('pendingOrder');
            const params = new URLSearchParams({
              pickup: orderData.pickupAddress,
              dropoff: orderData.dropoffAddress,
              total: orderData.total
            });
            window.location.href = `/delivery-success.html?${params}`;
          } catch (error) {
            this.showError('Order dispatch failed—contact support');
          } finally {
            cleanup();
          }
        });
        this.showLoading(true);
        myCheckout.startCheckout(this.monerisTicket);
      }
  
      handleMonerisFailure() {
        const message = 'Payment system unavailable. Please try:';
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'payment-fallback';
        fallbackDiv.innerHTML = `
          <h3>${message}</h3>
          <ul>
            <li>Refresh page</li>
            <li>Call <a href="tel:587-434-4794">587-434-4794</a></li>
            <li>Email <a href="mailto:support@expresscouriers.co">support@expresscouriers.co</a></li>
          </ul>
          <button onclick="window.location.reload()">Refresh</button>
        `;
        this.messageContainer.innerHTML = '';
        this.messageContainer.appendChild(fallbackDiv);
        this.messageContainer.scrollIntoView({ behavior: 'smooth' });
  
        const orderData = JSON.parse(sessionStorage.getItem('pendingOrder'));
        if (orderData) {
          const orderRef = new Date().getTime().toString(36);
          sessionStorage.setItem(`failed_order_${orderRef}`, JSON.stringify(orderData));
          console.log('Failed order reference:', orderRef);
        }
      }
  
      async dispatchOrder(orderData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            if (!response.ok) throw new Error(`Dispatch error! status: ${response.status}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Order dispatch failed');
            return result;
        } catch (error) {
            console.error('Dispatch failed:', error);
            throw error;
        }
      }
  
      collectFormData() {
        if (!this.form) throw new Error('Form not found');
        return {
          senderName: this.form.querySelector('#sender-name')?.value?.trim() || '',
          senderPhone: this.form.querySelector('#sender-phone')?.value?.trim() || '',
          senderEmail: this.form.querySelector('#sender-email')?.value?.trim() || '',
          pickupAddress: this.form.querySelector('#pickup-address')?.value?.trim() || '',
          receiverName: this.form.querySelector('#receiver-name')?.value?.trim() || '',
          receiverPhone: this.form.querySelector('#receiver-phone')?.value?.trim() || '',
          receiverEmail: this.form.querySelector('#receiver-email')?.value?.trim() || '',
          dropoffAddress: this.form.querySelector('#dropoff-address')?.value?.trim() || '',
          deliveryNotes: this.form.querySelector('#delivery-notes')?.value?.trim() || '',
          weight: this.form.querySelector('#weight')?.value?.trim() || '',
          city: this.form.querySelector('input[name="city"]')?.value?.trim() || 'calgary',
          subtotal: parseFloat(this.form.querySelector('input[name="delivery_fee"]')?.value || this.paymentConfig[this.city].deliveryFee),
          gst: parseFloat(this.form.querySelector('input[name="gst"]')?.value || this.GST),
          tip: parseFloat(this.form.querySelector('input[name="tip"]')?.value || this.elements.tipDisplay?.textContent || '0'),
          total: parseFloat(this.elements.totalDisplay?.textContent || this.BASE_TOTAL)
        };
      }
  
      validateFormData(formData) {
        let isValid = true;
        const requiredFields = [
          { id: 'sender-name', label: 'Sender Name' },
          { id: 'sender-phone', label: 'Sender Phone' },
          { id: 'pickup-address', label: 'Pickup Address' },
          { id: 'receiver-name', label: 'Receiver Name' },
          { id: 'receiver-phone', label: 'Receiver Phone' },
          { id: 'dropoff-address', label: 'Dropoff Address' }
        ];
        const requiredCheckboxes = [
          { id: 'terms', label: 'Terms of Service' },
          { id: 'value-confirm', label: 'Value Confirmation' }
        ];
  
        console.log('Form Data:', formData);
  
        // Check address fields were selected from dropdown
        const addressInputs = this.form.querySelectorAll('input[data-google-places="true"]');
        for (const input of addressInputs) {
            if (input.dataset.selectedFromDropdown !== 'true') {
                input.setCustomValidity('Please select an address from the dropdown');
                input.classList.add('error');
                input.reportValidity();
                return false;
            }
        }
  
        requiredFields.forEach(field => {
          const input = this.form.querySelector(`#${field.id}`);
          input.setCustomValidity('');
          input.classList.remove('error');
        });
  
        for (const checkbox of requiredCheckboxes) {
          const input = this.form.querySelector(`#${checkbox.id}`);
          if (!input.checked) {
            input.setCustomValidity(`Please accept ${checkbox.label}`);
            input.classList.add('error');
            input.reportValidity();
            return false;
          }
        }
  
        const fieldMap = {
          'sender-name': 'senderName',
          'sender-phone': 'senderPhone',
          'sender-email': 'senderEmail',
          'pickup-address': 'pickupAddress',
          'receiver-name': 'receiverName',
          'receiver-phone': 'receiverPhone',
          'dropoff-address': 'dropoffAddress'
        };
  
        for (const field of requiredFields) {
          const input = this.form.querySelector(`#${field.id}`);
          const formDataKey = fieldMap[field.id];
          const value = formData[formDataKey];
          if (!value) {
            input.setCustomValidity(`${field.label} required`);
            input.classList.add('error');
            input.reportValidity();
            isValid = false;
            break;
          }
        }
  
        if (isValid) {
          const phoneRegex = /^\+?[\d\s-()]{10,}$/;
          const phones = [
            { id: 'sender-phone', label: 'Sender Phone' },
            { id: 'receiver-phone', label: 'Receiver Phone' }
          ];
          for (const phone of phones) {
            const input = this.form.querySelector(`#${phone.id}`);
            if (!phoneRegex.test(input.value)) {
              input.setCustomValidity(`Valid ${phone.label} required`);
              input.classList.add('error');
              input.reportValidity();
              isValid = false;
              break;
            }
          }
        }
  
        return isValid;
      }
  
      handleTipButton(event) {
        this.elements.tipButtons.forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        if (this.elements.customTip) this.elements.customTip.value = '';
        const percentage = parseInt(event.target.dataset.percentage);
        const tipAmount = this.paymentConfig[this.city].deliveryFee * (percentage / 100);
        this.updateAmounts(tipAmount);
      }
  
      handleCustomTip(event) {
        this.elements.tipButtons.forEach(btn => btn.classList.remove('selected'));
        this.updateAmounts(event.target.value);
      }
  
      updateAmounts(tipAmount) {
        const tip = Number(tipAmount) || 0;
        const total = this.calculateTotal(tip);
        if (this.elements.tipDisplay) {
            this.elements.tipDisplay.textContent = tip.toFixed(2);
        }
        if (this.elements.totalDisplay) {
            if (this.hasCalculatedDistance) {
                this.elements.totalDisplay.textContent = total.toFixed(2);
            } else {
                this.elements.totalDisplay.textContent = 'TBD';
            }
        }
        if (this.elements.orderTotal) {
            this.elements.orderTotal.value = this.hasCalculatedDistance ? total.toFixed(2) : '0.00';
        }
        if (this.elements.tipInput) {
            this.elements.tipInput.value = tip.toFixed(2);
        }
      }
  
      calculateTotal(tip = 0) {
        const city = this.form.querySelector('input[name="city"]')?.value?.toLowerCase() || 'calgary';
        const config = this.paymentConfig[city];
        const subtotal = config.deliveryFee;
        const gst = subtotal * config.gstRate;
        return subtotal + gst + Number(tip);
      }
  
      isLongDistance() {
        return false; // No distance surcharge implemented
      }
  
      showLoading(isLoading) {
        this.loadingOverlay.style.display = isLoading ? 'block' : 'none';
      }
  
      showError(message) {
        this.messageContainer.innerHTML = message;
        this.messageContainer.className = 'error-message';
        this.messageContainer.scrollIntoView({ behavior: 'smooth' });
      }
  
      showSuccess(message) {
        this.messageContainer.innerHTML = message;
        this.messageContainer.className = 'success-message';
        this.messageContainer.scrollIntoView({ behavior: 'smooth' });
      }
  
      updateFeeDisplay() {
        const city = this.form.querySelector('input[name="city"]')?.value?.trim() || 'calgary';
        let config = this.paymentConfig[city];

        if (!config) {
            console.warn(`No payment config found for city: ${city}, using default`);
            config = { city, deliveryFee: this.baseFees[city] || 20.00, gstRate: 0.05 };
            this.paymentConfig[city] = config;
        }

        const deliveryFee = config.deliveryFee.toFixed(2);
        const gst = (config.deliveryFee * config.gstRate).toFixed(2);
        const tip = parseFloat(this.elements.tipDisplay?.textContent || '0');
        const total = (config.deliveryFee + config.deliveryFee * config.gstRate + tip).toFixed(2);

        console.log('Updating display:', { deliveryFee, gst, total });
        console.log('Element references:', {
            deliveryFeeDisplay: this.elements.deliveryFeeDisplay,
            gstDisplay: this.elements.gstDisplay,
            totalDisplay: this.elements.totalDisplay
        });

        // Only display fees if distance has been calculated
        if (this.hasCalculatedDistance) {
            if (this.elements.deliveryFeeDisplay) {
                this.elements.deliveryFeeDisplay.textContent = deliveryFee;
            } else {
                console.error('deliveryFeeDisplay element not found');
            }

            if (this.elements.gstDisplay) {
                this.elements.gstDisplay.textContent = gst;
            } else {
                console.error('gstDisplay element not found');
            }

            if (this.elements.totalDisplay) {
                this.elements.totalDisplay.textContent = total;
            } else {
                console.error('totalDisplay element not found');
            }
        } else {
            // Optionally, set placeholders or clear the fields
            if (this.elements.deliveryFeeDisplay) {
                this.elements.deliveryFeeDisplay.textContent = 'TBD';
            }
            if (this.elements.gstDisplay) {
                this.elements.gstDisplay.textContent = 'TBD';
            }
            if (this.elements.totalDisplay) {
                this.elements.totalDisplay.textContent = 'TBD';
            }
        }
      }

      // New method to fetch distance from server
      async calculateDistance() {
        if (!this.pickupAddress || !this.dropoffAddress) return;
        this.showLoading(true);
        try {
            const response = await fetch('https://api.expresscouriers.co/api/calculate-distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pickupAddress: this.pickupAddress,
                    dropoffAddress: this.dropoffAddress
                })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.distance) {
                this.distanceKm = data.distance;
                console.log(`Distance from server: ${this.distanceKm} km`);
                this.hasCalculatedDistance = true;
                this.updateAmounts(parseFloat(this.elements.tipDisplay?.textContent || '0'));
            } else {
                throw new Error('No distance returned');
            }
        } catch (error) {
            console.error('Distance fetch failed:', error.message);
            this.showError('Unable to calculate distance. Please try again.');
            this.distanceKm = 0;
            this.hasCalculatedDistance = true;
        } finally {
            this.showLoading(false);
        }
      }

      // Update fee based on distance
      updateDynamicFee() {
        const city = this.form.querySelector('input[name="city"]')?.value?.toLowerCase() || 'calgary';
        const baseFee = this.baseFees[city] || 20.00;
        const distanceCost = this.distanceKm * 0.40;
        const deliveryFee = baseFee + distanceCost;

        console.log(`Updating fee: base=${baseFee}, distance=${this.distanceKm}, cost=${distanceCost}, total=${deliveryFee}`);

        if (!this.paymentConfig[city]) {
            this.paymentConfig[city] = { city, deliveryFee, distanceSurcharge: 0, gstRate: 0.05 };
        } else {
            this.paymentConfig[city].deliveryFee = deliveryFee;
        }

        this.GST = deliveryFee * this.paymentConfig[city].gstRate;
        this.BASE_TOTAL = deliveryFee + this.GST;

        this.updateFeeDisplay();
      }
    }
  
    // Initialize the handler after DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.DeliveryFormHandlerInstance) {
            window.DeliveryFormHandlerInstance = new DeliveryFormHandler('delivery-form');
        }
    });
}