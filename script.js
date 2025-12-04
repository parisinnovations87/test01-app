// SOSTITUISCI QUESTI VALORI CON I TUOI DA SUPABASE
const SUPABASE_URL = 'https://osufnxanlfypfhljemvj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdWZueGFubGZ5cGZobGplbXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU4NTUsImV4cCI6MjA4MDQ2MTg1NX0.Nd9tSlKrknSENkQljdsmAQfj5RqGibXg1W5T6HauHE8';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = null;
let editingNoteId = null;

// Inizializzazione
async function init() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        currentUser = user;
        showApp();
        loadNotes();
    } else {
        showAuth();
    }
}

// Mostra schermata auth
function showAuth() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

// Mostra app
function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('userEmail').textContent = currentUser.email;
}

// Toggle tra login e signup
function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    clearAuthMessage();
}

function showLogin() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    clearAuthMessage();
}

// Registrazione
async function signup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (!email || !password) {
        showAuthMessage('Compila tutti i campi', 'error');
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        showAuthMessage(error.message, 'error');
    } else {
        showAuthMessage('Registrazione completata! Controlla la tua email per confermare l\'account.', 'success');
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
    }
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthMessage('Compila tutti i campi', 'error');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        showAuthMessage(error.message, 'error');
    } else {
        currentUser = data.user;
        showApp();
        loadNotes();
    }
}

// Logout
async function logout() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    showAuth();
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

// Carica note
async function loadNotes() {
    const { data, error } = await supabaseClient
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        showAppMessage('Errore nel caricamento delle note: ' + error.message, 'error');
        return;
    }

    displayNotes(data);
}

// Mostra note
function displayNotes(notes) {
    const container = document.getElementById('notesList');
    
    if (notes.length === 0) {
        container.innerHTML = '<div class="card"><p style="text-align: center; color: #999;">Nessuna nota ancora. Crea la tua prima nota!</p></div>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="card note">
            <h3>${escapeHtml(note.title)}</h3>
            <div class="note-date">${new Date(note.created_at).toLocaleDateString('it-IT')}</div>
            <p>${escapeHtml(note.content || '')}</p>
            <div class="note-actions">
                <button onclick="editNote('${note.id}')">Modifica</button>
                <button class="danger" onclick="deleteNote('${note.id}')">Elimina</button>
            </div>
        </div>
    `).join('');
}

// Salva nota
async function saveNote() {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').value;

    if (!title) {
        showAppMessage('Inserisci almeno un titolo', 'error');
        return;
    }

    if (editingNoteId) {
        // Update
        const { error } = await supabaseClient
            .from('notes')
            .update({ title, content })
            .eq('id', editingNoteId);

        if (error) {
            showAppMessage('Errore nell\'aggiornamento: ' + error.message, 'error');
        } else {
            showAppMessage('Nota aggiornata!', 'success');
            cancelEdit();
            loadNotes();
        }
    } else {
        // Insert
        const { error } = await supabaseClient
            .from('notes')
            .insert([{ 
                title, 
                content, 
                user_id: currentUser.id 
            }]);

        if (error) {
            showAppMessage('Errore nel salvataggio: ' + error.message, 'error');
        } else {
            showAppMessage('Nota salvata!', 'success');
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            loadNotes();
        }
    }
}

// Modifica nota
async function editNote(id) {
    const { data, error } = await supabaseClient
        .from('notes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        showAppMessage('Errore: ' + error.message, 'error');
        return;
    }

    editingNoteId = id;
    document.getElementById('noteTitle').value = data.title;
    document.getElementById('noteContent').value = data.content || '';
    document.getElementById('cancelBtn').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Annulla modifica
function cancelEdit() {
    editingNoteId = null;
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('cancelBtn').classList.add('hidden');
}

// Elimina nota
async function deleteNote(id) {
    if (!confirm('Sei sicuro di voler eliminare questa nota?')) return;

    const { error } = await supabaseClient
        .from('notes')
        .delete()
        .eq('id', id);

    if (error) {
        showAppMessage('Errore nell\'eliminazione: ' + error.message, 'error');
    } else {
        showAppMessage('Nota eliminata!', 'success');
        loadNotes();
    }
}

// Utility per i messaggi
function showAuthMessage(message, type) {
    const el = document.getElementById('authMessage');
    el.className = type;
    el.textContent = message;
    setTimeout(() => el.className = '', 3000);
}

function showAppMessage(message, type) {
    const el = document.getElementById('appMessage');
    el.className = type;
    el.textContent = message;
    setTimeout(() => el.className = '', 3000);
}

function clearAuthMessage() {
    document.getElementById('authMessage').className = '';
    document.getElementById('authMessage').textContent = '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Avvia l'app
init();
