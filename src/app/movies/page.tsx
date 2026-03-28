"use client";

import { useMovieSearch } from "./useMovieSearch";
// Este componente renderiza la UI.
// Toda la lógica de estado y fetch está encapsulada en el hook useMovieSearch.
export default function MoviesPage() {
    const {
        query,
        results,
        loading,
        error,
        searched,
        suggestions,
        showSuggestions,
        highlightedIndex,
        handleQueryChange,
        handleSubmit,
        handleKeyDown,
        selectSuggestion,
        setShowSuggestions,
        selectedResultIndex,
    } = useMovieSearch();

    return (
        <main className="max-w-3xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-2">Búsqueda semántica de películas</h1>
            <p className="text-gray-500 mb-6 text-sm">
                Describe una película en ingles y encuentra las más similares.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
                {/* Contenedor relativo para anclar el dropdown de sugerencias al input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Ej: a scary monster in space"
                        autoComplete="off"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Dropdown de autocompletado*/}
                    {showSuggestions && (
                        <ul className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 border-t-0 rounded-b shadow-md overflow-hidden">
                            {suggestions.map((suggestion, i) => (
                                <li
                                    key={suggestion.title}
                                    // onMouseDown en lugar de onClick para que se dispare antes del onBlur del input
                                    onMouseDown={() => selectSuggestion(suggestion.title)}
                                    className={`px-3 py-2 cursor-pointer ${
                                        i === highlightedIndex
                                            ? "bg-blue-50"
                                            : "hover:bg-gray-50"
                                    }`}
                                >
                                    {/* Título en negrita; azul cuando está resaltado con el teclado */}
                                    <p className={`text-sm font-medium ${i === highlightedIndex ? "text-blue-700" : ""}`}>
                                        {suggestion.title}
                                    </p>
                                    {/* Preview de la descripción en tipografía más pequeña y tenue */}
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {suggestion.description}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                    {loading ? "Buscando..." : "Buscar"}
                </button>
            </form>

            {/* Mensaje de error si la petición al endpoint falla */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Lista de resultados: título, descripción y puntuación de similitud */}
            {results.length > 0 && (
                <ul className="flex flex-col gap-4">
                    {results.map((movie, i) => (
                        <li
                            key={movie.id}
                            className={`border rounded-lg p-4 transition-colors ${
                                i === selectedResultIndex
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300"
                            }`}
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="min-w-0">
                                    <h2 className="font-semibold text-base truncate">
                                        {movie.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm mt-1">
                                        {movie.description}
                                    </p>
                                </div>
                                {/* Puntuación de similitud coseno expresada en porcentaje */}
                                <span className="text-xs font-mono bg-gray-100 text-gray-700 rounded px-2 py-1 whitespace-nowrap shrink-0">
                                    {(movie.score * 100).toFixed(1)}%
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* Aviso de sin resultados cuando no detecta error */}
            {!loading && searched && results.length === 0 && !error && (
                <p className="text-gray-400 text-sm">No se encontraron resultados.</p>
            )}
        </main>
    );
}
