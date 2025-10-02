'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tailwind Test</h1>
        <p className="text-gray-600 mb-6">
          Si puedes ver este diseño con colores, gradientes y estilos, 
          entonces Tailwind CSS está funcionando correctamente.
        </p>
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
          Botón de Prueba
        </button>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="h-12 bg-red-500 rounded"></div>
          <div className="h-12 bg-green-500 rounded"></div>
          <div className="h-12 bg-yellow-500 rounded"></div>
        </div>
      </div>
    </div>
  );
}