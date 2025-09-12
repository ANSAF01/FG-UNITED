document.addEventListener('DOMContentLoaded', () => {

    const passwordGroups = document.querySelectorAll('.password-group');
    passwordGroups.forEach(group => {
        const passwordInput = group.querySelector('input[type="password"]');
        const togglePassword = group.querySelector('.toggle-password');

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    togglePassword.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    togglePassword.textContent = '👁️';
                }
            });
        }
    });

    const timerElement = document.getElementById('timer');
    const resendLink = document.querySelector('.resend-link');

    if (timerElement && resendLink) {
        let timeLeft = 60;
        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';

        const timerId = setInterval(() => {
            timeLeft--;
            if (timerElement) timerElement.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timerId);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                resendLink.innerHTML = "Resend Code";
            }
        }, 1000);
    }
});
