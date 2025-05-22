// Usuarios válidos
const mockUsers = [
    { username: "admin", password: "admin123" },
    { username: "andres", password: "andres123" },
    { username: "jose", password: "jose123" },
    { username: "maria", password: "maria123" },
    { username: "luisa", password: "luisa123" }
];

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const loginModal = document.getElementById('loginModal');
const closeBtn = document.querySelector('.close');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userBanner = document.querySelector('.user-banner');
const usernameInput = document.getElementById('loginUsername');
const passwordInput = document.getElementById('loginPassword');
const usernameError = document.getElementById('username-error');
const passwordError = document.getElementById('password-error');

// Función para mostrar error
function showError(message, errorElement) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        errorElement.closest('.form-group').querySelector('input').classList.add('error');
    }
}

// Función para limpiar errores
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(msg => msg.classList.remove('visible'));
    document.querySelectorAll('.form-group input').forEach(input => input.classList.remove('error'));
}

// Función para validar el formulario
async function validateForm(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Limpiar errores previos
    clearErrors();

    // Validar campos vacíos
    if (!username || !password) {
        showError('Por favor, completa todos los campos', usernameError);
        return false;
    }

    // Validar longitud mínima
    if (username.length < 4) {
        showError('El usuario debe tener al menos 4 caracteres', usernameError);
        usernameInput.focus();
        return false;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres', passwordError);
        passwordInput.value = '';
        passwordInput.focus();
        return false;
    }

    try {
        // Buscar usuario
        const user = mockUsers.find(u => u.username === username && u.password === password);

        if (user) {
            login(user);
        } else {
            showError('Usuario o contraseña incorrectos', usernameError);
            showError('Usuario o contraseña incorrectos', passwordError);
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        showError('Error al iniciar sesión', usernameError);
    }
}

// Función para iniciar sesión
function login(user) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', user.username);
    loginModal.style.display = 'none';
    updateUI();
    loginForm.reset();
    alert('¡Bienvenido ' + user.username + '!');
}

// Función para cerrar sesión
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    updateUI();
    alert('¡Hasta pronto!');
}

// Función para actualizar la UI
function updateUI() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const username = sessionStorage.getItem('username');

    if (isLoggedIn && username) {
        loginBtn.style.display = 'none';
        userBanner.style.display = 'block';
        document.getElementById('username').textContent = `¡Hola, ${username}!`;
    } else {
        loginBtn.style.display = 'block';
        userBanner.style.display = 'none';
    }
}

// Event Listeners
loginBtn?.addEventListener('click', () => {
    loginModal.style.display = 'block';
    loginForm.reset();
    clearErrors();
});

closeBtn?.addEventListener('click', () => {
    loginModal.style.display = 'none';
    clearErrors();
});

window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        clearErrors();
    }
});

loginForm?.addEventListener('submit', validateForm);

logoutBtn?.addEventListener('click', logout);

// Prevenir espacios en blanco
usernameInput?.addEventListener('input', function() {
    this.value = this.value.trim();
});

// Inicializar estado al cargar
document.addEventListener('DOMContentLoaded', updateUI);

