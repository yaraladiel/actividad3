// js/script.js

// ************************* CONFIGURACIÓN INICIAL Y FUNCIONES UTILITARIAS *************************

/**
 * Debounce: Previene que una función se ejecute demasiadas veces seguidas.
 * Útil para eventos como scroll o resize.
 * @param {Function} func - La función a ejecutar.
 * @param {number} wait - Tiempo de espera en milisegundos.
 * @returns {Function} - Función debounceada.
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ************************* FUNCIONALIDAD DEL MENÚ MÓVIL (TOGGLE) *************************

/**
 * Configura la funcionalidad de abrir/cerrar el menú móvil.
 * Gestiona el estado visual, la accesibilidad (ARIA) y el trap de foco.
 */
function setupMenuToggle() {
    const menuToggle = document.querySelector('.nav__toggle');
    const menu = document.getElementById('menu');

    // Si no existen los elementos, salir de la función.
    if (!menuToggle || !menu) return;

    // Función para abrir el menú
    const openMenu = () => {
        menu.setAttribute('data-open', 'true');
        menuToggle.setAttribute('aria-expanded', 'true');

        // Enfocar el primer elemento interactivo del menú
        const firstMenuItem = menu.querySelector('a');
        if (firstMenuItem) firstMenuItem.focus();
        
        // Agregar event listener para teclado (Escape y Trap de Foco)
        document.addEventListener('keydown', handleMenuKeydown);
    };

    // Función para cerrar el menú
    const closeMenu = () => {
        menu.setAttribute('data-open', 'false');
        menuToggle.setAttribute('aria-expanded', 'false');

        // Devolver el foco al botón de toggle
        menuToggle.focus();
        // Remover event listener de teclado
        document.removeEventListener('keydown', handleMenuKeydown);
    };

    // Manejador de eventos de teclado para el menú
    const handleMenuKeydown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeMenu();
            return;
        }

        // Trap de foco: Mantener el tab dentro del menú cuando está abierto
        if (event.key === 'Tab') {
            const focusableElements = menu.querySelectorAll('a, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length === 0) return;

            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey) { // Si es Shift + Tab
                if (document.activeElement === firstFocusableElement) {
                    event.preventDefault();
                    lastFocusableElement.focus();
                }
            } else { // Si es solo Tab
                if (document.activeElement === lastFocusableElement) {
                    event.preventDefault();
                    firstFocusableElement.focus();
                }
            }
        }
    };

    // Toggle del menú al hacer clic en el botón
    menuToggle.addEventListener('click', () => {
        const isOpen = menu.getAttribute('data-open') === 'true';
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    // Cerrar el menú al hacer clic en un enlace
    const menuLinks = menu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnToggle && menu.getAttribute('data-open') === 'true') {
            closeMenu();
        }
    });
}

// ************************* SCROLL SUAVE (SMOOTH SCROLL) *************************

/**
 * Configura el scroll suave para los enlaces internos (anclas). 
 * Añade un offset para que el contenido no quede oculto tras un header fijo. 
 */
function setupSmoothScroll() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    const header = document.querySelector('header');
    // Calcula la altura del header para el offset. Si no existe, el offset es 0.
    const headerHeight = header ? header.offsetHeight : 0;

    internalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            
            // Si el href es solo "#", scroll al top de la página
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                
                // Actualizar URL sin recargar la página
                history.pushState(null, null, targetId);
            }
        });
    });
}

// ************************* SCROLLSPY (Resaltado de sección activa) *************************

/**
 * Añade y remueve la clase '.is-active' al enlace de navegación
 * correspondiente a la sección actual visible en el viewport.
 */
function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav__menu a[href^="#"]');
    
    // Si no hay secciones o enlaces, salir.
    if (sections.length === 0 || navLinks.length === 0) return;

    // Función que se ejecuta al hacer scroll
    const handleScroll = () => {
        let currentSectionId = "";
        const scrollPosition = window.scrollY + 100; // Offset de activación

        // Encuentra la sección actual basada en la posición del scroll
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = #${section.getAttribute('id')};
            }
        });

        // Actualiza las clases y atributos ARIA de los enlaces de navegación
        navLinks.forEach(link => {
            link.classList.remove('is-active');
            link.removeAttribute('aria-current');
            
            if (link.getAttribute('href') === currentSectionId) {
                link.classList.add('is-active');
                link.setAttribute('aria-current', 'page');
            }
        });
    };

    // Debounceamos el evento scroll para mejorar el rendimiento
    const debouncedScroll = debounce(handleScroll, 15);
    window.addEventListener('scroll', debouncedScroll);

    // Ejecutar una vez al cargar para establecer el estado inicial
    handleScroll();
}

