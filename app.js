document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const navIA = document.getElementById('nav-ia');
    const pageSections = document.querySelectorAll('.page-section');
    const headerTitle = document.getElementById('header-title');
    const headerDesc = document.getElementById('header-desc');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all tabs
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            
            // Set clicked as active
            item.classList.add('active');
            
            // Update Headers
            headerTitle.textContent = item.dataset.title;
            headerDesc.textContent = item.dataset.desc;
            
            // Hide all pages
            pageSections.forEach(page => page.classList.add('hidden'));
            
            // Show target page
            const targetId = item.dataset.target;
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // UI Elements
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendMsgBtn = document.getElementById('send-msg-btn');
    
    const apiKeyWarning = document.getElementById('api-key-warning');
    const setupKeyBtn = document.getElementById('setup-key-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveKeyBtn = document.getElementById('save-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');

    // System Prompt for the AI
    const SYSTEM_PROMPT = `Você é um assistente virtual especializado para o Pack de figurinha do app. 
Objetivo: Ajudar os usuários a entenderem como usar as figurinhas, onde encontrá-las no arquivo baixado, e responder dúvidas sobre formatos (PNG, SVG) ou como importar para programas de edição ou WhatsApp.
Seja sempre muito educado, profissional e use termos animadores. O arquivo é de alta qualidade, tem 4.2GB, e conta com muitas categorias (negócios, tecnologia, marketing, etc). Responda de forma concisa.`;

    // LocalStorage Key for Groq API
    const GROQ_API_KEY_STORAGE = 'groq_api_key';
    
    // Automatically set the provided API key if not exists
    if (!localStorage.getItem(GROQ_API_KEY_STORAGE)) {
        localStorage.setItem(GROQ_API_KEY_STORAGE, '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');
    }

    navIA.addEventListener('click', (e) => {
        e.preventDefault();
        chatWindow.classList.remove('hidden');
        checkApiKey();
    });

    // --- Chat Toggle Logic ---
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.remove('hidden');
        checkApiKey();
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    // --- API Key Modal Logic ---
    setupKeyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        apiKeyModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => {
        apiKeyModal.classList.add('hidden');
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key && key.startsWith('gsk_')) {
            localStorage.setItem(GROQ_API_KEY_STORAGE, key);
            apiKeyModal.classList.add('hidden');
            checkApiKey();
        } else {
            alert('Por favor, insira uma chave válida do Groq (começa com gsk_).');
        }
    });

    // Check if API Key exists and setup UI accordingly
    function checkApiKey() {
        const key = localStorage.getItem(GROQ_API_KEY_STORAGE);
        if (key) {
            apiKeyWarning.classList.add('hidden');
            chatInput.disabled = false;
            sendMsgBtn.disabled = false;
        } else {
            apiKeyWarning.classList.remove('hidden');
            chatInput.disabled = true;
            sendMsgBtn.disabled = true;
        }
    }

    // --- Chat Logic / Groq Integration ---
    
    // Conversation history to keep context
    let chatHistory = [
        { role: 'system', content: SYSTEM_PROMPT }
    ];

    function appendMessage(content, isUser) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        contentDiv.textContent = content; // Using textContent prevents XSS
        
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        
        // Auto scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function callGroqAPI(userMessage) {
        const apiKey = localStorage.getItem(GROQ_API_KEY_STORAGE);
        if (!apiKey) return;

        // Add user message to history
        chatHistory.push({ role: 'user', content: userMessage });

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: chatHistory,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                if(response.status === 401) {
                    throw new Error('Chave API inválida.');
                }
                throw new Error('Erro na comunicação com a IA.');
            }

            const data = await response.json();
            const aiMessageText = data.choices[0].message.content;
            
            // Add AI response to history
            chatHistory.push({ role: 'assistant', content: aiMessageText });
            
            appendMessage(aiMessageText, false);
            
        } catch (error) {
            console.error(error);
            appendMessage(`Erro: ${error.message} Verifique se sua chave da API está correta.`, false);
            // Revert last message from history on error
            chatHistory.pop();
        } finally {
            // Re-enable inputs
            chatInput.disabled = false;
            sendMsgBtn.disabled = false;
            chatInput.focus();
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value.trim();
        
        if (!msg) return;
        
        // Display user message
        appendMessage(msg, true);
        chatInput.value = '';
        
        // Disable inputs while waiting
        chatInput.disabled = true;
        sendMsgBtn.disabled = true;
        
        // Show typing indicator or send request
        callGroqAPI(msg);
    });

    // Setup initial state
    checkApiKey();
});
