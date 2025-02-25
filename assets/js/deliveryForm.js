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
            throw new Error('Please fill in all required fields');
          }
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
        return {
          senderName: this.form.querySelector('#sender-name')?.value?.trim() || '',
          senderPhone: this.form.querySelector('#sender-phone')?.value?.trim() || '',
          pickupAddress: this.form.querySelector('#pickup-address')?.value?.trim() || '',
          receiverName: this.form.querySelector('#receiver-name')?.value?.trim() || '',
          receiverPhone: this.form.querySelector('#receiver-phone')?.value?.trim() || '',
          dropoffAddress: this.form.querySelector('#dropoff-address')?.value?.trim() || '',
          deliveryNotes: this.form.querySelector('#delivery-notes')?.value?.trim() || '',
          weight: this.form.querySelector('#weight')?.value?.trim() || '',
          city: 'Airdrie', // Hardcoded for AirdrieDelivery.html
          subtotal: DELIVERY_FEE,
          gst: GST,
          tip: parseFloat(document.getElementById('tip-display')?.textContent || '0'),
          total: parseFloat(document.getElementById('total-display')?.textContent || '0')
        };
      }
  
      validateFormData(formData) {
        const requiredFields = [
          'senderName', 'senderPhone', 'pickupAddress',
          'receiverName', 'receiverPhone', 'dropoffAddress'
        ];
        for (const field of requiredFields) {
          if (!formData[field]) {
            this.showError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            return false;
          }
        }
        const phoneRegex = /^\+?[\d\s-()]{10,}$/;
        if (!phoneRegex.test(formData.senderPhone) || !phoneRegex.test(formData.receiverPhone)) {
          this.showError('Please enter valid phone numbers');
          return false;
        }
        return true;
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