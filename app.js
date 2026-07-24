// =====================================================
// STATE MANAGEMENT
// =====================================================

const state = {
    screen: 'setup',
    currentTab: 'setup',
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    
    // Setup
    dossier: '',
    affaireNom: '',
    dateIntervention: '',
    osText: '',
    techReport: '',
    photosBank: [],
    
    // Editor
    titre: '',
    activeSection: 'intro',
    sections: {
        intro: { label: 'Introduction', icon: '📋', hasPhotos: true, text: '', photos: [] },
        hyp: { label: 'Hypothèses et constatations', icon: '🔍', hasPhotos: true, text: '', photos: [] },
        tests: { label: 'Tests réalisés', icon: '✓', hasPhotos: true, text: '', photos: [] },
        conclusion: { label: 'Conclusion', icon: '✔', hasPhotos: false, text: '', photos: [] },
        travaux: { label: 'Travaux à préconiser', icon: '🔧', hasPhotos: false, text: '', photos: [] },
    },
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

function todayFR() {
    const d = new Date();
    const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
}

function dateDDMMYYYY(iso) {
    if (!iso) return '';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function $ (sel) { return document.querySelector(sel); }
function $$ (sel) { return document.querySelectorAll(sel); }

// =====================================================
// MAIN RENDER
// =====================================================

function render() {
    const app = $('#app');
    const html = `
        <div class="container">
            ${renderHeader()}
            ${renderNav()}
            ${state.currentTab === 'setup' ? renderSetup() : ''}
            ${state.currentTab === 'editor' ? renderEditor() : ''}
            ${state.currentTab === 'preview' ? renderPreview() : ''}
        </div>
    `;
    app.innerHTML = html;
    attachHandlers();
}

// =====================================================
// HEADER
// =====================================================

function renderHeader() {
    return `
        <div class="header">
            <div class="header-left">
                <h1>Réalba Étanchéité</h1>
                <p>Générateur de rapports professionnels</p>
            </div>
            <div class="header-right">
                <div class="logo-text">📋 Rapport</div>
            </div>
        </div>
    `;
}

// =====================================================
// NAVIGATION
// =====================================================

function renderNav() {
    return `
        <div class="nav-tabs">
            <button class="nav-tab ${state.currentTab === 'setup' ? 'active' : ''}" data-tab="setup">
                1. Configuration
            </button>
            <button class="nav-tab ${state.currentTab === 'editor' ? 'active' : ''}" data-tab="editor" ${state.titre ? '' : 'disabled'}>
                2. Édition
            </button>
            <button class="nav-tab ${state.currentTab === 'preview' ? 'active' : ''}" data-tab="preview" ${state.titre ? '' : 'disabled'}>
                3. Aperçu
            </button>
        </div>
    `;
}

// =====================================================
// SETUP SCREEN
// =====================================================

function renderSetup() {
    const hasKey = !!state.geminiKey;
    return `
        <div class="tab-content active">
            <div class="api-panel">
                <label>
                    🔑 Clé API Google Gemini
                    ${hasKey ? '<span class="badge">✓ Configurée</span>' : '<span>(gratuit)</span>'}
                </label>
                <input type="password" id="api-key" placeholder="Votre clé Gemini ici..." value="${state.geminiKey}">
                <div class="hint">
                    <strong>100% gratuit !</strong> Obtenez votre clé sur
                    <a href="https://aistudio.google.com/app/apikeys" target="_blank">aistudio.google.com/app/apikeys</a>
                </div>
            </div>

            <div class="card">
                <h2>1️⃣ Dossier et Affaire</h2>
                
                <label>Numéro de dossier</label>
                <input type="text" id="dossier" placeholder="ex: 2796" value="${state.dossier}">
                
                <label>Nom de l'affaire (adresse)</label>
                <input type="text" id="affaire-nom" placeholder="ex: 28/30 rue d'Issy, 92100 Boulogne" value="${state.affaireNom}">
                
                <label>Date d'intervention</label>
                <input type="date" id="date-intervention" value="${state.dateIntervention}">
            </div>

            <div class="card">
                <h2>2️⃣ Ordre de Service</h2>
                
                <div class="dropzone" id="os-drop">
                    <div class="dropzone-icon">📄</div>
                    <div>Déposer le PDF ou le texte</div>
                </div>
                <input type="file" id="os-file" accept="application/pdf">
                
                <label>Ou collez le texte du mail/OS</label>
                <textarea id="os-text" placeholder="Merci d'intervenir sur..." >${state.osText}</textarea>
            </div>

            <div class="card">
                <h2>3️⃣ Rapport Brut du Technicien</h2>
                <textarea id="tech-report" placeholder="Observations, tests réalisés, résultats...">${state.techReport}</textarea>
                <div class="hint">Base pour la génération IA de chaque section</div>
            </div>

            <div class="card">
                <h2>4️⃣ Photos de l'Intervention</h2>
                
                <div class="dropzone" id="photos-drop">
                    <div class="dropzone-icon">📸</div>
                    <div>Ajouter ${state.photosBank.length > 0 ? `(${state.photosBank.length} photo${state.photosBank.length > 1 ? 's' : ''})` : 'vos photos'}</div>
                </div>
                <input type="file" id="photos-file" accept="image/*" multiple>
                
                <div class="thumbnails">
                    ${state.photosBank.map(p => `
                        <div class="thumbnail">
                            <img src="${p.dataURL}">
                            <button class="remove-btn" data-rm-photo="${p.id}">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button class="btn btn-primary" id="go-editor">Continuer vers l'édition →</button>
        </div>
    `;
}

// =====================================================
// EDITOR SCREEN
// =====================================================

function renderEditor() {
    const sec = state.sections[state.activeSection];
    
    return `
        <div class="tab-content active">
            <div class="card">
                <h2>Titre du Rapport</h2>
                <input type="text" id="titre-input" value="${state.titre}" style="font-size: 16px; font-weight: bold;">
            </div>

            <div class="card">
                <h2>Sections</h2>
                <div class="sections-grid">
                    ${Object.keys(state.sections).map(key => `
                        <div class="section-card ${state.activeSection === key ? 'active' : ''}" data-section="${key}">
                            <div class="icon">${state.sections[key].icon}</div>
                            <h3>${state.sections[key].label}</h3>
                            <p>${state.sections[key].text.length} caractères</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h2>${sec.label}</h2>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Texte</h3>
                    <button class="btn btn-secondary btn-small" id="gen-ai-btn" style="margin: 0;">
                        ✨ Générer avec l'IA
                    </button>
                </div>
                <textarea id="section-text">${sec.text}</textarea>
                
                ${sec.hasPhotos ? `
                    <h3 style="margin-top: 25px;">Photos dans cette section (${sec.photos.length})</h3>
                    <div class="thumbnails">
                        ${sec.photos.map(p => `
                            <div class="thumbnail">
                                <img src="${p.dataURL}">
                                <button class="remove-btn" data-rm-inserted="${p.id}">×</button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h3 style="margin-top: 25px;">Banque de photos</h3>
                    <div class="thumbnails">
                        ${state.photosBank.map(p => `
                            <div class="thumbnail" data-pick-photo="${p.id}" style="cursor: pointer;">
                                <img src="${p.dataURL}" style="opacity: ${sec.photos.some(x => x.sourceId === p.id) ? '0.4' : '1'};">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// =====================================================
// PREVIEW SCREEN
// =====================================================

function renderPreview() {
    return `
        <div class="tab-content active">
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-secondary" id="back-preview">← Retour</button>
                <button class="btn btn-primary" id="generate-pdf">📥 Générer PDF</button>
                <button class="btn btn-primary" id="generate-docx">📥 Générer Word</button>
            </div>
            
            <div class="card" style="max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px; font-family: Georgia, serif;">
                    <div style="font-size: 28px; font-weight: bold; color: var(--bleu);">realba</div>
                    <div style="font-size: 18px; font-weight: bold; color: var(--bleu);">ÉTANCHÉITÉ</div>
                    <div style="font-size: 11px; font-weight: bold; color: var(--bleu); margin-top: 5px;">ISOLATION THERMIQUE et ETANCHEITÉ DES TOITURES TERRASSES</div>
                    <div style="font-size: 11px; font-weight: bold; color: var(--bleu); margin-top: 15px; line-height: 1.5;">
                        23, Grande Rue du 8 Mai 1945<br>91430 VAUHALLAN
                    </div>
                </div>
                
                <div style="margin: 20px 0; font-size: 12px;">
                    <div><strong>DOSSIER :</strong> ${state.dossier}</div>
                    <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                        <div><strong>AFFAIRE :</strong> ${state.affaireNom}</div>
                        <div><em>Vauhallan, le ${todayFR()}</em></div>
                    </div>
                </div>
                
                <div style="text-align: center; border: 2px solid #1a1a1a; padding: 10px; margin: 20px 0; font-weight: bold;">
                    RAPPORT D'INTERVENTION
                </div>
                
                <div style="font-size: 12px; font-weight: bold; margin: 15px 0;">
                    Intervention du ${dateDDMMYYYY(state.dateIntervention)}
                </div>
                
                <div style="text-align: center; font-size: 16px; font-weight: bold; margin: 20px 0;">
                    ${state.titre}
                </div>
                
                ${Object.keys(state.sections).map(key => {
                    const sec = state.sections[key];
                    return `
                        <div style="margin-top: 25px;">
                            <div style="font-size: 14px; font-weight: bold; color: var(--bleu-fonce); border-bottom: 1px solid var(--gris-clair); padding-bottom: 5px; margin-bottom: 10px;">
                                ${sec.label}
                            </div>
                            <div style="font-size: 12px; line-height: 1.6; white-space: pre-wrap;">${sec.text}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// =====================================================
// EVENT HANDLERS
// =====================================================

function attachHandlers() {
    // Tabs
    $$('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName === 'editor' && !state.titre) return;
            if (tabName === 'preview' && !state.titre) return;
            state.currentTab = tabName;
            render();
        });
    });

    // Setup handlers
    if (state.currentTab === 'setup') {
        const apiKeyInput = $('#api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('change', (e) => {
                state.geminiKey = e.target.value;
                localStorage.setItem('gemini_api_key', state.geminiKey);
            });
        }

        $('#dossier').addEventListener('input', (e) => {
            state.dossier = e.target.value;
        });

        $('#affaire-nom').addEventListener('input', (e) => {
            state.affaireNom = e.target.value;
        });

        $('#date-intervention').addEventListener('change', (e) => {
            state.dateIntervention = e.target.value;
        });

        $('#os-text').addEventListener('input', (e) => {
            state.osText = e.target.value;
        });

        $('#tech-report').addEventListener('input', (e) => {
            state.techReport = e.target.value;
        });

        // Dropzones
        const osDropzone = $('#os-drop');
        if (osDropzone) {
            osDropzone.addEventListener('click', () => $('#os-file').click());
        }

        const photosDropzone = $('#photos-drop');
        if (photosDropzone) {
            photosDropzone.addEventListener('click', () => $('#photos-file').click());
        }

        $('#os-file')?.addEventListener('change', handleOsFile);
        $('#photos-file')?.addEventListener('change', handlePhotosFiles);

        // Remove photos
        $$('[data-rm-photo]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.rmPhoto;
                state.photosBank = state.photosBank.filter(p => p.id !== id);
                render();
            });
        });

        $('#go-editor')?.addEventListener('click', () => {
            if (!state.dossier || !state.affaireNom || !state.dateIntervention) {
                alert('Veuillez remplir les champs obligatoires');
                return;
            }
            state.titre = state.titre || 'Recherche de fuite';
            state.currentTab = 'editor';
            render();
        });
    }

    // Editor handlers
    if (state.currentTab === 'editor') {
        $('#titre-input')?.addEventListener('input', (e) => {
            state.titre = e.target.value;
        });

        $$('[data-section]').forEach(card => {
            card.addEventListener('click', () => {
                state.activeSection = card.dataset.section;
                render();
            });
        });

        $('#section-text')?.addEventListener('input', (e) => {
            state.sections[state.activeSection].text = e.target.value;
        });

        $('#gen-ai-btn')?.addEventListener('click', generateAIText);

        $$('[data-pick-photo]').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const id = thumb.dataset.pickPhoto;
                const photo = state.photosBank.find(p => p.id === id);
                if (photo) {
                    state.sections[state.activeSection].photos.push({
                        id: uid(),
                        sourceId: id,
                        dataURL: photo.dataURL,
                        legend: ''
                    });
                    render();
                }
            });
        });

        $$('[data-rm-inserted]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.rmInserted;
                state.sections[state.activeSection].photos = 
                    state.sections[state.activeSection].photos.filter(p => p.id !== id);
                render();
            });
        });
    }

    // Preview handlers
    if (state.currentTab === 'preview') {
        $('#back-preview')?.addEventListener('click', () => {
            state.currentTab = 'editor';
            render();
        });

        $('#generate-pdf')?.addEventListener('click', generatePDF);
        $('#generate-docx')?.addEventListener('click', generateDOCX);
    }
}

