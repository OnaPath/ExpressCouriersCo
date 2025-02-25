// Prevent redefinition
if (!window.DeliveryFormHandler) {
    class DeliveryFormHandler {
        constructor(formId) {
            this.form = document.getElementById(formId);
            this.dispatchService = new DispatchService();
            this.setupFormListener();
            this.maxRetries = 3;
            this.setupLoadingUI();
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
            this.loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message">Processing your delivery request...</div>
            `;
            document.body.appendChild(this.loadingOverlay);

            this.messageContainer = document.createElement('div');
            this.messageContainer.className = 'message-container';
            this.form.insertBefore(this.messageContainer, this.form.firstChild);
        }

        async handleSubmit() {
            try {
                this.showLoading(true);
                const formData = this.collectFormData();

                const response = await fetch('https://api.expresscouriers.co/api/delivery-orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    throw new Error('Server error processing order');
                }

                this.showSuccess('Order received successfully!');
                setTimeout(() => {
                    window.location.href = '/delivery-success.html';
                }, 2000);
            } catch (error) {
                console.error('Delivery request failed:', error);
                this.showError('Unable to process your request. Please try again later or contact support.');
            } finally {
                this.showLoading(false);
            }
        }

        collectFormData() {
            if (!this.form) throw new Error('Form not found');
            return {
                senderName: this.form.querySelector('#sender-name')?.value || '',
                senderPhone: this.form.querySelector('#sender-phone')?.value || '',
                pickupAddress: this.form.querySelector('#pickup-address')?.value || '',
                receiverName: this.form.querySelector('#receiver-name')?.value || '',
                receiverPhone: this.form.querySelector('#receiver-phone')?.value || '',
                dropoffAddress: this.form.querySelector('#dropoff-address')?.value || '',
                deliveryNotes: this.form.querySelector('#delivery-notes')?.value || '',
                weight: this.form.querySelector('#weight')?.value || '',
                subtotal: DELIVERY_FEE,
                gst: GST,
                tip: parseFloat(document.getElementById('tip-display')?.textContent || '0'),
                total: parseFloat(document.getElementById('total-display')?.textContent || '0'),
                city: 'Airdrie'
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

        // Keep your validateFormData and delay methods as-is
    }
    window.DeliveryFormHandler = DeliveryFormHandler;
}