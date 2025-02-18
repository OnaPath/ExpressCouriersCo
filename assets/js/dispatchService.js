class DispatchService {
    constructor() {
        this.apiUrl = CONFIG.API_URL;
        this.apiKey = CONFIG.API_KEY;
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