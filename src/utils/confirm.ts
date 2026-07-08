export function confirmDelete(item: string) {
  return window.confirm(`Eliminar ${item}? Esta accion no se puede deshacer.`);
}

export function confirmResetAll() {
  return window.confirm('Restablecer todos los datos de Saldopilot? Esta accion no se puede deshacer.');
}
