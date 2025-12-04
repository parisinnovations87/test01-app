// Inserisci qui i tuoi dati di Supabase
const SUPABASE_URL = 'https://rlawugnghqwntmxtgrmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXd1Z25naHF3bnRteHRncm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTk4OTEsImV4cCI6MjA4MDQzNTg5MX0.Tygk0YdJVi-csJyjKYeetbKxQKMHJg5n7CM3if99aAs';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error) alert(error.message);
  else alert('Check your email to confirm sign up!');
});

// Login
loginBtn.addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });
  if(error) alert(error.message);
  else setupUser();
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  appDiv.style.display = 'none';
  authDiv.style.display = 'block';
});

// Setup user session
async function setupUser() {
  const user = supabase.auth.getUser();
  if(!user) return;
  authDiv.style.display = 'none';
  appDiv.style.display = 'block';
  logoutBtn.style.display = 'inline';
  loadMessages();
}

// Send message
sendBtn.addEventListener('click', async () => {
  const user = (await supabase.auth.getUser()).data.user;
  const content = messageInput.value;
  if(!content) return;
  await supabase.from('messages').insert([{ user_id: user.id, content }]);
  messageInput.value = '';
  loadMessages();
});

// Load messages
async function loadMessages() {
  const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
  messagesList.innerHTML = '';
  data.forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg.content;
    messagesList.appendChild(li);
  });
}

// Check session on page load
supabase.auth.onAuthStateChange((_event, session) => {
  if(session) setupUser();
});
