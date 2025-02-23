// City boundaries
const CITY_BOUNDS = {
    airdrie: {
        center: { lat: 51.2927, lng: -114.0134 },
        bounds: {
            north: 51.3227,
            south: 51.2627,
            east: -113.9834,
            west: -114.0434
        }
    },
    calgary: {
        center: { lat: 51.0447, lng: -114.0719 },
        bounds: {
            north: 51.2000,
            south: 50.8500,
            east: -113.8500,
            west: -114.2900
        }
    },
    lethbridge: {
        center: { lat: 49.6956, lng: -112.8451 },
        bounds: {
            north: 49.7500,
            south: 49.6500,
            east: -112.7500,
            west: -112.9500
        }
    }
};

function initAutocomplete() {
    console.log('initAutocomplete called');
    const cityInput = document.querySelector('input[name="city"]');
    console.log('City input found:', cityInput);
    const city = cityInput ? cityInput.value.toLowerCase() : '';
    console.log('City value:', city);
    
    const cityConfig = CITY_BOUNDS[city];
    console.log('City config:', cityConfig);
    
    if (!cityConfig) {
        console.error('No city config found for:', city);
        return;
    }

    const options = {
        bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(cityConfig.bounds.south, cityConfig.bounds.west),
            new google.maps.LatLng(cityConfig.bounds.north, cityConfig.bounds.east)
        ),
        componentRestrictions: { country: 'ca' },
        fields: ['address_components', 'geometry', 'formatted_address'],
        strictBounds: true
    };
    console.log('Autocomplete options:', options);

    // Initialize autocomplete for both address fields
    const pickupInput = document.querySelector('input[name="pickup-address"]');
    const dropoffInput = document.querySelector('input[name="dropoff-address"]');
    console.log('Found inputs:', { pickup: pickupInput, dropoff: dropoffInput });

    if (!pickupInput || !dropoffInput) {
        console.error('Address inputs not found:', { pickup: pickupInput, dropoff: dropoffInput });
        return;
    }

    const pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
    const dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);

    // Add validation listeners
    pickupAutocomplete.addListener('place_changed', () => validateAddress(pickupAutocomplete, 'pickup'));
    dropoffAutocomplete.addListener('place_changed', () => validateAddress(dropoffAutocomplete, 'dropoff'));
}

function validateAddress(autocomplete, type) {
    console.log('validateAddress called:', { type });
    const place = autocomplete.getPlace();
    const city = document.querySelector('input[name="city"]').value.toLowerCase();
    
    if (!place.geometry) {
        const input = document.querySelector(`input[name="${type}-address"]`);
        input.setCustomValidity('Please select an address from the dropdown list');
        input.reportValidity();
        return false;
    }

    // Check if address is within city bounds
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const cityConfig = CITY_BOUNDS[city];

    if (lat < cityConfig.bounds.south || lat > cityConfig.bounds.north ||
        lng < cityConfig.bounds.west || lng > cityConfig.bounds.east) {
        const input = document.querySelector(`input[name="${type}-address"]`);
        input.setCustomValidity(`Please select an address within ${city.charAt(0).toUpperCase() + city.slice(1)}`);
        input.reportValidity();
        return false;
    }

    // Clear any previous validation messages
    const input = document.querySelector(`input[name="${type}-address"]`);
    input.setCustomValidity('');

    return true;
}

// Add input event listeners to prevent manual entry
document.addEventListener('DOMContentLoaded', function() {
    const addressInputs = document.querySelectorAll('input[data-google-places]');
    
    addressInputs.forEach(input => {
        // Store the last valid value
        let lastValidValue = '';
        
        input.addEventListener('input', function() {
            // If the value was changed by selecting from dropdown, it's valid
            if (this.dataset.selectedFromDropdown === 'true') {
                lastValidValue = this.value;
                return;
            }
            
            // If manually typed, show validation message
            this.setCustomValidity('Please select an address from the dropdown list');
            this.reportValidity();
        });
        
        // When a place is selected from dropdown
        input.addEventListener('place_changed', function() {
            this.dataset.selectedFromDropdown = 'true';
            this.setCustomValidity('');
        });
        
        // Prevent paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
        });
    });
}); 