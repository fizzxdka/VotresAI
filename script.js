// ChatGPT Clone - JavaScript functionality
const API_BASE_URL = 'https://samuraiapi.in';

// Global variables
let currentChatId = null;
let chatHistory = [];
let isTyping = false;
let currentUser = null;
let chatContext = [];
let currentAttachment = null;

// DOM elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const newChatBtn = document.getElementById('newChatBtn');
const themeToggle = document.getElementById('themeToggle');
const modelSelect = document.getElementById('modelSelect');
const modelDisplay = document.getElementById('modelDisplay');
const chatTitle = document.getElementById('chatTitle');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatContainer = document.getElementById('chatContainer');
const chatHistoryContainer = document.getElementById('chatHistory');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadChatHistory();
});

function initializeApp() {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    // Generate initial chat ID
    currentChatId = generateChatId();
    
    // Auto-resize textarea
    setupAutoResize();
    
    // Load available models
    loadAvailableModels();
}

function setupEventListeners() {
    // Sidebar controls
    openSidebarBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // New chat
    newChatBtn.addEventListener('click', startNewChat);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Model selection
    modelSelect.addEventListener('change', updateModel);
    
    // Message input
    messageInput.addEventListener('input', handleInputChange);
    messageInput.addEventListener('keydown', handleKeyDown);
    sendButton.addEventListener('click', sendMessage);
    
    // Attachment features
    const attachButton = document.getElementById('attachButton');
    const attachMenu = document.getElementById('attachMenu');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const searchWebBtn = document.getElementById('searchWebBtn');
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    const fileInput = document.getElementById('fileInput');
    const removeAttachment = document.getElementById('removeAttachment');
    
    if (attachButton) {
        attachButton.addEventListener('click', toggleAttachMenu);
        uploadImageBtn.addEventListener('click', () => {
            fileInput.click();
            hideAttachMenu();
        });
        searchWebBtn.addEventListener('click', () => {
            showSearchModal();
            hideAttachMenu();
        });
        voiceInputBtn.addEventListener('click', () => {
            startVoiceRecording();
            hideAttachMenu();
        });
        fileInput.addEventListener('change', handleFileUpload);
        removeAttachment.addEventListener('click', removeCurrentAttachment);
    }
    
    // Search modal
    const searchModal = document.getElementById('searchModal');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const cancelSearch = document.getElementById('cancelSearch');
    const executeSearch = document.getElementById('executeSearch');
    const searchQuery = document.getElementById('searchQuery');
    
    if (searchModal) {
        closeSearchModal.addEventListener('click', hideSearchModal);
        cancelSearch.addEventListener('click', hideSearchModal);
        executeSearch.addEventListener('click', performWebSearch);
        searchQuery.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performWebSearch();
            }
        });
    }
    
    // Click outside to close menus
    document.addEventListener('click', (e) => {
        if (!attachButton.contains(e.target) && !attachMenu.contains(e.target)) {
            hideAttachMenu();
        }
    });
    
    // Escape key to close sidebar and modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSidebar();
            hideSearchModal();
            hideAttachMenu();
        }
    });
}

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebarOverlay.classList.remove('hidden');
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function updateModel() {
    const selectedModel = modelSelect.value;
    modelDisplay.textContent = modelSelect.options[modelSelect.selectedIndex].text;
}

function generateChatId() {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function startNewChat() {
    currentChatId = generateChatId();
    messagesContainer.innerHTML = '';
    welcomeMessage.style.display = 'block';
    chatTitle.textContent = 'New Chat';
    chatContext = []; // Reset context
    currentAttachment = null;
    hideAttachmentPreview();
    messageInput.focus();
    closeSidebar();
}

function setupAutoResize() {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
}

function handleInputChange() {
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = !hasText || isTyping;
    
    if (hasText) {
        sendButton.classList.remove('bg-gray-300', 'dark:bg-gray-600');
        sendButton.classList.add('bg-blue-500', 'hover:bg-blue-600');
    } else {
        sendButton.classList.add('bg-gray-300', 'dark:bg-gray-600');
        sendButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    // Hide welcome message
    welcomeMessage.style.display = 'none';
    
    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    handleInputChange();
    
    // Set typing state
    isTyping = true;
    
    // Add typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Call API
        const response = await callSamuraiAPI(message);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add AI response
        addMessage(response, 'assistant');
        
        // Update chat title if this is the first message
        if (messagesContainer.children.length === 2) {
            updateChatTitle(message);
        }
        
        // Save to history
        saveChatToHistory();
        
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add error message
        addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'assistant', true);
    } finally {
        isTyping = false;
        handleInputChange();
        messageInput.focus();
    }
}