// ************************* MANEJO DE HASH EN LA URL *************************

/**
 * Si la URL tiene un hash al cargar la página (ej: #contacto),
 * realiza un scroll suave hasta esa sección.
 */
function handleHashOnLoad() {
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            // Pequeño timeout para asegurar que el DOM esté completamente cargado
            setTimeout(() => {
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }, 100);
        }
    }
}

// ************************* BOTÓN "VOLVER ARRIBA" (Opcional) *************************

/**
 * Crea y configura un botón que aparece al hacer scroll hacia abajo
 * y permite volver al inicio de la página con un scroll suave.
 */
function setupBackToTop() {
    // Crear el botón y añadirlo al DOM
    const backToTopButton = document.createElement('button');
    backToTopButton.innerHTML = '↑';
    backToTopButton.setAttribute('aria-label', 'Volver al inicio de la página');
    backToTopButton.classList.add('back-to-top');
    document.body.appendChild(backToTopButton);

    // Mostrar u ocultar el botón basado en la posición del scroll
    const toggleBackToTopButton = () => {
        if (window.scrollY > 600) {
            backToTopButton.classList.add('back-to-top--visible');
        } else {
            backToTopButton.classList.remove('back-to-top--visible');
        }
    };

    // Scroll suave al hacer clic en el botón
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Escuchar el evento scroll (con debounce para rendimiento)
    const debouncedToggle = debounce(toggleBackToTopButton, 15);
    window.addEventListener('scroll', debouncedToggle);

    // Ejecutar una vez al cargar para establecer el estado inicial
    toggleBackToTopButton();
}

// ************************* VALIDACIÓN DE FORMULARIO ACCESIBLE *************************

/**
 * Configura la validación en tiempo real y al enviar para el formulario.
 * Gestiona mensajes de error, estados ARIA y retroalimentación visual.
 */
