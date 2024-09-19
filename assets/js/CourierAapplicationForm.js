document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('courier-application-form');
    const submitButton = form.querySelector('input[type="submit"]');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        submitApplication();
    });

    function submitApplication() {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.value = 'Submitting...';

        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Send data to API
        fetch('https://api.expresscouriers.co/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showFeedback('Application submitted successfully! We'll be in touch soon.', 'success');
                form.reset();
            } else {
                showFeedback('There was an error submitting your application. Please try again.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showFeedback('An unexpected error occurred. Please try again later.', 'error');
        })
        .finally(() => {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.value = 'Submit Application';
        });
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
