document.addEventListener('DOMContentLoaded', () => {
    // Efeito de digitação para o subtítulo
    const subtitulo = document.querySelector('.hero h2');
    if (subtitulo) {
        const textoOriginal = "Sua ferramenta de IA para preparar discursos e tesouros da palavra de Deus com agilidade e inspiração.";
        subtitulo.textContent = '';
        let i = 0;
        function typeWriter() {
            if (i < textoOriginal.length) {
                subtitulo.textContent += textoOriginal.charAt(i);
                i++;
                setTimeout(typeWriter, 50); // Ajuste a velocidade aqui
            }
        }
        typeWriter();
    }

    // Rolagem suave para links de âncora
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}); 