function addMessage(content, role, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-enter mb-6 ${role === 'user' ? 'ml-auto' : ''}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (role === 'user') {
        messageDiv.innerHTML = `
            <div class="flex justify-end">
                <div class="max-w-3xl">
                    <div class="bg-blue-500 text-white rounded-2xl px-4 py-3 message-bubble">
                        ${escapeHtml(content)}
                    </div>
                    <div class="message-timestamp text-right mt-1">${timestamp}</div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex gap-3">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="flex-1 max-w-3xl">
                    <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 message-bubble ${isError ? 'border-l-4 border-red-500' : ''}">
                        ${formatMessage(content)}
                    </div>
                    <div class="message-timestamp mt-1">${timestamp}</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const typingId = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'mb-6';
    typingDiv.innerHTML = `
        <div class="flex gap-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-white text-sm"></i>
            </div>
            <div class="flex-1 max-w-3xl">
                <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
    return typingId;
}

function removeTypingIndicator(typingId) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
        typingElement.remove();
    }
}

async function callSamuraiAPI(message) {
    const model = modelSelect.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error(data.error?.message || 'API request failed');
        }
    } catch (error) {
        console.error('API Error:', error);
        // Return a fallback response
        return `I apologize, but I'm currently unable to process your request due to a technical issue. This might be because:

• The AI service is temporarily unavailable
• There's a network connectivity issue
• The selected model (${model}) might not be accessible

Please try again in a moment, or try selecting a different model from the sidebar.`;
    }
}

function formatMessage(content) {
    // Basic markdown-like formatting
    let formatted = escapeHtml(content);
    
    // Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold text
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

function updateChatTitle(firstMessage) {
    const title = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;
    chatTitle.textContent = title;
}

function saveChatToHistory() {
    // Only save if we have messages in context
    if (chatContext.length === 0) return;
    
    const chatData = {
        id: currentChatId,
        title: chatTitle.textContent,
        messages: chatContext.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            attachment: msg.attachment
        })),
        model: modelSelect.value,
        timestamp: Date.now()
    };
    
    // Save to localStorage
    let savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const existingIndex = savedChats.findIndex(chat => chat.id === currentChatId);
    
    if (existingIndex >= 0) {
        savedChats[existingIndex] = chatData;
    } else {
        savedChats.unshift(chatData);
    }
    
    // Keep only last 50 chats
    savedChats = savedChats.slice(0, 50);
    
    localStorage.setItem('chatHistory', JSON.stringify(savedChats));
    updateChatHistoryUI();
}

function loadChatHistory() {
    const savedChats = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory = savedChats;
    updateChatHistoryUI();
}

function updateChatHistoryUI() {
    chatHistoryContainer.innerHTML = '';
    
    chatHistory.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item p-3 rounded-lg cursor-pointer transition-colors';
        chatItem.innerHTML = `
            <div class="font-medium text-sm truncate">${escapeHtml(chat.title)}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ${new Date(chat.timestamp).toLocaleDateString()}
            </div>
        `;
        
        chatItem.addEventListener('click', () => loadChat(chat));
        chatHistoryContainer.appendChild(chatItem);
    });
}

function loadChat(chat) {
    currentChatId = chat.id;
    chatTitle.textContent = chat.title;
    modelSelect.value = chat.model;
    updateModel();
    
    messagesContainer.innerHTML = '';
    welcomeMessage.style.display = 'none';
    
    // Restore chat context
    chatContext = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || Date.now(),
        attachment: msg.attachment || null
    }));
    
    // Display messages
    chat.messages.forEach(message => {
        addMessage(message.content, message.role, message.attachment);
    });
    
    closeSidebar();
    messageInput.focus();
}

