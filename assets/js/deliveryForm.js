if (!window.DeliveryFormHandler) {
    class DeliveryFormHandler {
      constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
          console.error(`Form with ID ${formId} not found`);
          return;
        }
        this.apiEndpoint = 'https://api.expresscouriers.co/api/delivery-orders';
        this.city = this.form.querySelector('input[name="city"]')?.value || 'Airdrie';
        this.monerisCheckoutId = null;
        this.monerisMode = null;
        
        // Setup UI elements first (synchronous)
        this.setupLoadingUI();
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message-container';
        this.form.appendChild(this.messageContainer);
        
        // Initialize Maps first, then setup form
        this.initializeGoogleMaps()
            .then(() => {
                console.log('Google Maps initialized successfully');
                this.setupFormListener();
            })
            .catch(error => {
                console.error('Maps initialization error:', error);
                // Still setup form even if Maps fails
                this.setupFormListener();
            });
      }
  
      async fetchWithRetry(url, options = {}, retries = 3, baseDelay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error; // Last retry failed
                
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
                if (i < retries - 1) {
                    console.debug(`Attempt ${i + 1} failed, retrying in ${Math.round(delay)}ms...`);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
      }
  
      async initializeMoneris() {
        try {
          const config = await this.fetchWithRetry(
            'https://api.expresscouriers.co/config/moneris',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: this.city })
            },
            3,  // 3 retries
            2000 // 2 second base delay for payment system
        );
        
        this.monerisCheckoutId = config.checkoutId;
        this.monerisMode = config.mode || 'prod';
      } catch (error) {
        console.error('Moneris init failed:', error);
        this.showError('Payment system unavailable—try later.');
      }
    }
  
    async initializeGoogleMaps() {
      try {
        const data = await this.fetchWithRetry('https://api.expresscouriers.co/config/maps-api-key');
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places&callback=initAutocomplete`;
            script.async = true;
            script.defer = true;
            
            // Define callback before loading script
            window.initAutocomplete = () => {
                console.log("Google Maps API loaded");
                this.setupAddressAutocomplete();
                resolve();
            };
            
            script.onerror = () => {
                console.error('Failed to load Google Maps');
                this.showError('Address lookup unavailable - please refresh the page');
                reject(new Error('Maps script load failed'));
            };
            
            document.head.appendChild(script);
        });
      } catch (error) {
        console.error('Maps initialization failed:', error);
        this.showError('Address lookup unavailable - please try again later');
        throw error;
      }
    }
  
    setupAddressAutocomplete() {
      const addressInputs = this.form.querySelectorAll('input[data-google-places="true"]');
      const city = this.city.toLowerCase();
      
      // Get bounds for the current city
      const cityBounds = window.CITY_BOUNDS[city];
      if (!cityBounds) {
          console.error(`No bounds defined for city: ${city}`);
          return;
      }

      // Create LatLngBounds object for the city
      const bounds = new google.maps.LatLngBounds(
          { lat: cityBounds.south, lng: cityBounds.west },
          { lat: cityBounds.north, lng: cityBounds.east }
      );

      addressInputs.forEach(input => {
          const autocomplete = new google.maps.places.Autocomplete(input, {
              componentRestrictions: { country: ['ca'] },
              bounds: bounds,
              strictBounds: true
          });
          
          // Set the city data attribute for validation
          input.dataset.city = city;
          
          // Bias results strongly to the bounds
          autocomplete.setBounds(bounds);
      });
    }
  
    setupFormListener() {
      // Debounce function
      const debounce = (fn, delay) => {
          let timeoutId;
          return (...args) => {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => fn(...args), delay);
          };
      };

      // Form submit handler (no debounce needed)
      this.form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmit();
      });

      // Debounced input validation
      const handleInput = debounce((input) => {
          input.setCustomValidity('');
          input.classList.remove('error');
      }, 250);

      // Setup input listeners
      const inputs = this.form.querySelectorAll('input[required]');
      inputs.forEach(input => {
          input.addEventListener('input', () => handleInput(input));
      });

      // Debounced address validation (if using custom validation)
      const addressInputs = this.form.querySelectorAll('input[data-google-places="true"]');
      addressInputs.forEach(input => {
          input.addEventListener('input', debounce(() => {
              // Any custom address validation logic here
              input.classList.remove('error');
          }, 500)); // Longer delay for address inputs
      });
    }
  
    setupLoadingUI() {
      this.loadingOverlay = document.createElement('div');
      this.loadingOverlay.className = 'loading-overlay';
      this.loadingOverlay.innerHTML = '<div class="spinner"></div>';
      this.loadingOverlay.style.display = 'none';
      document.body.appendChild(this.loadingOverlay);
    }
  
    async handleSubmit() {
      try {
        this.showLoading(true);
        const formData = this.collectFormData();
        if (!this.validateFormData(formData)) {
          return;
        }
        
        // Get Moneris config only when needed
        if (!this.monerisCheckoutId) {
          await this.initializeMoneris();
        }
        
        if (!this.monerisCheckoutId) {
          throw new Error('Payment system not initialized—try refreshing.');
        }
        
        sessionStorage.setItem('pendingOrder', JSON.stringify(formData));
        this.showMonerisIframe();
      } catch (error) {
        console.error('Form submission failed:', error);
        this.showError(error.message || 'Unable to process your request.');
      } finally {
        this.showLoading(false);
      }
    }
  
    showMonerisIframe() {
        // Add overlay
        const overlay = document.createElement('div');
        overlay.id = 'monerisOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // Add sized outer div and checkout div
        const outerDiv = document.createElement('div');
        outerDiv.id = 'outerDiv';
        outerDiv.style.width = '400px';
        outerDiv.style.height = '300px';
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

        // Load Moneris script with timeout
        const script = document.createElement('script');
        script.src = 'https://gateway.moneris.com/chktv2/request/request.php';
        script.async = true;

        // Cleanup function
        const cleanup = () => {
            if (document.body.contains(outerDiv)) document.body.removeChild(outerDiv);
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            this.showLoading(false);
        };

        // Script load timeout
        const timeoutId = setTimeout(() => {
            console.error('Moneris script load timeout');
            cleanup();
            this.handleMonerisFailure();
        }, 10000); // 10 second timeout

        script.onload = () => {
            clearTimeout(timeoutId);
            const myCheckout = new MonerisCheckout();
            myCheckout.setMode(this.monerisMode);
            myCheckout.setCheckoutDiv('monerisCheckout');

            myCheckout.setCallback('page_loaded', () => {
                console.log('Moneris page loaded');
                this.showLoading(false);
            });

            myCheckout.setCallback('cancel_transaction', () => {
                console.log('Transaction cancelled');
                this.showError('Payment cancelled.');
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
                    this.showError('Order dispatch failed—contact support.');
                } finally {
                    cleanup();
                }
            });

            this.showLoading(true);
            myCheckout.startCheckout(this.monerisCheckoutId);
        };

        script.onerror = () => {
            clearTimeout(timeoutId);
            cleanup();
            this.handleMonerisFailure();
        };

        document.body.appendChild(script);
    }

    handleMonerisFailure() {
        const message = 'Payment system unavailable. Please try one of these options:';
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'payment-fallback';
        fallbackDiv.innerHTML = `
            <h3>${message}</h3>
            <ul>
                <li>Try refreshing the page</li>
                <li>Call us at <a href="tel:587-434-4794">587-434-4794</a> to pay by phone</li>
                <li>Email us at <a href="mailto:support@expresscouriers.co">support@expresscouriers.co</a></li>
            </ul>
            <button onclick="window.location.reload()">Refresh Page</button>
        `;
        
        this.messageContainer.innerHTML = '';
        this.messageContainer.appendChild(fallbackDiv);
        this.messageContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Store order data for support reference
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
        dropoffAddress: this.form.querySelector('#dropoff-address')?.value?.trim() || '',
        deliveryNotes: this.form.querySelector('#delivery-notes')?.value?.trim() || '',
        weight: this.form.querySelector('#weight')?.value?.trim() || '',
        city: this.form.querySelector('input[name="city"]')?.value?.trim() || 'Airdrie',
        subtotal: parseFloat(this.form.querySelector('input[name="delivery_fee"]')?.value || '20.00'),
        gst: parseFloat(this.form.querySelector('input[name="gst"]')?.value || '1.00'),
        tip: parseFloat(this.form.querySelector('input[name="tip"]')?.value || document.getElementById('tip-display')?.textContent || '0'),
        total: parseFloat(document.getElementById('total-display')?.textContent || '21.00')
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

        // Reset all field validations first
        requiredFields.forEach(field => {
            const input = this.form.querySelector(`#${field.id}`);
            input.setCustomValidity('');
            input.classList.remove('error');
        });

        // Check required checkboxes first
        for (const checkbox of requiredCheckboxes) {
            const input = this.form.querySelector(`#${checkbox.id}`);
            if (!input.checked) {
                input.setCustomValidity(`Please accept the ${checkbox.label}`);
                input.classList.add('error');
                input.reportValidity();
                return false;
            }
        }

        // Validate required fields
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
                input.setCustomValidity(`${field.label} is required`);
                input.classList.add('error');
                input.reportValidity();
                isValid = false;
                break;
            }
        }

        // Phone number validation
        if (isValid) {
            const phoneRegex = /^\+?[\d\s-()]{10,}$/;
            const phones = [
                { id: 'sender-phone', label: 'Sender Phone' },
                { id: 'receiver-phone', label: 'Receiver Phone' }
            ];
            for (const phone of phones) {
                const input = this.form.querySelector(`#${phone.id}`);
                if (!phoneRegex.test(input.value)) {
                    input.setCustomValidity(`Please enter a valid ${phone.label} number`);
                    input.classList.add('error');
                    input.reportValidity();
                    isValid = false;
                    break;
                }
            }
        }

        return isValid;
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
  }
  window.DeliveryFormHandlerInstance = new DeliveryFormHandler('delivery-form');
}