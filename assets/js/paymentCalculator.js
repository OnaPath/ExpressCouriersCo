class PaymentCalculator {
    constructor(cityConfig = {}) {
        // Default values if no config provided
        this.config = {
            city: cityConfig.city || 'calgary',
            deliveryFee: cityConfig.deliveryFee || 20.00,
            distanceSurcharge: cityConfig.distanceSurcharge || 0,
            rushHourFee: cityConfig.rushHourFee || 0,
            gstRate: 0.05
        };

        // Calculate initial GST and base total
        this.GST = this.config.deliveryFee * this.config.gstRate;
        this.BASE_TOTAL = this.config.deliveryFee + this.GST;

        // Cache DOM elements
        this.elements = {
            tipDisplay: document.getElementById('tip-display'),
            totalDisplay: document.getElementById('total-display'),
            orderTotal: document.getElementById('order_total'),
            tipInput: document.getElementById('tip'),
            customTip: document.getElementById('custom-tip'),
            tipButtons: document.querySelectorAll('.tip-button')
        };

        this.initializeListeners();
        this.updateAmounts(0);
    }

    // Update all display amounts
    updateAmounts(tipAmount) {
        const tip = Number(tipAmount) || 0;
        const total = this.calculateTotal(tip);
        
        // Update displays
        if (this.elements.tipDisplay) {
            this.elements.tipDisplay.textContent = tip.toFixed(2);
        }
        if (this.elements.totalDisplay) {
            this.elements.totalDisplay.textContent = total.toFixed(2);
        }
        
        // Update hidden form values
        if (this.elements.orderTotal) {
            this.elements.orderTotal.value = total.toFixed(2);
        }
        if (this.elements.tipInput) {
            this.elements.tipInput.value = tip.toFixed(2);
        }
    }

    // Calculate total including any surcharges
    calculateTotal(tip = 0) {
        let subtotal = this.config.deliveryFee;

        // Add any applicable surcharges
        if (this.isLongDistance()) {
            subtotal += this.config.distanceSurcharge;
        }
        if (this.isRushHour()) {
            subtotal += this.config.rushHourFee;
        }

        // Calculate GST on subtotal
        const gst = subtotal * this.config.gstRate;

        // Return total with tip
        return subtotal + gst + Number(tip);
    }

    // Check if delivery is during rush hour (4-6 PM weekdays)
    isRushHour() {
        const now = new Date();
        const hour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        return isWeekday && hour >= 16 && hour < 18;
    }

    // Check if delivery distance requires surcharge
    // This would need to be implemented based on your specific requirements
    isLongDistance() {
        // Implementation would go here
        // Could use Google Maps Distance Matrix API
        return false;
    }

    // Handle tip button clicks
    handleTipButton(event) {
        // Remove selected class from all buttons
        this.elements.tipButtons.forEach(btn => 
            btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        event.target.classList.add('selected');

        // Clear custom tip input
        if (this.elements.customTip) {
            this.elements.customTip.value = '';
        }

        // Calculate and update tip
        const percentage = parseInt(event.target.dataset.percentage);
        const tipAmount = this.config.deliveryFee * (percentage / 100);
        this.updateAmounts(tipAmount);
    }

    // Handle custom tip input
    handleCustomTip(event) {
        // Remove selected class from all tip buttons
        this.elements.tipButtons.forEach(btn => 
            btn.classList.remove('selected'));
        
        // Update amounts with custom tip
        this.updateAmounts(event.target.value);
    }

    // Initialize event listeners
    initializeListeners() {
        // Tip button handlers
        this.elements.tipButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTipButton(e));
        });

        // Custom tip handler
        if (this.elements.customTip) {
            this.elements.customTip.addEventListener('input', (e) => 
                this.handleCustomTip(e));
        }
    }
}

// Usage in your HTML:
document.addEventListener('DOMContentLoaded', function() {
    // City-specific configurations
    const cityConfigs = {
        calgary: {
            city: 'calgary',
            deliveryFee: 20.00,
            distanceSurcharge: 5.00,  // Example: $5 for deliveries beyond city center
            rushHourFee: 2.50         // Example: $2.50 during rush hour
        },
        airdrie: {
            city: 'airdrie',
            deliveryFee: 21.00,
            distanceSurcharge: 0,
            rushHourFee: 0
        },
        lethbridge: {
            city: 'lethbridge',
            deliveryFee: 20.00,
            distanceSurcharge: 0,
            rushHourFee: 0
        }
    };

    // Get city from hidden input or data attribute
    const cityInput = document.querySelector('input[name="city"]');
    const city = cityInput ? cityInput.value : 'calgary';

    // Initialize calculator with city-specific config
    const calculator = new PaymentCalculator(cityConfigs[city]);
});