// Attachment and OCR Functions
function toggleAttachMenu() {
    const attachMenu = document.getElementById('attachMenu');
    attachMenu.classList.toggle('hidden');
}

function hideAttachMenu() {
    const attachMenu = document.getElementById('attachMenu');
    attachMenu.classList.add('hidden');
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }
    
    currentAttachment = {
        type: 'image',
        file: file,
        name: file.name,
        size: file.size
    };
    
    showAttachmentPreview();
    processImageOCR(file);
}

function showAttachmentPreview() {
    const preview = document.getElementById('attachmentPreview');
    const content = document.getElementById('previewContent');
    
    if (currentAttachment && currentAttachment.type === 'image') {
        content.innerHTML = `
            <i class="fas fa-image text-purple-500"></i>
            <div>
                <div class="font-medium text-sm">${currentAttachment.name}</div>
                <div class="text-xs text-gray-500">${formatFileSize(currentAttachment.size)} • Processing OCR...</div>
            </div>
        `;
        preview.classList.remove('hidden');
    }
}

function hideAttachmentPreview() {
    const preview = document.getElementById('attachmentPreview');
    preview.classList.add('hidden');
    currentAttachment = null;
}

function removeCurrentAttachment() {
    hideAttachmentPreview();
    document.getElementById('fileInput').value = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function processImageOCR(file) {
    try {
        // Use Tesseract.js for real OCR
        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng',
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        updateAttachmentPreview(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );
        
        // Clean up the extracted text
        const cleanedText = text.trim().replace(/\s+/g, ' ');
        
        if (cleanedText.length > 0) {
            currentAttachment.ocrText = cleanedText;
            updateAttachmentPreview();
        } else {
            updateAttachmentPreview('No text found in image');
        }
    } catch (error) {
        console.error('OCR processing failed:', error);
        updateAttachmentPreview('OCR processing failed');
    }
}

function updateAttachmentPreview(error = null) {
    const content = document.getElementById('previewContent');
    
    if (error) {
        content.innerHTML = `
            <i class="fas fa-exclamation-triangle text-red-500"></i>
            <div>
                <div class="font-medium text-sm text-red-600">${currentAttachment.name}</div>
                <div class="text-xs text-red-500">${error}</div>
            </div>
        `;
    } else if (currentAttachment && currentAttachment.ocrText) {
        content.innerHTML = `
            <i class="fas fa-image text-purple-500"></i>
            <div>
                <div class="font-medium text-sm">${currentAttachment.name}</div>
                <div class="text-xs text-gray-500">${formatFileSize(currentAttachment.size)} • OCR completed</div>
            </div>
        `;
    }
}

// Search Functions
function showSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchQuery');
    modal.classList.remove('hidden');
    input.focus();
}

function hideSearchModal() {
    const modal = document.getElementById('searchModal');
    const input = document.getElementById('searchQuery');
    modal.classList.add('hidden');
    input.value = '';
}

async function performWebSearch() {
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) return;
    
    hideSearchModal();
    
    // Show loading state
    currentAttachment = {
        type: 'search',
        query: query,
        results: { results: [], loading: true }
    };
    showSearchPreview();
    
    // Perform real web search
    const searchResults = await performRealWebSearch(query);
    
    currentAttachment = {
        type: 'search',
        query: query,
        results: searchResults
    };
    
    showSearchPreview();
}

