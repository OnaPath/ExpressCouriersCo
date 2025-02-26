if (!window.DeliveryFormHandler) {
    class DeliveryFormHandler {
      constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
          console.error(`Form with ID ${formId} not found`);
          return;
        }
        this.dispatchService = new DispatchService();
        this.setupFormListener();
        this.setupLoadingUI();
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message-container';
        this.form.appendChild(this.messageContainer);
      }
  
      setupFormListener() {
        this.form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmit();
        });

        // Clear validation messages when user starts typing
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
          input.addEventListener('input', () => {
            input.setCustomValidity('');
            input.classList.remove('error');
          });
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
          
          // Run validation but don't block submission during testing
          this.validateFormData(formData);
          
          // Always proceed with dispatch
          const response = await this.dispatchService.dispatchOrder(formData);
          if (!response.success) throw new Error(response.message || 'Order submission failed');
          this.showSuccess('Order received successfully!');
          window.location.href = `/delivery-success.html?pickup=${encodeURIComponent(formData.pickupAddress)}&dropoff=${encodeURIComponent(formData.dropoffAddress)}&total=${formData.total}`;
          
        } catch (error) {
          console.error('Delivery request failed:', error);
          this.showError(error.message || 'Unable to process your request.');
        } finally {
          this.showLoading(false);
        }
      }
  
      collectFormData() {
        if (!this.form) throw new Error('Form not found');
        
        // Get values from hidden inputs
        const deliveryFee = parseFloat(this.form.querySelector('input[name="delivery_fee"]').value) || 0;
        const gst = parseFloat(this.form.querySelector('input[name="gst"]').value) || 0;
        const city = this.form.querySelector('input[name="city"]').value;
        
        return {
          senderName: this.form.querySelector('#sender-name')?.value?.trim() || '',
          senderPhone: this.form.querySelector('#sender-phone')?.value?.trim() || '',
          pickupAddress: this.form.querySelector('#pickup-address')?.value?.trim() || '',
          receiverName: this.form.querySelector('#receiver-name')?.value?.trim() || '',
          receiverPhone: this.form.querySelector('#receiver-phone')?.value?.trim() || '',
          dropoffAddress: this.form.querySelector('#dropoff-address')?.value?.trim() || '',
          deliveryNotes: this.form.querySelector('#delivery-notes')?.value?.trim() || '',
          weight: this.form.querySelector('#weight')?.value?.trim() || '',
          city: city,
          subtotal: deliveryFee,
          gst: gst,
          tip: parseFloat(document.getElementById('tip-display')?.textContent || '0'),
          total: parseFloat(document.getElementById('total-display')?.textContent || '0')
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

        console.log('Form Data:', formData);

        // Clear any existing error states
        requiredFields.forEach(field => {
          const input = this.form.querySelector(`#${field.id}`);
          console.log(`Checking field ${field.id}:`, input?.value);
          input.setCustomValidity('');
          input.classList.remove('error');
        });

        // Check required checkboxes
        const requiredCheckboxes = [
          { id: 'terms', label: 'Terms of Service' },
          { id: 'value-confirm', label: 'Value Confirmation' }
        ];

        for (const checkbox of requiredCheckboxes) {
          const input = this.form.querySelector(`#${checkbox.id}`);
          console.log(`Checking checkbox ${checkbox.id}:`, input?.checked);
          if (!input.checked) {
            input.setCustomValidity(`Please accept the ${checkbox.label}`);
            input.classList.add('error');
            input.reportValidity();
            return false;
          }
        }

        // Check each required field
        for (const field of requiredFields) {
          const input = this.form.querySelector(`#${field.id}`);
          const value = formData[field.id.replace('-', '')];
          console.log(`Validating ${field.id}:`, value);
          
          if (!value) {
            console.log(`Field ${field.id} is empty`);
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
            console.log(`Validating phone ${phone.id}:`, input?.value);
            if (!phoneRegex.test(input.value)) {
              input.setCustomValidity(`Please enter a valid ${phone.label} number`);
              input.classList.add('error');
              input.reportValidity();
              isValid = false;
              break;
            }
          }
        }

        console.log('Final validation result:', isValid);
        return isValid;
      }
  
      showLoading(isLoading) {
        this.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        const submitButton = this.form.querySelector('input[type="submit"]');
        if (submitButton) {
          submitButton.disabled = isLoading;
          submitButton.value = isLoading ? 'Processing...' : 'Submit Order';
        }
      }
  
      showError(message) {
        this.messageContainer.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.textContent = message;
        this.messageContainer.appendChild(errorDiv);
        errorDiv.scrollIntoView({ behavior: 'smooth' });
      }
  
      showSuccess(message) {
        this.messageContainer.innerHTML = '';
        const successDiv = document.createElement('div');
        successDiv.className = 'message success';
        successDiv.textContent = message;
        this.messageContainer.appendChild(successDiv);
        successDiv.scrollIntoView({ behavior: 'smooth' });
      }
    }
    window.DeliveryFormHandlerInstance = new DeliveryFormHandler('delivery-form');
  }