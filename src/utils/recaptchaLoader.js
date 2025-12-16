// src/utils/recaptchaLoader.js
export function loadRecaptcha() {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha && window.grecaptcha.render) {
      return resolve(window.grecaptcha)
    }

    // Si ya se está cargando, esperar
    if (document.getElementById('recaptcha-script')) {
      window.addEventListener('recaptcha-loaded', () => resolve(window.grecaptcha))
      return
    }

    // Definir callback global
    window.onRecaptchaLoad = () => {
      window.dispatchEvent(new Event('recaptcha-loaded'))
      resolve(window.grecaptcha)
    }

    const script = document.createElement('script')
    script.id = 'recaptcha-script'
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit'
    script.async = true
    script.defer = true
    script.onerror = reject
    document.head.appendChild(script)
  })
}