async function performRealWebSearch(query) {
    try {
        // Use DuckDuckGo Instant Answer API
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const data = await response.json();
        
        let results = [];
        
        // Add abstract if available
        if (data.Abstract) {
            results.push({
                title: data.Heading || query,
                snippet: data.Abstract,
                url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
            });
        }
        
        // Add related topics
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 3).forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
                        snippet: topic.Text,
                        url: topic.FirstURL
                    });
                }
            });
        }
        
        // If no results, add a general search result
        if (results.length === 0) {
            results.push({
                title: `Search results for "${query}"`,
                snippet: `No specific instant answers found. You can search for more detailed results on the web.`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
            });
        }
        
        return {
            query: query,
            results: results,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Web search error:', error);
        // Fallback to basic search result
        return {
            query: query,
            results: [{
                title: `Search for "${query}"`,
                snippet: `Search functionality is currently limited. Please try a different query or search manually.`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
            }],
            timestamp: new Date().toISOString()
        };
    }
}

function showSearchPreview() {
    const preview = document.getElementById('attachmentPreview');
    const content = document.getElementById('previewContent');
    
    if (currentAttachment && currentAttachment.type === 'search') {
        if (currentAttachment.results.loading) {
            content.innerHTML = `
                <i class="fas fa-search text-green-500"></i>
                <div>
                    <div class="font-medium text-sm">Web Search: "${currentAttachment.query}"</div>
                    <div class="text-xs text-gray-500">Searching...</div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <i class="fas fa-search text-green-500"></i>
                <div>
                    <div class="font-medium text-sm">Web Search: "${currentAttachment.query}"</div>
                    <div class="text-xs text-gray-500">${currentAttachment.results.results.length} results found</div>
                </div>
            `;
        }
        preview.classList.remove('hidden');
    }
}

// Voice Recording Functions
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function startVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await processVoiceToText(audioBlob);
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        
        // Show recording indicator
        showVoiceRecordingIndicator();
        
        // Auto stop after 30 seconds
        setTimeout(() => {
            if (isRecording) {
                stopVoiceRecording();
            }
        }, 30000);
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone. Please check permissions.');
    }
}

function stopVoiceRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        hideVoiceRecordingIndicator();
    }
}

function showVoiceRecordingIndicator() {
    const preview = document.getElementById('attachmentPreview');
    const content = document.getElementById('previewContent');
    
    content.innerHTML = `
        <i class="fas fa-microphone text-red-500 animate-pulse"></i>
        <div>
            <div class="font-medium text-sm">Recording voice...</div>
            <div class="text-xs text-gray-500">Click to stop recording</div>
        </div>
    `;
    preview.classList.remove('hidden');
    
    // Add click to stop
    preview.onclick = stopVoiceRecording;
}

function hideVoiceRecordingIndicator() {
    const preview = document.getElementById('attachmentPreview');
    preview.onclick = null;
    preview.classList.add('hidden');
}

async function processVoiceToText(audioBlob) {
    try {
        // Show processing indicator
        const preview = document.getElementById('attachmentPreview');
        const content = document.getElementById('previewContent');
        
        content.innerHTML = `
            <i class="fas fa-microphone text-red-500"></i>
            <div>
                <div class="font-medium text-sm">Processing voice...</div>
                <div class="text-xs text-gray-500">Converting speech to text</div>
            </div>
        `;
        preview.classList.remove('hidden');
        
        // Use Web Speech API for voice recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            
            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                
                // Add transcribed text to input
                const currentText = messageInput.value;
                messageInput.value = currentText + (currentText ? ' ' : '') + transcript;
                
                // Trigger input change
                handleInputChange();
                
                // Hide preview
                hideAttachmentPreview();
                
                // Focus input
                messageInput.focus();
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                hideAttachmentPreview();
                alert('Voice recognition failed. Please try again.');
            };
            
            // Start recognition with recorded audio (fallback to live recognition)
            recognition.start();
        } else {
            // Fallback: just hide preview and show message
            hideAttachmentPreview();
            alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
        }
        
    } catch (error) {
        console.error('Voice processing error:', error);
        hideAttachmentPreview();
        alert('Voice processing failed. Please try again.');
    }
}

