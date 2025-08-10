// SocialConnect London Landing Page JavaScript

// Configuration
const config = {
    // Initial waitlist count (you can update this manually)
    initialWaitlistCount: 247
};

// State management
let waitlistCount = config.initialWaitlistCount;

// DOM Elements
const waitlistCounters = document.querySelectorAll('#waitlistCount, #finalWaitlistCount');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupFormTimestamps();
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

// Set up form timestamps
function setupFormTimestamps() {
    // Add current timestamp to hidden fields
    const timestampFields = document.querySelectorAll('input[name="timestamp"], .timestamp');
    const currentTime = new Date().toISOString();

    timestampFields.forEach(field => {
        field.value = currentTime;
    });
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

    // Track form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
            trackEvent('email_signup_attempt', {
                form_id: form.id || 'unknown',
                form_location: form.closest('section')?.className || 'unknown'
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
        trackEvent,
        updateWaitlistCounters
    };
}
