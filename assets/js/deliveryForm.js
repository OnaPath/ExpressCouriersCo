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
        try {
            this.showLoading(true);
            const formData = this.collectFormData();
            
            // Update to match your server's endpoint
            const response = await fetch('https://api.expresscouriers.co:3001/api/delivery-orders', {
                method: 'POST',  // Note: GET request won't work here
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Server error processing order');
            }

            // Handle success
            this.showSuccess('Order received successfully!');
            setTimeout(() => {
                window.location.href = '/delivery-success.html';
            }, 2000);
            
            return;
        } catch (error) {
            console.error('Delivery request failed:', error);
            this.showError('Unable to process your request. Please try again later or contact support.');
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        // Add null checks and default values
        const form = this.form;
        if (!form) {
            throw new Error('Form not found');
        }

        return {
            senderName: form.querySelector('#sender-name')?.value || '',
            senderPhone: form.querySelector('#sender-phone')?.value || '',
            pickupAddress: form.querySelector('#pickup-address')?.value || '',
            receiverName: form.querySelector('#receiver-name')?.value || '',
            receiverPhone: form.querySelector('#receiver-phone')?.value || '',
            dropoffAddress: form.querySelector('#dropoff-address')?.value || '',
            deliveryNotes: form.querySelector('#delivery-notes')?.value || '',
            weight: form.querySelector('#weight')?.value || '',
            subtotal: DELIVERY_FEE, // Use constant from AirdrieDelivery.html
            gst: GST, // Use constant from AirdrieDelivery.html
            tip: parseFloat(document.getElementById('tip-display')?.textContent || '0'),
            total: parseFloat(document.getElementById('total-display')?.textContent || '0'),
            city: 'Airdrie' // Hardcoded for AirdrieDelivery.html
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