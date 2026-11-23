import { useLayoutEffect, useRef } from 'react';

// Keep the existing board proportions while fitting short projector viewports.
export function ProjectionFrame({ children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    const fit = () => {
      const scale = window.innerWidth >= 768
        ? Math.min(1, (window.innerHeight - 48) / Math.max(1, element.offsetHeight)) : 1;
      element.style.transform = `scale(${Math.max(0.1, scale)})`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    window.addEventListener('resize', fit);
    fit();
    return () => { observer.disconnect(); window.removeEventListener('resize', fit); };
  }, []);
  return <div ref={ref} className="projection-frame w-full shrink-0">{children}</div>;
}
