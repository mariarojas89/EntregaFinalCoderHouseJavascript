document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("name-form")

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const comision = document.getElementById("comision").value;

        let error = false;

        if (name?.trim().length === 0) {
            const nameError = document.createElement('div')
            nameError.setAttribute("id", 'name-error')
            nameError.innerHTML = 'Ingrese un nombre'
            form.appendChild(nameError);
        } else if (comision?.trim().length === 0 || comision.trim() != '53930') {
            const comisionError = document.createElement('div')
            comisionError.setAttribute("id", 'comision-error')
            comisionError.innerHTML = 'Ingrese el codigo correcto de comision'
            form.appendChild(comisionError);
            return;
        } else {
            const nameError = document.getElementById('name-error')
            const comisionError = document.getElementById('comision-error')
            nameError ? form.removeChild(nameError) : undefined
            comisionError ? form.removeChild(comisionError) : undefined

            localStorage.setItem('name', name)
            localStorage.setItem('comision', comision)
            window.location.href = "/html/gameplay.html";
        }
    })
})