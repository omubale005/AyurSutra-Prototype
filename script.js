// Global state management
let currentScreen = 'landing';
let currentUser = null;
let currentUserType = '';
let isLogin = true;
let currentSlide = 0;
let slideInterval;
let chatIsOpen = false;
let isTyping = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    showLanding();
    createParticles();
    startCarousel();
    initializeForms();
    setMinDate();
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function showLanding() {
    showScreen('landingPage');
    currentUser = null;
    currentUserType = '';
}

function showAuth(userType) {
    currentUserType = userType;
    showScreen('authPage');
    setupAuthForm(userType);
}

function showDashboard(userType) {
    const dashboards = {
        'patient': 'patientDashboard',
        'doctor': 'doctorDashboard',
        'admin': 'adminDashboard'
    };
    
    showScreen(dashboards[userType]);
    updateUserInfo();
}

// Authentication setup
function setupAuthForm(userType) {
    const configs = {
        'patient': {
            title: '🌿 Patient Portal',
            subtitle: 'Book your Ayurvedic consultation',
            bgClass: 'patient-auth'
        },
        'doctor': {
            title: '👨‍⚕️ Doctor Portal',
            subtitle: 'Manage your practice',
            bgClass: 'doctor-auth'
        },
        'admin': {
            title: '🛡️ Admin Panel',
            subtitle: 'System administration',
            bgClass: 'admin-auth'
        }
    };
    
    const config = configs[userType];
    document.getElementById('authTitle').textContent = config.title;
    document.getElementById('authSubtitle').textContent = config.subtitle;
    
    // Reset form
    document.getElementById('authForm').reset();
    document.getElementById('errorMessage').style.display = 'none';
    
    // Show/hide fields based on user type and mode
    updateAuthFields();
    
    // Set admin password placeholder
    if (userType === 'admin') {
        document.getElementById('password').placeholder = 'admin@1234';
    }
}

function updateAuthFields() {
    const nameField = document.getElementById('nameField');
    const phoneField = document.getElementById('phoneField');
    const specializationField = document.getElementById('specializationField');
    const licenseField = document.getElementById('licenseField');
    const confirmPasswordField = document.getElementById('confirmPasswordField');
    const authToggle = document.getElementById('authToggle');
    
    // Hide all optional fields first
    nameField.style.display = 'none';
    phoneField.style.display = 'none';
    specializationField.style.display = 'none';
    licenseField.style.display = 'none';
    confirmPasswordField.style.display = 'none';
    
    if (!isLogin) {
        nameField.style.display = 'block';
        confirmPasswordField.style.display = 'block';
        
        if (currentUserType === 'patient') {
            phoneField.style.display = 'block';
        } else if (currentUserType === 'doctor') {
            specializationField.style.display = 'block';
            licenseField.style.display = 'block';
        }
    }
    
    // Hide toggle for admin
    if (currentUserType === 'admin') {
        authToggle.style.display = 'none';
    } else {
        authToggle.style.display = 'block';
    }
    
    // Update submit button and toggle text
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleBtn = document.querySelector('#authToggle button');
    
    if (isLogin) {
        submitBtn.textContent = 'Login';
        if (toggleBtn) toggleBtn.textContent = "Don't have an account? Sign up";
    } else {
        submitBtn.textContent = 'Sign Up';
        if (toggleBtn) toggleBtn.textContent = "Already have an account? Login";
    }
}

function toggleAuthMode() {
    isLogin = !isLogin;
    updateAuthFields();
}

function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Form validation and submission
function initializeForms() {
    const authForm = document.getElementById('authForm');
    const bookingForm = document.getElementById('bookingForm');
    
    authForm.addEventListener('submit', handleAuthSubmit);
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        specialization: document.getElementById('specialization').value,
        license: document.getElementById('license').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
    const errors = validateAuthForm(formData);
    
    if (errors.length > 0) {
        showError(errors.join(', '));
        return;
    }
    
    // Clear errors
    hideError();
    
    // Check for doctor 2FA
    if (currentUserType === 'doctor' && isLogin) {
        showTwoFA();
        return;
    }
    
    // Simulate successful auth
    loginUser(formData);
}

