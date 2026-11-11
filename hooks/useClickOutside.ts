import { useEffect, useRef } from "react";

export default function useClickOutside<T extends HTMLElement>(
    onOutsideClick: () => void
) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (
                ref.current &&
                !ref.current.contains(event.target as Node)
            ) {
                onOutsideClick();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onOutsideClick();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onOutsideClick]);

    return ref;
}