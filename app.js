// STATE
const state = {
    currentTab: 'setup',
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    dossier: localStorage.getItem('dossier') || '',
    affaireNom: localStorage.getItem('affaire_nom') || '',
    dateIntervention: localStorage.getItem('date_intervention') || '',
    osText: localStorage.getItem('os_text') || '',
    techReport: localStorage.getItem('tech_report') || '',
    titre: localStorage.getItem('titre') || '',
    activeSection: 'intro',
    photosBank: JSON.parse(localStorage.getItem('photos_bank') || '[]'),
    sections: {
        intro: { label: 'Introduction', icon: '📋', hasPhotos: true, text: localStorage.getItem('sec_intro') || '', photos: [] },
        hyp: { label: 'Hypothèses et constatations', icon: '🔍', hasPhotos: true, text: localStorage.getItem('sec_hyp') || '', photos: [] },
        tests: { label: 'Tests réalisés', icon: '✓', hasPhotos: true, text: localStorage.getItem('sec_tests') || '', photos: [] },
        conclusion: { label: 'Conclusion', icon: '✔', hasPhotos: false, text: localStorage.getItem('sec_conclusion') || '', photos: [] },
        travaux: { label: 'Travaux à préconiser', icon: '🔧', hasPhotos: false, text: localStorage.getItem('sec_travaux') || '', photos: [] },
    },
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function $ (sel) { return document.querySelector(sel); }
function $$ (sel) { return document.querySelectorAll(sel); }

function saveState() {
    localStorage.setItem('gemini_api_key', state.geminiKey);
    localStorage.setItem('dossier', state.dossier);
    localStorage.setItem('affaire_nom', state.affaireNom);
    localStorage.setItem('date_intervention', state.dateIntervention);
    localStorage.setItem('os_text', state.osText);
    localStorage.setItem('tech_report', state.techReport);
    localStorage.setItem('titre', state.titre);
    localStorage.setItem('photos_bank', JSON.stringify(state.photosBank));
    Object.keys(state.sections).forEach(key => {
        localStorage.setItem(`sec_${key}`, state.sections[key].text);
    });
}

function render() {
    // Update tab visibility
    $$('.tab-content').forEach(el => el.classList.remove('active'));
    $(`#${state.currentTab}`).classList.add('active');

    $$('.tab-btn').forEach(el => el.classList.remove('active'));
    $(`.tab-btn[data-tab="${state.currentTab}"]`).classList.add('active');

    // Tab-specific rendering
    if (state.currentTab === 'setup') {
        renderSetup();
    } else if (state.currentTab === 'editor') {
        renderEditor();
    } else if (state.currentTab === 'preview') {
        renderPreview();
    }

    attachHandlers();
}

function renderSetup() {
    const hasKey = !!state.geminiKey;
    $('#api-status').textContent = hasKey ? '✓ Configurée' : '';
    $('#api-key').value = state.geminiKey;
    $('#dossier').value = state.dossier;
    $('#affaire-nom').value = state.affaireNom;
    $('#date-intervention').value = state.dateIntervention;
    $('#os-text').value = state.osText;
    $('#tech-report').value = state.techReport;

    // Render photo thumbnails
    const photoThumbsDiv = $('#photo-thumbs');
    photoThumbsDiv.innerHTML = state.photosBank.map(p => `
        <div class="thumbnail">
            <img src="${p.dataURL}">
            <button class="remove-btn" data-rm-photo="${p.id}">×</button>
        </div>
    `).join('');
}

function renderEditor() {
    const sec = state.sections[state.activeSection];
    $('#titre-input').value = state.titre;
    $('#section-title').textContent = sec.label;
    $('#section-text').value = sec.text;

    // Render section buttons
    const container = $('#sections-container');
    container.innerHTML = Object.keys(state.sections).map(key => `
        <button class="section-btn ${state.activeSection === key ? 'active' : ''}" data-section="${key}">
            <div class="icon">${state.sections[key].icon}</div>
            <h3>${state.sections[key].label}</h3>
            <p>${state.sections[key].text.length} caractères</p>
        </button>
    `).join('');

    // Render photos section
    const photosSection = $('#photos-section');
    if (sec.hasPhotos) {
        photosSection.innerHTML = `
            <h3 style="margin-top: 25px;">Banque de photos</h3>
            <div class="thumbnails">
                ${state.photosBank.map(p => `
                    <div class="thumbnail" data-pick-photo="${p.id}">
                        <img src="${p.dataURL}">
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        photosSection.innerHTML = '<p class="hint" style="margin-top: 15px;">Cette section n\'a pas de photos</p>';
    }
}

function renderPreview() {
    const html = `
        <div style="text-align: center; margin-bottom: 30px; font-family: Georgia, serif;">
            <div style="font-size: 28px; font-weight: bold; color: var(--bleu);">realba</div>
            <div style="font-size: 18px; font-weight: bold; color: var(--bleu);">ÉTANCHÉITÉ</div>
            <div style="font-size: 11px; font-weight: bold; color: var(--bleu); margin-top: 5px;">ISOLATION THERMIQUE et ETANCHÉITÉ DES TOITURES TERRASSES</div>
            <div style="font-size: 11px; font-weight: bold; color: var(--bleu); margin-top: 15px; line-height: 1.5;">
                23, Grande Rue du 8 Mai 1945<br>91430 VAUHALLAN
            </div>
        </div>
        
        <div style="margin: 20px 0; font-size: 12px;">
            <div><strong>DOSSIER :</strong> ${state.dossier}</div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <div><strong>AFFAIRE :</strong> ${state.affaireNom}</div>
                <div><em>Vauhallan, le ${new Date().toLocaleDateString('fr-FR')}</em></div>
            </div>
        </div>
        
        <div style="text-align: center; border: 2px solid #1a1a1a; padding: 10px; margin: 20px 0; font-weight: bold;">
            RAPPORT D'INTERVENTION
        </div>
        
        <div style="font-size: 12px; font-weight: bold; margin: 15px 0;">
            Intervention du ${state.dateIntervention ? new Date(state.dateIntervention).toLocaleDateString('fr-FR') : 'N/A'}
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
    `;
    $('#preview-content').innerHTML = html;
}

function attachHandlers() {
    // Tab buttons
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'editor' && !state.titre) {
                alert('Remplissez les infos de base d\'abord');
                return;
            }
            state.currentTab = tab;
            render();
        });
    });

    // Setup tab
    if (state.currentTab === 'setup') {
        $('#api-key')?.addEventListener('change', (e) => {
            state.geminiKey = e.target.value;
            saveState();
        });
        $('#dossier')?.addEventListener('input', (e) => {
            state.dossier = e.target.value;
            saveState();
        });
        $('#affaire-nom')?.addEventListener('input', (e) => {
            state.affaireNom = e.target.value;
            saveState();
        });
        $('#date-intervention')?.addEventListener('change', (e) => {
            state.dateIntervention = e.target.value;
            saveState();
        });
        $('#os-text')?.addEventListener('input', (e) => {
            state.osText = e.target.value;
            saveState();
        });
        $('#tech-report')?.addEventListener('input', (e) => {
            state.techReport = e.target.value;
            saveState();
        });

        // Dropzones
        $('#os-drop')?.addEventListener('click', () => $('#os-file').click());
        $('#photos-drop')?.addEventListener('click', () => $('#photos-file').click());

        $('#os-file')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    state.osText = 'Fichier détecté';
                    saveState();
                    render();
                };
                reader.readAsArrayBuffer(file);
            }
        });

        $('#photos-file')?.addEventListener('change', (e) => {
            [...e.target.files].forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    state.photosBank.push({
                        id: uid(),
                        name: file.name,
                        dataURL: ev.target.result
                    });
                    saveState();
                    render();
                };
                reader.readAsDataURL(file);
            });
        });

        $$('[data-rm-photo]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.rmPhoto;
                state.photosBank = state.photosBank.filter(p => p.id !== id);
                saveState();
                render();
            });
        });

        $('#go-editor')?.addEventListener('click', () => {
            if (!state.dossier || !state.affaireNom || !state.dateIntervention) {
                alert('Remplissez tous les champs obligatoires');
                return;
            }
            state.titre = state.titre || 'Recherche de fuite';
            state.currentTab = 'editor';
            saveState();
            render();
        });
    }

    // Editor tab
    if (state.currentTab === 'editor') {
        $('#titre-input')?.addEventListener('input', (e) => {
            state.titre = e.target.value;
            saveState();
        });

        $$('[data-section]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeSection = btn.dataset.section;
                render();
            });
        });

        $('#section-text')?.addEventListener('input', (e) => {
            state.sections[state.activeSection].text = e.target.value;
            saveState();
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
                        dataURL: photo.dataURL
                    });
                    saveState();
                    render();
                }
            });
        });
    }

    // Preview tab
    if (state.currentTab === 'preview') {
        $('#back-preview')?.addEventListener('click', () => {
            state.currentTab = 'editor';
            render();
        });
        $('#generate-docx')?.addEventListener('click', () => alert('Fonctionnalité en développement'));
        $('#generate-pdf')?.addEventListener('click', () => alert('Fonctionnalité en développement'));
    }
}

async function generateAIText() {
    if (!state.geminiKey) {
        alert('Configurez votre clé Gemini d\'abord');
        return;
    }
    if (!state.techReport.trim()) {
        alert('Remplissez le rapport du technicien');
        return;
    }

    const btn = $('#gen-ai-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Génération...';

    const prompts = {
        intro: `Rédige une introduction pour un rapport de recherche de fuite: ${state.techReport}`,
        hyp: `Extrais les observations du rapport: ${state.techReport}`,
        tests: `Décris les tests du rapport: ${state.techReport}`,
        conclusion: `Rédige la conclusion: ${state.techReport}`,
        travaux: `Liste les travaux: ${state.techReport}`,
    };

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${state.geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompts[state.activeSection] }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
                })
            }
        );

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            state.sections[state.activeSection].text = data.candidates[0].content.parts[0].text;
            saveState();
            render();
        }
    } catch (e) {
        alert('Erreur IA: ' + e.message);
        btn.disabled = false;
        btn.textContent = '✨ Générer avec l\'IA';
    }
}

render();