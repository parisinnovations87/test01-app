// Inserisci qui i tuoi dati di Supabase
const SUPABASE_URL = 'https://rlawugnghqwntmxtgrmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXd1Z25naHF3bnRteHRncm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTk4OTEsImV4cCI6MjA4MDQzNTg5MX0.Tygk0YdJVi-csJyjKYeetbKxQKMHJg5n7CM3if99aAs';

// ⚠️ NOME CORRETTO:
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const authDiv = document.getElementById('auth');
const appDiv = document.getElementById('app');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const messagesList = document.getElementById('messages');

// Signup
signupBtn.addEventListener('click', async () => {
  const { data, error } = await client.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Signup OK! Controlla l'email se serve conferma.");
});

// Login
loginBtn.addEventListener('click', async () => {
  const { data, error } = await client.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });

  if (error) {
    alert(error.message);
    return;
  }

  setupUser();
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await client.auth.signOut();
  appDiv.style.display = 'none';
  authDiv.style.display = 'block';
});

// Setup user session
async function setupUser() {
  const { data: session } = await client.auth.getSession();
  if (!session || !session.session) return;

  authDiv.style.display = 'none';
  appDiv.style.display = 'block';
  logoutBtn.style.display = 'inline';
  loadMessages();
}

// Send message
sendBtn.addEventListener('click', async () => {
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;

  const content = messageInput.value;
  if (!content) return;

  await client.from('messages').insert([{ user_id: user.id, content }]);

  messageInput.value = '';
  loadMessages();
});

// Load messages
async function loadMessages() {
  const { data, error } = await client
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  messagesList.innerHTML = '';

  if (!data) return;

  data.forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg.content;
    messagesList.appendChild(li);
  });
}

// Auto-login if session exists
client.auth.onAuthStateChange((_event, session) => {
  if (session) setupUser();
});
