// Language translations for ChatGPT Clone
const translations = {
    en: {
        // Common
        "ChatGPT Clone": "ChatGPT Clone",
        "New Chat": "New Chat",
        "Dark mode": "Dark mode",
        "Light mode": "Light mode",
        
        // Login page
        "Welcome to ChatGPT Clone": "Welcome to ChatGPT Clone",
        "Sign in to start your AI conversation": "Sign in to start your AI conversation",
        "Continue as Guest": "Continue as Guest",
        "Or continue with": "Or continue with",
        "Username (Optional)": "Username (Optional)",
        "Enter your username": "Enter your username",
        "Display Name (Optional)": "Display Name (Optional)",
        "How should we call you?": "How should we call you?",
        "Start Chatting": "Start Chatting",
        "What you can do:": "What you can do:",
        "Chat with AI assistants": "Chat with AI assistants",
        "Upload and analyze images (OCR)": "Upload and analyze images (OCR)",
        "Search the web": "Search the web",
        "Dark/Light mode": "Dark/Light mode",
        "No registration required • Guest access available": "No registration required • Guest access available",
        "Preparing your chat...": "Preparing your chat...",
        
        // Main chat interface
        "How can I help you today?": "How can I help you today?",
        "Start a conversation with AI assistant": "Start a conversation with AI assistant",
        "Message ChatGPT...": "Message ChatGPT...",
        "ChatGPT can make mistakes. Consider checking important information.": "ChatGPT can make mistakes. Consider checking important information.",
        "Upload Image (OCR)": "Upload Image (OCR)",
        "Search Web": "Search Web",
        "Voice Input": "Voice Input",
        "What would you like to search for?": "What would you like to search for?",
        "Search": "Search",
        "Cancel": "Cancel"
    },
    id: {
        // Common
        "ChatGPT Clone": "ChatGPT Clone",
        "New Chat": "Chat Baru",
        "Dark mode": "Mode Gelap",
        "Light mode": "Mode Terang",
        
        // Login page
        "Welcome to ChatGPT Clone": "Selamat Datang di ChatGPT Clone",
        "Sign in to start your AI conversation": "Masuk untuk memulai percakapan AI Anda",
        "Continue as Guest": "Lanjutkan sebagai Tamu",
        "Or continue with": "Atau lanjutkan dengan",
        "Username (Optional)": "Nama Pengguna (Opsional)",
        "Enter your username": "Masukkan nama pengguna Anda",
        "Display Name (Optional)": "Nama Tampilan (Opsional)",
        "How should we call you?": "Bagaimana kami harus memanggil Anda?",
        "Start Chatting": "Mulai Chat",
        "What you can do:": "Apa yang bisa Anda lakukan:",
        "Chat with AI assistants": "Chat dengan asisten AI",
        "Upload and analyze images (OCR)": "Unggah dan analisis gambar (OCR)",
        "Search the web": "Cari di web",
        "Dark/Light mode": "Mode Gelap/Terang",
        "No registration required • Guest access available": "Tidak perlu registrasi • Akses tamu tersedia",
        "Preparing your chat...": "Menyiapkan chat Anda...",
        
        // Main chat interface
        "How can I help you today?": "Bagaimana saya bisa membantu Anda hari ini?",
        "Start a conversation with AI assistant": "Mulai percakapan dengan asisten AI",
        "Message ChatGPT...": "Pesan ChatGPT...",
        "ChatGPT can make mistakes. Consider checking important information.": "ChatGPT dapat membuat kesalahan. Pertimbangkan untuk memeriksa informasi penting.",
        "Upload Image (OCR)": "Unggah Gambar (OCR)",
        "Search Web": "Cari Web",
        "Voice Input": "Input Suara",
        "What would you like to search for?": "Apa yang ingin Anda cari?",
        "Search": "Cari",
        "Cancel": "Batal"
    }
};

// Current language
let currentLanguage = localStorage.getItem('language') || 'en';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Update all text elements
function updateLanguage() {
    // Update all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (element.tagName === 'INPUT' && element.type === 'text') {
            element.placeholder = t(key);
        } else if (element.tagName === 'TEXTAREA') {
            element.placeholder = t(key);
        } else {
            element.textContent = t(key);
        }
    });
    
    // Update document title
    if (document.title.includes('ChatGPT Clone')) {
        document.title = currentLanguage === 'id' ? 'ChatGPT Clone - Asisten AI' : 'ChatGPT Clone - AI Assistant';
    }
    if (document.title.includes('Login')) {
        document.title = currentLanguage === 'id' ? 'Masuk - ChatGPT Clone' : 'Login - ChatGPT Clone';
    }
}

// Language change handler
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateLanguage();
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set language selector value
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener('change', function() {
            changeLanguage(this.value);
        });
    }
    
    // Update language
    updateLanguage();
});