// =====================================================
// FILE HANDLERS
// =====================================================

function handleOsFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        // Simple text extraction - in production you'd use pdf.js
        state.osText = 'Fichier PDF détecté - veuillez copier le texte manuellement';
        render();
    };
    reader.readAsArrayBuffer(file);
}

function handlePhotosFiles(e) {
    [...e.target.files].forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.photosBank.push({
                id: uid(),
                name: file.name,
                dataURL: ev.target.result
            });
            render();
        };
        reader.readAsDataURL(file);
    });
}

// =====================================================
// AI GENERATION
// =====================================================

async function generateAIText() {
    if (!state.geminiKey) {
        alert('Veuillez configurer votre clé Gemini');
        return;
    }

    if (!state.techReport.trim()) {
        alert('Veuillez remplir le rapport du technicien');
        return;
    }

    const btn = $('#gen-ai-btn');
    btn.classList.add('loading');
    btn.textContent = '⏳ Génération...';
    btn.disabled = true;

    const prompts = {
        intro: `Rédige une introduction professionnelle pour un rapport d'intervention de recherche de fuite sur la base du rapport technique suivant:\n\n${state.techReport}`,
        hyp: `Extrais et reformule UNIQUEMENT les observations visuelles et constatations du rapport technique suivant (pas les tests):\n\n${state.techReport}`,
        tests: `Décris UNIQUEMENT les tests et résultats du rapport technique suivant de manière structurée:\n\n${state.techReport}`,
        conclusion: `Rédige une conclusion qui synthétise l'origine de la fuite et le diagnostic final sur la base de:\n\n${state.techReport}`,
        travaux: `Liste les travaux de reprise d'étanchéité recommandés de manière structurée sur la base de:\n\n${state.techReport}`,
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${state.geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompts[state.activeSection] }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error('Erreur API');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.trim();
        state.sections[state.activeSection].text = text;
        render();
    } catch (error) {
        alert('Erreur: ' + error.message);
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = '✨ Générer avec l\'IA';
    }
}

// =====================================================
// EXPORT
// =====================================================

function generatePDF() {
    alert('Génération PDF - Fonctionnalité à implémenter');
}

function generateDOCX() {
    alert('Génération Word - Fonctionnalité à implémenter');
}

// =====================================================
// INIT
// =====================================================

render();