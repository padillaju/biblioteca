

// Función para obtener usuarios en el contradoe
async function actualizarTotalUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/cliente'); // tu endpoint que devuelve solo clientes
        if (!response.ok) throw new Error('Error al obtener usuarios');

        const clientes = await response.json();

        // Actualizar el contador en el dashboard
        const totalUsersElement = document.getElementById('totalUsers');
        if (totalUsersElement) {
            totalUsersElement.textContent = clientes.length;
        } else {
            console.warn("No se encontró el elemento #totalUsers");
        }
    } catch (error) {
        console.error('Error al actualizar total de usuarios:', error);
    }
}

// Ejecutar al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    actualizarTotalUsuarios();
});
