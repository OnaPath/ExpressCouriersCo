class DispatchService {
    constructor() {
        // Use window.CONFIG for Google Places API
        this.googleApiKey = window.CONFIG ? window.CONFIG.GOOGLE_PLACES_API_KEY : null;
        
        // Default API settings
        this.apiUrl = 'https://api.example.com/deliveries';  // Replace with your actual API URL
        this.apiKey = 'your-default-api-key';  // Replace with your default API key
    }

    async createDelivery(deliveryDetails) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({
                    sender: {
                        name: deliveryDetails.senderName,
                        phone: deliveryDetails.senderPhone,
                        address: deliveryDetails.pickupAddress
                    },
                    receiver: {
                        name: deliveryDetails.receiverName,
                        phone: deliveryDetails.receiverPhone,
                        address: deliveryDetails.dropoffAddress
                    },
                    delivery: {
                        notes: deliveryDetails.deliveryNotes,
                        subtotal: deliveryDetails.subtotal,
                        gst: deliveryDetails.gst,
                        tip: deliveryDetails.tip,
                        total: deliveryDetails.total
                    },
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Delivery request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Dispatch error:', error);
            throw error;
        }
    }
} 