
import { useEffect, useRef } from "react";

export default function useClickOutside<T extends HTMLElement>(
    onOutsideClick: () => void
) {
    const ref = useRef<T>(null);
    const callbackRef = useRef(onOutsideClick);

    useEffect(() => {
        callbackRef.current = onOutsideClick;
    }, [onOutsideClick]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target;

            if (
                ref.current &&
                target instanceof Node &&
                !ref.current.contains(target)
            ) {
                callbackRef.current();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                callbackRef.current();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return ref;
}
