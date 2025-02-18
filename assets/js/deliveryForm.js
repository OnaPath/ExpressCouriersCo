class DeliveryFormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.dispatchService = new DispatchService();
        this.setupFormListener();
        this.maxRetries = 3; // Maximum number of retry attempts
        this.setupLoadingUI();
    }

    setupFormListener() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    setupLoadingUI() {
        // Create loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">Processing your delivery request...</div>
        `;
        document.body.appendChild(this.loadingOverlay);

        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message-container';
        this.form.insertBefore(this.messageContainer, this.form.firstChild);
    }

    async handleSubmit() {
        let retryCount = 0;
        
        while (retryCount <= this.maxRetries) {
            try {
                this.showLoading(true);
                this.clearMessages();

                const formData = this.collectFormData();
                
                // Validate form data
                if (!this.validateFormData(formData)) {
                    throw new Error('Please fill in all required fields');
                }

                // Send to dispatch service
                const result = await this.dispatchService.createDelivery(formData);

                // Handle success
                this.showSuccess('Order received successfully!');
                setTimeout(() => {
                    window.location.href = '/delivery-success.html';
                }, 2000);
                
                return;

            } catch (error) {
                retryCount++;
                console.error('Delivery request attempt ${retryCount} failed:', error);

                if (retryCount <= this.maxRetries) {
                    // Show retry message
                    this.showError(`Connection issue. Retrying... (Attempt ${retryCount}/${this.maxRetries})`);
                    await this.delay(2000); // Wait 2 seconds before retrying
                } else {
                    // Show final error message
                    this.showError('Unable to process your request. Please try again later or contact support.');
                }
            } finally {
                this.showLoading(false);
            }
        }
    }

    collectFormData() {
        return {
            senderName: this.form.querySelector('[name="sender-name"]').value,
            senderPhone: this.form.querySelector('[name="sender-phone"]').value,
            pickupAddress: this.form.querySelector('[name="pickup-address"]').value,
            receiverName: this.form.querySelector('[name="receiver-name"]').value,
            receiverPhone: this.form.querySelector('[name="receiver-phone"]').value,
            dropoffAddress: this.form.querySelector('[name="dropoff-address"]').value,
            deliveryNotes: this.form.querySelector('[name="delivery-notes"]').value,
            weight: this.form.querySelector('[name="weight"]').value,
            subtotal: parseFloat(this.form.querySelector('.subtotal').textContent.replace(/[^0-9.]/g, '')),
            gst: parseFloat(this.form.querySelector('.gst').textContent.replace(/[^0-9.]/g, '')),
            tip: parseFloat(this.form.querySelector('#tip-display').textContent),
            total: parseFloat(this.form.querySelector('#total-display').textContent),
            city: this.form.querySelector('[name="city"]').value
        };
    }

    showLoading(isLoading) {
        this.loadingOverlay.style.display = isLoading ? 'flex' : 'none';
        const submitButton = this.form.querySelector('input[type="submit"]');
        submitButton.disabled = isLoading;
        submitButton.value = isLoading ? 'Processing...' : 'Submit Order';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error';
        errorDiv.textContent = message;
        this.messageContainer.appendChild(errorDiv);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message success';
        successDiv.textContent = message;
        this.messageContainer.appendChild(successDiv);
    }

    clearMessages() {
        this.messageContainer.innerHTML = '';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    validateFormData(formData) {
        // Check required fields
        const requiredFields = [
            'senderName', 'senderPhone', 'pickupAddress',
            'receiverName', 'receiverPhone', 'dropoffAddress',
            'weight'
        ];

        for (const field of requiredFields) {
            if (!formData[field]) {
                this.showError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return false;
            }
        }

        // Validate phone numbers
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.senderPhone)) {
            this.showError('Please enter a valid sender phone number');
            return false;
        }
        if (!phoneRegex.test(formData.receiverPhone)) {
            this.showError('Please enter a valid receiver phone number');
            return false;
        }

        // Validate weight
        const weight = parseFloat(formData.weight);
        if (isNaN(weight) || weight <= 0 || weight > 20) {
            this.showError('Weight must be between 0 and 20 kg');
            return false;
        }

        return true;
    }
} 