// Enhanced sendMessage function with context and attachments
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;
    
    // Hide welcome message
    welcomeMessage.style.display = 'none';
    
    // Prepare message with attachments
    let fullMessage = message;
    let attachmentData = null;
    
    if (currentAttachment) {
        if (currentAttachment.type === 'image' && currentAttachment.ocrText) {
            fullMessage = `[Image uploaded with OCR text: "${currentAttachment.ocrText}"]\n\n${message}`;
            attachmentData = currentAttachment;
        } else if (currentAttachment.type === 'search') {
            const searchContext = currentAttachment.results.results.map(r => 
                `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`
            ).join('\n\n');
            fullMessage = `[Web search results for "${currentAttachment.query}"]:\n${searchContext}\n\nBased on the search results above: ${message}`;
            attachmentData = currentAttachment;
        }
    }
    
    // Add to context
    chatContext.push({
        role: 'user',
        content: fullMessage,
        timestamp: Date.now(),
        attachment: attachmentData
    });
    
    // Add user message to UI
    addMessage(message, 'user', attachmentData);
    
    // Clear input and attachment
    messageInput.value = '';
    messageInput.style.height = 'auto';
    hideAttachmentPreview();
    handleInputChange();
    
    // Set typing state
    isTyping = true;
    
    // Add typing indicator
    const typingId = addTypingIndicator();
    
    try {
        // Call API with context
        const response = await callSamuraiAPIWithContext(fullMessage);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add to context
        chatContext.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
        });
        
        // Add AI response
        addMessage(response, 'assistant');
        
        // Update chat title if this is the first message
        if (chatContext.length === 2) {
            updateChatTitle(message);
        }
        
        // Save to history
        saveChatToHistory();
        
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Add error message
        addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'assistant', true);
    } finally {
        isTyping = false;
        handleInputChange();
        messageInput.focus();
    }
}

async function callSamuraiAPIWithContext(message) {
    const model = modelSelect.value;
    
    try {
        // Prepare messages with context (last 10 messages to avoid token limits)
        const contextMessages = chatContext.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: contextMessages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            throw new Error(data.error?.message || 'API request failed');
        }
    } catch (error) {
        console.error('API Error:', error);
        // Return a fallback response
        return `I apologize, but I'm currently unable to process your request due to a technical issue. This might be because:

• The AI service is temporarily unavailable
• There's a network connectivity issue
• The selected model (${model}) might not be accessible

Please try again in a moment, or try selecting a different model from the sidebar.`;
    }
}

// Enhanced addMessage function with attachment support
function addMessage(content, role, attachment = null, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-enter mb-6 ${role === 'user' ? 'ml-auto' : ''}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (role === 'user') {
        let attachmentHtml = '';
        if (attachment) {
            if (attachment.type === 'image') {
                attachmentHtml = `
                    <div class="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div class="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                            <i class="fas fa-image"></i>
                            <span>Image uploaded: ${attachment.name}</span>
                        </div>
                    </div>
                `;
            } else if (attachment.type === 'search') {
                attachmentHtml = `
                    <div class="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <div class="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <i class="fas fa-search"></i>
                            <span>Web search: "${attachment.query}"</span>
                        </div>
                    </div>
                `;
            }
        }
        
        messageDiv.innerHTML = `
            <div class="flex justify-end">
                <div class="max-w-3xl">
                    ${attachmentHtml}
                    <div class="bg-blue-500 text-white rounded-2xl px-4 py-3 message-bubble">
                        ${escapeHtml(content)}
                    </div>
                    <div class="message-timestamp text-right mt-1">${timestamp}</div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="flex gap-3">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-robot text-white text-sm"></i>
                </div>
                <div class="flex-1 max-w-3xl">
                    <div class="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 message-bubble ${isError ? 'border-l-4 border-red-500' : ''}">
                        ${formatMessage(content)}
                    </div>
                    <div class="message-timestamp mt-1">${timestamp}</div>
                </div>
            </div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Load available models from API
async function loadAvailableModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/v1/models`);
        const data = await response.json();
        
        if (response.ok && data.data) {
            populateModelSelect(data.data);
        } else {
            console.error('Failed to load models:', data);
            // Use fallback models
            populateModelSelect(getFallbackModels());
        }
    } catch (error) {
        console.error('Error loading models:', error);
        // Use fallback models
        populateModelSelect(getFallbackModels());
    }
}

