// Prevent redefinition
if (!window.CITY_BOUNDS) {
    window.CITY_BOUNDS = {
        'calgary': {
            north: 51.2,
            south: 50.8,
            east: -113.9,
            west: -114.3
        },
        'airdrie': {
            north: 51.3,
            south: 51.2,
            east: -113.9,
            west: -114.1
        },
        'lethbridge': {
            north: 49.7,
            south: 49.6,
            east: -112.7,
            west: -112.9
        }
    };
}

function initAutocomplete() {
    const addressInputs = document.querySelectorAll('input[name="pickup-address"], input[name="dropoff-address"]');
    
    addressInputs.forEach(input => {
        const city = input.dataset.city;
        const autocomplete = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'ca' },
            bounds: getCityBounds(city),
            strictBounds: true
        });
        
        autocomplete.addListener('place_changed', () => validateAddress(autocomplete, input));
    });
}

function getCityBounds(city) {
    const bounds = {
        'calgary': {
            north: 51.2,
            south: 50.8,
            east: -113.9,
            west: -114.3
        },
        'airdrie': {
            north: 51.3,
            south: 51.2,
            east: -113.9,
            west: -114.1
        }
        // ... other cities
    };
    
    const cityBounds = bounds[city.toLowerCase()];
    return new google.maps.LatLngBounds(
        { lat: cityBounds.south, lng: cityBounds.west },
        { lat: cityBounds.north, lng: cityBounds.east }
    );
}

function validateAddress(autocomplete, type) {
    console.log('validateAddress called:', { type });
    const place = autocomplete.getPlace();
    
    // Allow manual entry by removing the dropdown requirement
    if (!place.geometry) {
        return true; // Allow any input
    }

    // Keep the city bounds check but make it a warning instead of an error
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const city = document.querySelector('input[name="city"]').value.toLowerCase();
    const cityConfig = CITY_BOUNDS[city];

    if (lat < cityConfig.bounds.south || lat > cityConfig.bounds.north ||
        lng < cityConfig.bounds.west || lng > cityConfig.bounds.east) {
        console.warn(`Address outside ${city} bounds, but allowing it for testing`);
    }

    return true;
}

// Add input event listeners to prevent manual entry
document.addEventListener('DOMContentLoaded', function() {
    const addressInputs = document.querySelectorAll('input[data-google-places]');
    
    addressInputs.forEach(input => {
        // Comment out or remove the validation for manual entry
        /*
        input.addEventListener('input', function() {
            if (this.dataset.selectedFromDropdown === 'true') {
                lastValidValue = this.value;
                return;
            }
            
            this.setCustomValidity('Please select an address from the dropdown list');
            this.reportValidity();
        });
        */
        
        // Keep the place_changed event for when they do use the dropdown
        input.addEventListener('place_changed', function() {
            this.dataset.selectedFromDropdown = 'true';
            this.setCustomValidity('');
        });
        
        // Remove or comment out paste prevention
        /*
        input.addEventListener('paste', function(e) {
            e.preventDefault();
        });
        */
    });
}); 