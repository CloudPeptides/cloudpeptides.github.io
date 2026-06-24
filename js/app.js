
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
}
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = encodeURIComponent(document.getElementById('name').value);
    const email = encodeURIComponent(document.getElementById('email').value);
    const message = encodeURIComponent(document.getElementById('message').value);
    const subject = encodeURIComponent('Cloud Peptides Contact Form');
    const body = `Name: ${name}%0AEmail: ${email}%0A%0AMessage:%0A${message}`;
    window.location.href = `mailto:the.cloud.peptides@gmail.com?subject=${subject}&body=${body}`;
  });
}