function populateModelSelect(models) {
    // Clear existing options
    modelSelect.innerHTML = '';
    
    // Group models by category for better organization
    const groupedModels = groupModelsByCategory(models);
    
    // Add grouped options
    Object.keys(groupedModels).forEach(category => {
        if (groupedModels[category].length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            groupedModels[category].forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = formatModelName(model.id);
                optgroup.appendChild(option);
            });
            
            modelSelect.appendChild(optgroup);
        }
    });
    
    // Set default model
    if (modelSelect.options.length > 0) {
        // Try to find a good default model
        const preferredModels = [
            'BLACKBOXAI/BLACKBOXAI-PRO',
            'OpenAI/gpt-4o',
            'OpenAI/gpt-4-turbo',
            'Anthropic/claude-3-5-sonnet-20241022'
        ];
        
        let defaultModel = modelSelect.options[0].value;
        for (const preferred of preferredModels) {
            const option = Array.from(modelSelect.options).find(opt => opt.value === preferred);
            if (option) {
                defaultModel = preferred;
                break;
            }
        }
        
        modelSelect.value = defaultModel;
        updateModel();
    }
}

function groupModelsByCategory(models) {
    const groups = {
        'BLACKBOXAI': [],
        'OpenAI': [],
        'Anthropic': [],
        'Google': [],
        'Meta': [],
        'Mistral': [],
        'Qwen': [],
        'Other': []
    };
    
    models.forEach(model => {
        const id = model.id;
        
        if (id.includes('BLACKBOXAI') || id.includes('blackbox')) {
            groups['BLACKBOXAI'].push(model);
        } else if (id.includes('OpenAI') || id.includes('gpt')) {
            groups['OpenAI'].push(model);
        } else if (id.includes('Anthropic') || id.includes('claude')) {
            groups['Anthropic'].push(model);
        } else if (id.includes('Google') || id.includes('gemini') || id.includes('gemma')) {
            groups['Google'].push(model);
        } else if (id.includes('meta') || id.includes('llama')) {
            groups['Meta'].push(model);
        } else if (id.includes('mistral')) {
            groups['Mistral'].push(model);
        } else if (id.includes('qwen') || id.includes('Qwen')) {
            groups['Qwen'].push(model);
        } else {
            groups['Other'].push(model);
        }
    });
    
    return groups;
}

function formatModelName(modelId) {
    // Clean up model name for display
    let name = modelId;
    
    // Remove provider prefixes
    name = name.replace(/^[^\/]+\//, '');
    
    // Replace common patterns
    name = name.replace(/@cf\//, '');
    name = name.replace(/@hf\//, '');
    name = name.replace(/\//g, ' / ');
    
    // Capitalize first letter of each word
    name = name.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return name;
}

function getFallbackModels() {
    return [
        { id: 'BLACKBOXAI/BLACKBOXAI-PRO', object: 'model' },
        { id: 'OpenAI/gpt-4o', object: 'model' },
        { id: 'OpenAI/gpt-4-turbo', object: 'model' },
        { id: 'OpenAI/gpt-3.5-turbo', object: 'model' },
        { id: 'Anthropic/claude-3-5-sonnet-20241022', object: 'model' },
        { id: 'Google/gemini-1.5-pro', object: 'model' },
        { id: 'Meta/llama-3.1-70b-instruct', object: 'model' }
    ];
}

// User authentication check
function checkUserAuthentication() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'login.html';
        return false;
    }
    
    currentUser = JSON.parse(userData);
    
    // Check if login is still valid (24 hours)
    if (Date.now() - currentUser.loginTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Initialize app with authentication
document.addEventListener('DOMContentLoaded', function() {
    if (!checkUserAuthentication()) return;
    
    initializeApp();
    setupEventListeners();
    loadChatHistory();
    
    // Update UI with user info
    if (currentUser && !currentUser.isGuest) {
        // Could show user name in header
        console.log(`Welcome, ${currentUser.displayName}!`);
    }
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful');
        }, function(err) {
            console.log('ServiceWorker registration failed');
        });
    });
}
