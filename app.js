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

    // --- Specialized AI Script Generation ---

    const generateVendasBtn = document.getElementById('generate-vendas-btn');
    const vendasProductInput = document.getElementById('vendas-product');
    const vendasResultContainer = document.getElementById('vendas-result-container');
    const vendasResultBox = document.getElementById('vendas-result');

    const generateStoriesBtn = document.getElementById('generate-stories-btn');
    const storiesTopicInput = document.getElementById('stories-topic');
    const storiesResultContainer = document.getElementById('stories-result-container');
    const storiesResultBox = document.getElementById('stories-result');

    const generateFigurinhasBtn = document.getElementById('generate-figurinhas-btn');
    const figurinhasContextInput = document.getElementById('figurinhas-context');
    const figurinhasResultContainer = document.getElementById('figurinhas-result-container');
    const figurinhasResultBox = document.getElementById('figurinhas-result');

    const PROMPTS = {
        vendas: `Você é um copywriter de elite especializado em Instagram. 
Seu objetivo é criar um SCRIPT DE VENDA IMPACTANTE para o produto/serviço fornecido.
O script deve ter:
1. Gancho (Hook) forte nos primeiros 3 segundos.
2. Identificação da dor ou desejo.
3. Apresentação da solução (o produto).
4. Chamada para ação (CTA) clara.
Use emojis, quebras de linha e uma linguagem altamente persuasiva.`,
        
        stories: `Você é um estrategista de conteúdo para Instagram focado em engajamento e SEO.
Seu objetivo é criar uma SEQUÊNCIA DE 5 STORIES sobre o tema fornecido.
A sequência deve seguir:
Story 1: Gancho de curiosidade (SEO: Use palavras-chave no texto).
Story 2: Conteúdo de valor/Dica rápida.
Story 3: Engajamento (Enquete/Caixinha de perguntas).
Story 4: Conexão/Bastidores.
Story 5: CTA para o direct ou link.
Forneça o texto exato para cada story e sugestões de elementos visuais.`,
        
        figurinhas: `You are an expert AI image prompt engineer. The user will give you a context or idea for a sticker.
Your job is to generate ONLY a highly detailed, descriptive text-to-image prompt IN ENGLISH.
It MUST include these keywords to ensure it looks like a WhatsApp sticker: "vector illustration, 2d flat, sticker art design, bold outlines, thick white border, die cut, simple solid background".
DO NOT output any conversational text, greetings, emojis, or explanations. ONLY return the English prompt itself.`
    };

    async function generateScript(type, input, resultBox, container, btn) {
        if (!input.trim()) {
            alert('Por favor, digite um tema ou produto.');
            return;
        }

        const apiKey = localStorage.getItem(GROQ_API_KEY_STORAGE);
        if (!apiKey) {
            apiKeyModal.classList.remove('hidden');
            return;
        }

        // UI Feedback
        const originalBtnText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando...';
        container.classList.remove('hidden');
        resultBox.textContent = 'Aguarde, a IA está criando sua estratégia...';

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        { role: 'system', content: PROMPTS[type] },
                        { role: 'user', content: `O tema/produto é: ${input}` }
                    ],
                    temperature: 0.8,
                })
            });

            if (!response.ok) throw new Error('Erro na API');

            const data = await response.json();
            const content = data.choices[0].message.content.trim();
            
            if (type === 'figurinhas') {
                const seed = Math.floor(Math.random() * 1000000);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(content)}?width=512&height=512&nologo=true&seed=${seed}`;
                
                resultBox.innerHTML = `
                    <div style="text-align: center; margin-bottom: 16px;">
                        <img src="${imageUrl}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); background-color: white;" alt="Figurinha gerada">
                    </div>
                    <div style="text-align: center;">
                        <a href="${imageUrl}" download="figurinha.png" target="_blank" class="btn-primary" style="display: inline-block; width: auto; padding: 10px 20px; font-size: 14px; text-decoration: none;">
                            <i class="fa-solid fa-download"></i> Abrir / Salvar Imagem
                        </a>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 10px;">Para salvar: clique no botão, e quando a imagem abrir, clique com botão direito e "Salvar imagem".</p>
                    </div>
                `;
            } else {
                resultBox.textContent = content;
            }
        } catch (error) {
            resultBox.textContent = 'Erro ao gerar script. Verifique sua conexão ou chave API.';
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
        }
    }

    generateVendasBtn.addEventListener('click', () => {
        generateScript('vendas', vendasProductInput.value, vendasResultBox, vendasResultContainer, generateVendasBtn);
    });

    generateStoriesBtn.addEventListener('click', () => {
        generateScript('stories', storiesTopicInput.value, storiesResultBox, storiesResultContainer, generateStoriesBtn);
    });

    if (generateFigurinhasBtn) {
        generateFigurinhasBtn.addEventListener('click', () => {
            generateScript('figurinhas', figurinhasContextInput.value, figurinhasResultBox, figurinhasResultContainer, generateFigurinhasBtn);
        });
    }

    // --- Copy Functionality ---
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copiado!';
                btn.style.color = '#10b981';
                
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.style.color = '';
                }, 2000);
            });
        });
    });

    // Setup initial state
    checkApiKey();
});
