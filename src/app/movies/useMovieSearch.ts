import { useState, useRef } from "react";
import DOMPurify from "dompurify";
import type { MovieResult, MovieSuggestion } from "../../lib/types";

// Re-exporta los tipos para que page.tsx no tenga que importar desde lib directamente
export type { MovieResult, MovieSuggestion };

// Forma del objeto que devuelve el hook — estado + handlers listos para conectar al JSX
export type UseMovieSearchReturn = {
    query: string;                  // texto actual del input
    results: MovieResult[];         // películas devueltas por la búsqueda semántica
    loading: boolean;               // true mientras /api/movie-search está en vuelo
    error: string | null;           // mensaje de error si la búsqueda falla
    searched: boolean;              // true en cuanto el usuario ha lanzado al menos una búsqueda
    suggestions: MovieSuggestion[]; // sugerencias del autocompletado
    showSuggestions: boolean;       // controla la visibilidad del dropdown
    highlightedIndex: number;       // índice de la sugerencia resaltada con el teclado (-1 = ninguna)
    selectedResultIndex: number;    // índice del resultado resaltado con Tab tras la búsqueda (-1 = ninguno)
    handleQueryChange: (value: string) => void;
    handleSubmit: (e: React.SyntheticEvent) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    selectSuggestion: (title: string) => void;
    setShowSuggestions: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useMovieSearch(): UseMovieSearchReturn {
    // Estado del input de búsqueda
    const [query, setQuery] = useState("");
    // Resultados de la búsqueda semántica
    const [results, setResults] = useState<MovieResult[]>([]);
    // Indica si hay una petición en curso a /api/movie-search
    const [loading, setLoading] = useState(false);
    // Mensaje de error si la petición falla
    const [error, setError] = useState<string | null>(null);
    // Marca si el usuario ya ha lanzado al menos una búsqueda (para mostrar "sin resultados")
    const [searched, setSearched] = useState(false);
    // Lista de sugerencias devuelta por /api/movie-suggest
    const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
    // Controla si el dropdown de sugerencias está visible
    const [showSuggestions, setShowSuggestions] = useState(false);
    // Índice de la sugerencia actualmente resaltada con ↑ ↓ (-1 = ninguna)
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    // Índice del resultado resaltado con Tab tras la búsqueda (-1 = ninguno)
    const [selectedResultIndex, setSelectedResultIndex] = useState(-1);

    // Referencia al timeout del debounce para poder cancelarlo si el usuario sigue escribiendo
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Referencia al AbortController activo para cancelar peticiones de sugerencias obsoletas
    const abortRef = useRef<AbortController | null>(null);

    // Lanza la búsqueda semántica principal contra /api/movie-search
    async function submitSearch(q: string) {
        if (!q.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);
        setSelectedResultIndex(-1);

        try {
            const res = await fetch(
                `/api/movie-search?q=${encodeURIComponent(q.trim())}&limit=8`
            );
            const rawData = await res.json();

            if (!res.ok) {
                setError("Error al buscar películas. Inténtalo de nuevo.");
                return;
            }

            // Sanitiza los campos de texto para evitar XSS antes de guardarlos en el estado
            const sanitized: MovieResult[] = rawData.results.map((m: MovieResult) => ({
                ...m,
                title: DOMPurify.sanitize(m.title),
                description: DOMPurify.sanitize(m.description),
            }));
            setResults(sanitized);
        } catch {
            setError("Error de conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    }

    // Actualiza el input y dispara la petición de sugerencias con debounce de 250 ms.
    // El debounce evita lanzar una petición por cada tecla pulsada.
    function handleQueryChange(value: string) {
        setQuery(value);
        setHighlightedIndex(-1);

        // Cancela el timeout anterior para reiniciar el debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Si el input queda vacío, limpia el dropdown inmediatamente
        if (!value.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            // Cancela la petición anterior si todavía está en vuelo,
            // evitando que una respuesta lenta sobreescriba una más reciente
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            try {
                const res = await fetch(
                    `/api/movie-suggest?q=${encodeURIComponent(value.trim())}`,
                    { signal: abortRef.current.signal }
                );
                const data = await res.json();
                // Sanitiza los campos de texto para evitar XSS antes de guardarlos en el estado
                const list: MovieSuggestion[] = (data.suggestions ?? []).map((s: MovieSuggestion) => ({
                    title: DOMPurify.sanitize(s.title),
                    description: DOMPurify.sanitize(s.description),
                }));
                setSuggestions(list);
                setShowSuggestions(list.length > 0);
            } catch (err) {
                // AbortError es esperado cuando se cancela; ignorar silenciosamente
                if (err instanceof Error && err.name !== "AbortError") {
                    // Los errores reales de red no deben interrumpir al usuario
                }
            }
        }, 250);
    }

    // El usuario hace clic en una sugerencia: rellena el input y lanza la búsqueda directamente
    function selectSuggestion(title: string) {
        setQuery(title);
        setSuggestions([]);
        setShowSuggestions(false);
        submitSearch(title);
    }

    // Cierra el dropdown y lanza la búsqueda con el texto actual del input
    function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setShowSuggestions(false);
        submitSearch(query);
    }

    // Navegación por teclado: sugerencias (↑ ↓ Tab) y resultados (Tab tras búsqueda)
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
// -- Navegación en el dropdown de sugerencias
        if (showSuggestions) {
            if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
                e.preventDefault(); // evita que Tab mueva el foco al botón
                setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
                e.preventDefault(); // evita que Shift+Tab mueva el foco fuera del input
                setHighlightedIndex((i) => Math.max(i - 1, -1));
            } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                selectSuggestion(suggestions[highlightedIndex].title);
            } else if (e.key === "Escape") {
                setShowSuggestions(false);
            }
            return;
        }

        // -- Navegación en la lista de resultados (solo cuando el dropdown está cerrado)
        if (results.length > 0) {
            if (e.key === "Tab" && !e.shiftKey) {
                if (selectedResultIndex < results.length - 1) {
                    // Aún hay resultados por navegar: captura el Tab
                    e.preventDefault();
                    setSelectedResultIndex((i) => i + 1);
                } else {
                    // Llegamos al último resultado: limpia el resaltado y cede el Tab al navegador
                    setSelectedResultIndex(-1);
                }
            } else if (e.key === "Tab" && e.shiftKey) {
                if (selectedResultIndex > 0) {
                    // Aún hay resultados hacia atrás: captura Shift+Tab
                    e.preventDefault();
                    setSelectedResultIndex((i) => i - 1);
                } else {
                    // No hay más resultados hacia atrás: limpia el resaltado y cede al navegador
                    setSelectedResultIndex(-1);
                }
            } else if (e.key === "ArrowDown") {
                // Scroll programático hacia abajo para no perder el foco del input
                window.scrollBy({ top: 120, behavior: "smooth" });
            } else if (e.key === "ArrowUp") {
                // Scroll programático hacia arriba
                window.scrollBy({ top: -120, behavior: "smooth" });
            } else if (e.key === "Escape") {
                setSelectedResultIndex(-1);
            }
        }
    }

    return {
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
    };
}
