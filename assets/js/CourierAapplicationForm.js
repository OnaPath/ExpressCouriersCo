document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('courier-application-form');
    const submitButton = form.querySelector('input[type="submit"]');
    const popup = document.getElementById('success-popup');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitApplication();
    });

    function submitApplication() {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.value = 'Submitting...';

        // Simulate API call with setTimeout
        setTimeout(() => {
            showPopup();
            form.reset();
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.value = 'Submit Application';
        }, 1000);
    }

    function showPopup() {
        popup.style.display = 'block';
    }

    function showFeedback(message, type) {
        // Remove any existing feedback
        const existingFeedback = document.querySelector('.feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create and insert feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        form.insertAdjacentElement('beforebegin', feedbackElement);

        // Remove feedback after 5 seconds
        setTimeout(() => {
            feedbackElement.remove();
        }, 5000);
    }
});

function closePopup() {
    document.getElementById('success-popup').style.display = 'none';
}
