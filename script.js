// SocialConnect London Landing Page JavaScript

// Configuration
const config = {
    // Update this with your actual email endpoint or service
    emailEndpoint: 'YOUR_EMAIL_ENDPOINT_HERE', // You'll replace this

    // Netlify Forms (alternative - just add name="waitlist" to your forms)
    useNetlifyForms: true,

    // Email validation regex
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Initial waitlist count (you can update this manually)
    initialWaitlistCount: 247
};

// State management
let waitlistCount = config.initialWaitlistCount;

// DOM Elements
const waitlistForms = document.querySelectorAll('#waitlistForm, #finalWaitlistForm');
const emailInputs = document.querySelectorAll('.email-input');
const waitlistCounters = document.querySelectorAll('#waitlistCount, #finalWaitlistCount');
const successMessage = document.getElementById('successMessage');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupFormHandlers();
    setupAnalytics();
    animateCounters();
});

// Page initialization
function initializePage() {
    // Update waitlist counters
    updateWaitlistCounters();

    // Add smooth scrolling for any anchor links
    setupSmoothScrolling();

    // Initialize intersection observer for animations
    setupScrollAnimations();

    // Track page view
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });
}

// Form handling
function setupFormHandlers() {
    waitlistForms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });

    // Real-time email validation
    emailInputs.forEach(input => {
        input.addEventListener('blur', validateEmail);
        input.addEventListener('input', clearValidationError);
    });
}

// Handle form submissions
async function handleFormSubmission(event) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('.email-input');
    const submitButton = form.querySelector('.cta-button');
    const email = emailInput.value.trim();

    // Validate email
    if (!validateEmailInput(emailInput)) {
        return;
    }

    // Show loading state
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = 'Joining...';
    submitButton.disabled = true;

    try {
        // Submit email
        const success = await submitEmail(email, form);

        if (success) {
            // Show success state
            showSuccessMessage(form);
            incrementWaitlistCount();

            // Track conversion
            trackEvent('email_signup', {
                email: email,
                form_location: form.id || 'unknown'
            });

            // Clear form
            emailInput.value = '';

        } else {
            throw new Error('Submission failed');
        }

    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage(form, 'Something went wrong. Please try again.');

        // Track error
        trackEvent('email_signup_error', {
            error: error.message,
            form_location: form.id || 'unknown'
        });
    }

    // Reset button
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
}

// Submit email to backend/service
async function submitEmail(email, form) {
    // Option 1: Netlify Forms (easiest)
    if (config.useNetlifyForms) {
        return await submitToNetlify(email, form);
    }

    // Option 2: Custom endpoint
    if (config.emailEndpoint && config.emailEndpoint !== 'YOUR_EMAIL_ENDPOINT_HERE') {
        return await submitToCustomEndpoint(email);
    }

    // Option 3: Local storage (for testing)
    return submitToLocalStorage(email);
}

// Netlify Forms submission
async function submitToNetlify(email, form) {
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('form-name', 'waitlist');
        formData.append('page', 'landing');
        formData.append('timestamp', new Date().toISOString());

        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });

        return response.ok;
    } catch (error) {
        console.error('Netlify submission error:', error);
        return false;
    }
}

