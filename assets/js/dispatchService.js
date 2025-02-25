// Prevent redefinition
if (!window.DispatchService) {
    class DispatchService {
        constructor() {
            this.apiEndpoint = 'https://api.expresscouriers.co/api/delivery-orders';
            this.maxRetries = 3;
        }

        async dispatchOrder(orderData) {
            let attempts = 0;
            while (attempts < this.maxRetries) {
                try {
                    const response = await fetch(this.apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(orderData)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    return await response.json();
                } catch (error) {
                    attempts++;
                    if (attempts === this.maxRetries) {
                        throw new Error('Maximum retry attempts reached: ' + error.message);
                    }
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                }
            }
        }

        // Add future dispatch-related methods here
        async getOrderStatus(orderId) {
            // Implementation for checking order status
        }

        async cancelOrder(orderId) {
            // Implementation for canceling orders
        }
    }

    window.DispatchService = DispatchService;
}