if (!window.DispatchService) {
    class DispatchService {
        constructor() {
            this.apiEndpoint = 'https://api.expresscouriers.co/api/delivery-orders';
        }
        
        async dispatchOrder(orderData) {
            // For testing, just make a single attempt
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        }
    }
    window.DispatchService = DispatchService;
}