// Custom endpoint submission
async function submitToCustomEndpoint(email) {
    try {
        const response = await fetch(config.emailEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                source: 'london_landing',
                timestamp: new Date().toISOString()
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Custom endpoint error:', error);
        return false;
    }
}

// Local storage submission (for testing)
function submitToLocalStorage(email) {
    try {
        const existingEmails = JSON.parse(localStorage.getItem('socialconnect_emails') || '[]');

        // Check for duplicates
        if (existingEmails.includes(email)) {
            throw new Error('Email already registered');
        }

        existingEmails.push(email);
        localStorage.setItem('socialconnect_emails', JSON.stringify(existingEmails));

        console.log('Email saved to localStorage:', email);
        return true;
    } catch (error) {
        console.error('LocalStorage error:', error);
        return false;
    }
}

// Email validation
function validateEmailInput(input) {
    const email = input.value.trim();

    if (!email) {
        showValidationError(input, 'Please enter your email address');
        return false;
    }

    if (!config.emailRegex.test(email)) {
        showValidationError(input, 'Please enter a valid email address');
        return false;
    }

    clearValidationError(input);
    return true;
}

function validateEmail(event) {
    validateEmailInput(event.target);
}

function showValidationError(input, message) {
    clearValidationError(input);

    input.style.borderColor = '#EF4444';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = 'color: #EF4444; font-size: 0.875rem; margin-top: 0.5rem;';
    errorDiv.textContent = message;

    input.parentNode.appendChild(errorDiv);
}

function clearValidationError(input) {
    const errorDiv = input.parentNode.querySelector('.validation-error');
    if (errorDiv) {
        errorDiv.remove();
    }
    input.style.borderColor = '';
}

// Success/Error messages
function showSuccessMessage(form) {
    if (form.id === 'waitlistForm' && successMessage) {
        // Hide form and show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';

        // Scroll to success message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        // Show inline success for bottom form
        showInlineMessage(form, 'You\'re on the list! 🎉', 'success');
    }
}

function showErrorMessage(form, message) {
    showInlineMessage(form, message, 'error');
}

function showInlineMessage(form, message, type) {
    clearInlineMessage(form);

    const messageDiv = document.createElement('div');
    messageDiv.className = `inline-message ${type}`;
    messageDiv.style.cssText = `
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        font-size: 0.875rem;
        text-align: center;
        ${type === 'success'
            ? 'background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0;'
            : 'background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;'
        }
    `;
    messageDiv.textContent = message;

    form.appendChild(messageDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => clearInlineMessage(form), 5000);
}

function clearInlineMessage(form) {
    const existingMessage = form.querySelector('.inline-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Waitlist counter management
function updateWaitlistCounters() {
    waitlistCounters.forEach(counter => {
        counter.textContent = waitlistCount.toLocaleString();
    });
}

function incrementWaitlistCount() {
    waitlistCount++;
    updateWaitlistCounters();

    // Save to localStorage
    localStorage.setItem('socialconnect_waitlist_count', waitlistCount.toString());
}

function animateCounters() {
    // Animate numbers counting up on page load
    waitlistCounters.forEach(counter => {
        const finalCount = parseInt(counter.textContent.replace(/,/g, ''));
        let currentCount = Math.max(0, finalCount - 20);

        const increment = () => {
            if (currentCount < finalCount) {
                currentCount++;
                counter.textContent = currentCount.toLocaleString();
                setTimeout(increment, 50);
            }
        };

        // Start animation after a short delay
        setTimeout(increment, 1000);
    });
}

// Smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate elements as they come into view
    document.querySelectorAll('.problem-card, .solution-card, .step, .testimonial').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Analytics and tracking
function setupAnalytics() {
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;

            // Track 25%, 50%, 75%, 100% scroll milestones
            if (maxScroll >= 25 && maxScroll < 50 && !window.tracked25) {
                trackEvent('scroll_depth', { depth: '25%' });
                window.tracked25 = true;
            } else if (maxScroll >= 50 && maxScroll < 75 && !window.tracked50) {
                trackEvent('scroll_depth', { depth: '50%' });
                window.tracked50 = true;
            } else if (maxScroll >= 75 && maxScroll < 100 && !window.tracked75) {
                trackEvent('scroll_depth', { depth: '75%' });
                window.tracked75 = true;
            } else if (maxScroll >= 100 && !window.tracked100) {
                trackEvent('scroll_depth', { depth: '100%' });
                window.tracked100 = true;
            }
        }
    });

    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        trackEvent('time_on_page', { seconds: timeOnPage });
    });

    // Track clicks on CTA buttons
    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('click', () => {
            trackEvent('cta_click', {
                button_text: button.textContent.trim(),
                button_location: button.closest('section')?.className || 'unknown'
            });
        });
    });
}

// Generic event tracking
function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }

    // Facebook Pixel (if you add it later)
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
    }

    // Console log for debugging
    console.log('Event tracked:', eventName, parameters);

    // Custom analytics endpoint (if you have one)
    if (window.customAnalytics) {
        window.customAnalytics.track(eventName, parameters);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error handling
window.addEventListener('error', (event) => {
    trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmailInput,
        submitEmail,
        trackEvent
    };
}