function validateAuthForm(formData) {
    const errors = [];
    
    if (!formData.email) errors.push('Email is required');
    if (!formData.password) errors.push('Password is required');
    
    if (!isLogin) {
        if (!formData.name) errors.push('Name is required');
        if (formData.password !== formData.confirmPassword) {
            errors.push('Passwords do not match');
        }
        if (currentUserType === 'doctor' && !formData.license) {
            errors.push('License number is required for doctors');
        }
    }
    
    if (currentUserType === 'admin' && formData.password !== 'admin@1234') {
        errors.push('Invalid admin credentials');
    }
    
    return errors;
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

// 2FA functionality
function showTwoFA() {
    document.getElementById('twoFAModal').style.display = 'flex';
    document.getElementById('otpCode').focus();
}

function closeTwoFA() {
    document.getElementById('twoFAModal').style.display = 'none';
    document.getElementById('otpCode').value = '';
    document.getElementById('otpError').style.display = 'none';
}

function verifyOTP() {
    const otpCode = document.getElementById('otpCode').value;
    
    if (otpCode === '123456') {
        closeTwoFA();
        const formData = {
            email: document.getElementById('email').value,
            name: document.getElementById('name').value || document.getElementById('email').value.split('@')[0],
            specialization: document.getElementById('specialization').value || 'Ayurvedic Specialist'
        };
        loginUser(formData);
    } else {
        const otpError = document.getElementById('otpError');
        otpError.textContent = 'Invalid OTP code. Use 123456 for demo.';
        otpError.style.display = 'block';
    }
}

function loginUser(userData) {
    currentUser = {
        id: Date.now(),
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        userType: currentUserType,
        specialization: userData.specialization,
        phone: userData.phone
    };
    
    showDashboard(currentUserType);
}

function logout() {
    currentUser = null;
    currentUserType = '';
    showLanding();
}

function updateUserInfo() {
    if (!currentUser) return;
    
    // Update user info in header
    const userNames = document.querySelectorAll('.user-name');
    const userEmails = document.querySelectorAll('.user-email');
    const avatars = document.querySelectorAll('.avatar');
    
    userNames.forEach(el => el.textContent = currentUser.name);
    userEmails.forEach(el => {
        if (currentUser.userType === 'doctor' && currentUser.specialization) {
            el.textContent = currentUser.specialization;
        } else {
            el.textContent = currentUser.email;
        }
    });
    
    avatars.forEach(el => {
        if (!el.classList.contains('large')) {
            el.textContent = currentUser.name.charAt(0).toUpperCase();
        }
    });
}

// Tab management
function showTab(dashboard, tabName) {
    // Update tab buttons
    const tabBtns = document.querySelectorAll(`#${dashboard}Dashboard .tab-btn`);
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    const tabContents = document.querySelectorAll(`#${dashboard}Dashboard .tab-content`);
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${dashboard}-${tabName}`).classList.add('active');
}

// Carousel functionality
function startCarousel() {
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % 3;
        updateCarousel();
    }, 4000);
}

function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    updateCarousel();
    
    // Reset interval
    clearInterval(slideInterval);
    startCarousel();
}

function updateCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    slides.forEach((slide, index) => {
        if (index === currentSlide) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Particles animation
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (6 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Booking functionality
function handleBookingSubmit(e) {
    e.preventDefault();
    
    const formData = {
        doctor: document.getElementById('doctorSelect').value,
        type: document.getElementById('appointmentType').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        symptoms: document.getElementById('symptoms').value
    };
    
    if (!formData.doctor || !formData.date || !formData.time || !formData.symptoms) {
        alert('Please fill all required fields');
        return;
    }
    
    alert('Appointment booked successfully! You will receive a confirmation shortly.');
    document.getElementById('bookingForm').reset();
}

function setMinDate() {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

// Doctor dashboard functions
function confirmAppointment(appointmentId) {
    alert('Appointment confirmed successfully!');
    // Update UI to show confirmed status
    updateAppointmentStatus(appointmentId, 'confirmed');
}

function cancelAppointment(appointmentId) {
    alert('Appointment cancelled successfully!');
    // Update UI to show cancelled status
    updateAppointmentStatus(appointmentId, 'cancelled');
}

function updateAppointmentStatus(appointmentId, status) {
    // This would normally update the backend and refresh the UI
    console.log(`Appointment ${appointmentId} status updated to ${status}`);
}

// Chatbot functionality
const ayurvedaResponses = {
    greeting: [
        "Namaste! I'm AyurBot, your Ayurveda assistant. How can I help you today?",
        "Welcome to AyurVeda Clinic! I'm here to help with your queries about our services.",
        "Hello! I'm here to assist you with Ayurvedic wellness and clinic information."
    ],
    appointment: [
        "To book an appointment, please log in as a patient and use our booking system. You can select your preferred doctor, date, and time.",
        "Our doctors are available Monday to Friday, 9 AM to 5 PM. You can book consultations, follow-ups, or therapy sessions.",
        "For immediate appointment booking, please use the 'Login as Patient' option in the top right corner."
    ],
    ayurveda: [
        "Ayurveda is a 5000-year-old system of natural healing from India. It focuses on balancing mind, body, and consciousness.",
        "Ayurveda uses natural herbs, proper nutrition, and lifestyle practices to promote wellness and treat diseases.",
        "Our clinic specializes in authentic Ayurvedic treatments including Panchakarma, Rasayana therapy, and personalized wellness plans."
    ],
    doctors: [
        "We have certified Ayurvedic practitioners specializing in Panchakarma, Rasayana therapy, Ayurvedic nutrition, and Marma therapy.",
        "Dr. Priya Sharma is our Panchakarma specialist, Dr. Rajesh Kumar focuses on Rasayana therapy, and Dr. Anita Patel specializes in Ayurvedic nutrition.",
        "All our doctors are registered Ayurvedic physicians with years of experience in traditional healing methods."
    ],
    services: [
        "We offer consultations, Panchakarma treatments, herbal medicine, dietary counseling, and lifestyle guidance.",
        "Our services include Abhyanga (oil massage), Shirodhara, Udvartana, Nasya, and customized herbal formulations.",
        "We provide both preventive and curative treatments for various conditions like stress, digestive issues, joint problems, and more."
    ],
    pricing: [
        "Initial consultation starts from ₹500. Treatment costs vary based on the therapy and duration.",
        "We offer package deals for complete Panchakarma treatments. Please consult with our doctors for personalized pricing.",
        "Insurance coverage may be available for certain treatments. Please check with your provider."
    ],
    contact: [
        "You can reach us at admin@ayurvedaclinic.com or call +91 98765 43210.",
        "We're located at 123 Wellness Street, Health City. Open Monday to Friday, 9 AM to 5 PM.",
        "For urgent queries, use our appointment booking system or visit the clinic directly."
    ]
};

function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    
    chatIsOpen = !chatIsOpen;
    
    if (chatIsOpen) {
        chatWindow.style.display = 'flex';
        chatToggle.style.display = 'none';
        // Reset quick questions visibility
        document.getElementById('quickQuestions').style.display = 'block';
    } else {
        chatWindow.style.display = 'none';
        chatToggle.style.display = 'flex';
    }
}

function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('namaste')) {
        return getRandomResponse(ayurvedaResponses.greeting);
    }
    
    if (message.includes('appointment') || message.includes('book') || message.includes('schedule')) {
        return getRandomResponse(ayurvedaResponses.appointment);
    }
    
    if (message.includes('ayurveda') || message.includes('ayurvedic') || message.includes('treatment')) {
        return getRandomResponse(ayurvedaResponses.ayurveda);
    }
    
    if (message.includes('doctor') || message.includes('physician') || message.includes('specialist')) {
        return getRandomResponse(ayurvedaResponses.doctors);
    }
    
    if (message.includes('service') || message.includes('therapy') || message.includes('panchakarma')) {
        return getRandomResponse(ayurvedaResponses.services);
    }
    
    if (message.includes('price') || message.includes('cost') || message.includes('fee')) {
        return getRandomResponse(ayurvedaResponses.pricing);
    }
    
    if (message.includes('contact') || message.includes('address') || message.includes('phone') || message.includes('location')) {
        return getRandomResponse(ayurvedaResponses.contact);
    }
    
    return "I understand you're asking about our Ayurvedic services. Could you please be more specific? You can ask about appointments, treatments, doctors, pricing, or contact information.";
}

function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="message-content">${content}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    isTyping = true;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

function sendMessage() {
    const inputField = document.getElementById('chatInputField');
    const message = inputField.value.trim();
    
    if (!message || isTyping) return;
    
    // Add user message
    addMessage(message, true);
    inputField.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate bot thinking time
    setTimeout(() => {
        hideTypingIndicator();
        const botResponse = getBotResponse(message);
        addMessage(botResponse);
        
        // Always show quick questions after bot response
        document.getElementById('quickQuestions').style.display = 'block';
    }, 1000 + Math.random() * 2000);
}

function sendQuickQuestion(question) {
    document.getElementById('chatInputField').value = question;
    sendMessage();
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function formatTime(time) {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(new Date(`2000-01-01T${time}`));
}

// Event listeners for dynamic content
document.addEventListener('click', function(e) {
    // Handle dynamic button clicks
    if (e.target.matches('.confirm-btn')) {
        const appointmentId = e.target.dataset.appointmentId;
        confirmAppointment(appointmentId);
    }
    
    if (e.target.matches('.cancel-btn')) {
        const appointmentId = e.target.dataset.appointmentId;
        cancelAppointment(appointmentId);
    }
});

// Handle window resize for responsive design
window.addEventListener('resize', function() {
    if (chatIsOpen) {
        // Adjust chat window position on mobile
        const chatWindow = document.getElementById('chatWindow');
        if (window.innerWidth <= 768) {
            chatWindow.style.width = 'calc(100vw - 2rem)';
            chatWindow.style.height = 'calc(100vh - 8rem)';
            chatWindow.style.left = '1rem';
            chatWindow.style.right = '1rem';
        } else {
            chatWindow.style.width = '20rem';
            chatWindow.style.height = '24rem';
            chatWindow.style.left = 'auto';
            chatWindow.style.right = '0';
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (slideInterval) {
        clearInterval(slideInterval);
    }
});