function setupFormValidation() {
    const form = document.getElementById('form-contacto');
    const globalStatus = document.querySelector('.form-status');

    // Si no existe el formulario, salir de la función.
    if (!form) return;

    // 1. Obtener todos los campos validables
    const inputs = form.querySelectorAll('input, textarea, select');
    const submitButton = form.querySelector('button[type="submit"]');

    // 2. Mensajes de error personalizados
    const errorMessages = {
        valueMissing: 'Este campo es obligatorio.',
        typeMismatch: 'Por favor, introduce un formato válido.',
        tooShort: 'Por favor, introduce al menos {minLength} caracteres (introdujiste {valueLength}).',
        patternMismatch: 'Por favor, sigue el formato solicitado.',
    };

    // 3. Función para obtener el mensaje de error personalizado
    function getCustomError(input) {
        const validity = input.validity;
        if (validity.valid) return "";
        
        if (validity.valueMissing) return errorMessages.valueMissing;
        if (validity.typeMismatch) {
            if (input.type === 'email') return 'Por favor, introduce un email válido.';
            return errorMessages.typeMismatch;
        }
        if (validity.patternMismatch) return errorMessages.patternMismatch || input.title || 'Formato incorrecto.';
        if (validity.tooShort) {
            return errorMessages.tooShort
                .replace('{minLength}', input.minLength)
                .replace('{valueLength}', input.value.length);
        }
        
        return 'Por favor, corrige este campo.';
    }

    // 4. Función para encontrar el contenedor de error de un input
    function getErrorContainer(input) {
        // Intenta encontrar por aria-describedby primero
        const describedBy = input.getAttribute('aria-describedby');
        if (describedBy) {
            const container = document.getElementById(describedBy);
            if (container) return container;
        }
        
        // Si no, busca por clase .error cerca del input
        const fieldContainer = input.closest('.field');
        return fieldContainer?.querySelector('.error');
    }

    // 5. Función principal para validar un campo
    function validateInput(input) {
        const errorContainer = getErrorContainer(input);
        const customError = getCustomError(input);
        const isValid = input.validity.valid;

        // Limpiar estado anterior
        input.classList.remove('is-invalid', 'is-valid');
        if (errorContainer) {
            errorContainer.textContent = "";
            errorContainer.removeAttribute('role');
        }

        // Manejar estado de validación
        if (!isValid && customError) {
            // Campo es inválido
            input.classList.add('is-invalid');
            if (errorContainer) {
                errorContainer.textContent = customError;
                // Asegurar que el contenedor de error sea anunciado
                errorContainer.setAttribute('role', 'alert');
            }
            input.setAttribute('aria-invalid', 'true');
        } else if (isValid && input.value.trim() !== '') {
            // Campo es válido y no está vacío
            input.classList.add('is-valid');
            input.setAttribute('aria-invalid', 'false');
        } else {
            // Campo está vacío o en estado neutral
            input.setAttribute('aria-invalid', 'false');
        }

        return isValid;
    }

    // 6. Función para validar TODO el formulario
    function validateAll() {
        let allValid = true;
        let firstInvalidInput = null;

        inputs.forEach(input => {
            // Solo validar campos requeridos o con valor
            if (input.required || input.value.trim() !== '') {
                const isValid = validateInput(input);
                if (!isValid && !firstInvalidInput) {
                    firstInvalidInput = input;
                    allValid = false;
                }
            }
        });
        
        return { allValid, firstInvalidInput };
    }

    // 7. Función para mostrar el estado global
    function setGlobalStatus(message, type = 'info') {
        if (!globalStatus) return;
        globalStatus.textContent = message;
        globalStatus.className = form-status ${type};
        globalStatus.setAttribute('aria-live', 'polite');
    }

    // 8. Función para resetear el estado del formulario
    function resetFormState() {
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
            input.setAttribute('aria-invalid', 'false');
            const errorContainer = getErrorContainer(input);
            if (errorContainer) {
                errorContainer.textContent = "";
                errorContainer.removeAttribute('role');
            }
        });
        
        if (globalStatus) {
            globalStatus.textContent = "";
            globalStatus.className = 'form-status';
        }
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar mensaje';
        }
    }

    // 9. Configurar event listeners para validación en tiempo real
    inputs.forEach(input => {
        // Validar al perder el foco (blur)
        input.addEventListener('blur', () => validateInput(input));
        
        // Validar al escribir (input) - con debounce para no ser muy agresivo
        input.addEventListener('input', debounce(() => {
            if (input.value.trim() !== '') {
                validateInput(input);
            }
        }, 500));
        
        // Limpiar estado de error al empezar a escribir
        input.addEventListener('focus', () => {
            input.classList.remove('is-invalid');
            const errorContainer = getErrorContainer(input);
            if (errorContainer) errorContainer.textContent = "";
        });
    });

    // 10. Manejador de envío del formulario
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevenir envío real

        const { allValid, firstInvalidInput } = validateAll();
        
        if (!allValid) {
            // Enfocar el primer campo inválido
            if (firstInvalidInput) {
                firstInvalidInput.focus();
            }
            setGlobalStatus('Por favor, corrige los errores resaltados en el formulario antes de enviarlo.', 'error');
            return;
        }

        // Deshabilitar el botón para evitar envíos dobles
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        
        setGlobalStatus('Enviando tu mensaje, por favor espera...', 'info');

        try {
            // SIMULACIÓN DE ENVÍO (Reemplazar con fetch() real)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simular una respuesta exitosa
            setGlobalStatus('¡Mensaje enviado con éxito! Te contactaremos pronto.', 'success');
            form.reset();
            resetFormState();

        } catch (error) {
            // Simular/manejar un error de red o del servidor
            console.error('Error al enviar el formulario:', error);
            setGlobalStatus('Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo más tarde.', 'error');
        } finally {
            // Rehabilitar el botón sin importar el resultado
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar mensaje';
            }
        }
    });

    // 11. Resetear estado al limpiar el formulario manualmente
    form.addEventListener('reset', resetFormState);
}

// ************************* ACTUALIZACIÓN DEL AÑO EN EL FOOTER *************************

/**
 * Actualiza automáticamente el año en el footer
 */
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// ************************* INICIALIZACIÓN *************************

/**
 * Inicializa todas las funcionalidades cuando el DOM esté completamente cargado.
 */
document.addEventListener('DOMContentLoaded', function () {
    updateFooterYear();
    setupMenuToggle();
    setupSmoothScroll();
    setupScrollSpy();
    handleHashOnLoad();
    setupBackToTop();
    setupFormValidation();

    console.log('🚀 TechSolutions - Todas las funcionalidades han sido inicializadas correctamente.');
});

// ************************* MANEJO DE ERRORES GLOBALES *************************

window.addEventListener('error', function(e) {
    console.error('Error global capturado:', e.error);
});

// Service Worker (PWA) - Opcional
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado correctamente: ', registration.scope);
            })
            .catch(function(error) {
                console.log('Error registrando ServiceWorker: ', error);
            });
    });
}
